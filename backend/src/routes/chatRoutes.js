const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const {
  broadcast,
  connectUser,
  getPresenceSnapshot,
  sendToUser,
} = require('../services/realtimeHub');

const router = express.Router();
const { requireSession, bindAuthenticatedActor } = require('../middleware/adminAuth');
router.use(requireSession);
router.use(bindAuthenticatedActor('user_id', 'sender_id', 'created_by'));

const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `chat_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const allowedTypes = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Formato no permitido para mensajes.'));
  },
  limits: {
    files: 5,
    fileSize: 25 * 1024 * 1024,
  },
});

const groupImageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('La imagen del grupo debe ser PNG, JPG o WEBP.'));
    }
  },
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
});

const ensureTables = async () => {
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) DEFAULT 'active';

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible';

    ALTER TABLE notifications
      DROP CONSTRAINT IF EXISTS notifications_type_check;

    ALTER TABLE notifications
      ADD CONSTRAINT notifications_type_check
      CHECK (
        type IN (
          'new_follower',
          'recognition_received',
          'reaction_received',
          'comment_received',
          'comment_reply_received',
          'mention_received',
          'story_mention',
          'favorite_received',
          'chat_message',
          'report_updated',
          'institutional_challenge'
        )
      );

    CREATE TABLE IF NOT EXISTS chat_conversations (
      id SERIAL PRIMARY KEY,
      is_group BOOLEAN NOT NULL DEFAULT FALSE,
      name VARCHAR(120),
      direct_key VARCHAR(80) UNIQUE,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_participants (
      conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
      sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT,
      message_type VARCHAR(20) DEFAULT 'text',
      media_url TEXT,
      media_mime VARCHAR(120),
      moderation_status VARCHAR(30) DEFAULT 'visible',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE chat_conversations
      ADD COLUMN IF NOT EXISTS group_image_url TEXT;

    CREATE TABLE IF NOT EXISTS chat_message_mentions (
      message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (message_id, mentioned_user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reaction_type VARCHAR(30) NOT NULL DEFAULT 'love',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (message_id, user_id)
    );
  `);
};

const ready = ensureTables().catch((error) => {
  console.error('Error creando tablas de chat:', error.message);
});

const getDirectConversation = async (userA, userB) => {
  const ids = [Number(userA), Number(userB)].sort((a, b) => a - b);
  const directKey = `${ids[0]}:${ids[1]}`;

  const existing = await pool.query(
    'SELECT id FROM chat_conversations WHERE direct_key = $1',
    [directKey]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await pool.query(
    `INSERT INTO chat_conversations (is_group, direct_key, created_by)
     VALUES (FALSE, $1, $2)
     RETURNING id`,
    [directKey, userA]
  );

  await pool.query(
    `INSERT INTO chat_participants (conversation_id, user_id)
     VALUES ($1, $2), ($1, $3)
     ON CONFLICT DO NOTHING`,
    [created.rows[0].id, ids[0], ids[1]]
  );

  return created.rows[0].id;
};

const getConversationParticipants = async (conversationId) => {
  const result = await pool.query(
    'SELECT user_id FROM chat_participants WHERE conversation_id = $1',
    [conversationId]
  );
  return result.rows.map((row) => Number(row.user_id));
};

const parseIdArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveMessageMentions = async ({ messageId, conversationId, senderId, rawIds }) => {
  const requestedIds = Array.from(new Set(
    parseIdArray(rawIds)
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0 && id !== Number(senderId))
  ));
  if (requestedIds.length === 0) return [];

  const valid = await pool.query(
    `SELECT cp.user_id
     FROM chat_participants cp
     WHERE cp.conversation_id = $1
       AND cp.user_id = ANY($2::int[])`,
    [conversationId, requestedIds]
  );
  const validIds = valid.rows.map((row) => Number(row.user_id));
  for (const mentionedUserId of validIds) {
    await pool.query(
      `INSERT INTO chat_message_mentions (message_id, mentioned_user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [messageId, mentionedUserId]
    );
  }
  return validIds;
};

const buildMessagePayload = async (messageId) => {
  const result = await pool.query(
    `SELECT
       m.id,
       m.conversation_id,
       m.sender_id,
       m.content,
       m.message_type,
       m.media_url,
       m.media_mime,
       m.created_at,
       COALESCE(message_reactions.total, 0)::int AS reaction_count,
       NULL::text AS user_reaction,
       COALESCE(u.display_name, u.fullname) AS sender_name,
       u.profile_image_url AS sender_profile_image,
       COALESCE((
         SELECT json_agg(json_build_object(
           'id', mentioned.id,
           'display_name', COALESCE(mentioned.display_name, mentioned.fullname)
         ))
         FROM chat_message_mentions cmm
         JOIN users mentioned ON mentioned.id = cmm.mentioned_user_id
         WHERE cmm.message_id = m.id
       ), '[]'::json) AS mentioned_users
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS total
       FROM chat_message_reactions cmr
       WHERE cmr.message_id = m.id
     ) message_reactions ON TRUE
     WHERE m.id = $1 AND COALESCE(m.moderation_status, 'visible') = 'visible'`,
    [messageId]
  );
  return result.rows[0];
};

const createMessage = async ({ conversationId, senderId, content, file }) => {
  const mediaUrl = file ? `/uploads/chat/${file.filename}` : null;
  const messageType = file
    ? file.mimetype.startsWith('image/')
      ? 'image'
      : file.mimetype.startsWith('audio/')
      ? 'audio'
      : file.mimetype.startsWith('video/')
      ? 'video'
      : 'file'
    : 'text';

  const inserted = await pool.query(
    `INSERT INTO chat_messages
       (conversation_id, sender_id, content, message_type, media_url, media_mime)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      conversationId,
      senderId,
      content || null,
      messageType,
      mediaUrl,
      file?.mimetype || null,
    ]
  );

  await pool.query(
    'UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [conversationId]
  );

  return buildMessagePayload(inserted.rows[0].id);
};

const notifyParticipants = async ({ conversationId, senderId, message, mentionedUserIds = [] }) => {
  const participants = await getConversationParticipants(conversationId);
  const recipients = participants.filter((id) => Number(id) !== Number(senderId));
  const mentionedSet = new Set(mentionedUserIds.map(Number));

  for (const recipientId of recipients) {
    const wasMentioned = mentionedSet.has(Number(recipientId));
    const notification = await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
       VALUES ($1, $2, 'chat_message', 'Nuevo mensaje', $3, $4)
       RETURNING *`,
      [
        recipientId,
        senderId,
        wasMentioned ? `Te mencionaron en un grupo: ${message.content || ''}` : (message.content || 'Te enviaron un archivo.'),
        message.id,
      ]
    );

    if (wasMentioned) {
      await pool.query(
        `UPDATE notifications
         SET title = 'Te mencionaron en un grupo'
         WHERE id = $1`,
        [notification.rows[0].id]
      );
      notification.rows[0].title = 'Te mencionaron en un grupo';
    }

    sendToUser(recipientId, 'notification', notification.rows[0]);
  }

  participants.forEach((participantId) => {
    sendToUser(participantId, 'message', message);
  });
};

router.get('/events/:userId', async (req, res) => {
  await ready;

  const userId = req.authUser.id;
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders?.();

  const disconnect = connectUser(userId, res);
  const ping = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(ping);
    disconnect();
  });
});

router.get('/presence', (req, res) => {
  res.json(getPresenceSnapshot());
});

router.get('/group-candidates', async (req, res) => {
  await ready;
  const query = String(req.query.q || '').trim();
  const values = [req.authUser.id];
  let searchClause = '';
  if (query) {
    values.push(`%${query}%`);
    searchClause = `
      AND (
        COALESCE(u.display_name, u.fullname) ILIKE $2
        OR u.fullname ILIKE $2
        OR u.email ILIKE $2
      )`;
  }

  const result = await pool.query(
    `SELECT
       u.id,
       u.fullname,
       COALESCE(u.display_name, u.fullname) AS display_name,
       u.email,
       u.profile_image_url
     FROM users u
     WHERE u.id <> $1
       AND COALESCE(u.account_status, 'active') = 'active'
       AND COALESCE(u.moderation_status, 'visible') = 'visible'
       ${searchClause}
     ORDER BY COALESCE(u.display_name, u.fullname) ASC
     LIMIT 500`,
    values
  );

  res.json(result.rows);
});

router.get('/conversations/:userId', async (req, res) => {
  await ready;
  const userId = req.authUser.id;

  const result = await pool.query(
    `SELECT
       c.id,
       c.is_group,
       c.name,
       c.group_image_url,
       c.updated_at,
       cp.last_read_at,
       lm.id AS last_message_id,
       lm.content AS last_message_content,
       lm.message_type AS last_message_type,
       lm.created_at AS last_message_at,
       lm.sender_id AS last_sender_id,
       CASE
         WHEN c.is_group THEN c.name
         ELSE COALESCE(other_user.display_name, other_user.fullname)
       END AS display_name,
       CASE WHEN c.is_group THEN NULL ELSE other_user.id END AS other_user_id,
       CASE WHEN c.is_group THEN c.group_image_url ELSE other_user.profile_image_url END AS other_profile_image,
       afd.code AS other_frame_code,
       unread.total AS unread_count
     FROM chat_participants cp
     JOIN chat_conversations c ON c.id = cp.conversation_id
     LEFT JOIN LATERAL (
       SELECT *
       FROM chat_messages
       WHERE conversation_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON TRUE
     LEFT JOIN LATERAL (
       SELECT u.*
       FROM chat_participants cp2
       JOIN users u ON u.id = cp2.user_id
       WHERE cp2.conversation_id = c.id
         AND cp2.user_id <> $1
       ORDER BY u.id
       LIMIT 1
     ) other_user ON TRUE
     LEFT JOIN user_avatar_frames uaf
       ON uaf.user_id = other_user.id
      AND uaf.is_equipped = TRUE
     LEFT JOIN avatar_frame_definitions afd
       ON afd.id = uaf.frame_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS total
       FROM chat_messages m2
       WHERE m2.conversation_id = c.id
         AND m2.sender_id <> $1
         AND m2.created_at > cp.last_read_at
     ) unread ON TRUE
     WHERE cp.user_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  res.json(result.rows);
});

router.get('/conversations/:conversationId/messages', async (req, res) => {
  await ready;
  const { conversationId } = req.params;
  const userId = req.authUser.id;

  const allowed = await pool.query(
    'SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (!allowed.rows[0]) return res.status(403).json({ error: 'No tienes acceso a este chat.' });

  const result = await pool.query(
    `SELECT
       m.id,
       m.conversation_id,
       m.sender_id,
       m.content,
       m.message_type,
       m.media_url,
       m.media_mime,
       m.created_at,
       COALESCE(message_reactions.total, 0)::int AS reaction_count,
       own_reaction.reaction_type AS user_reaction,
       COALESCE(u.display_name, u.fullname) AS sender_name,
       u.profile_image_url AS sender_profile_image,
       COALESCE((
         SELECT json_agg(json_build_object(
           'id', mentioned.id,
           'display_name', COALESCE(mentioned.display_name, mentioned.fullname)
         ))
         FROM chat_message_mentions cmm
         JOIN users mentioned ON mentioned.id = cmm.mentioned_user_id
         WHERE cmm.message_id = m.id
       ), '[]'::json) AS mentioned_users
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::int AS total
       FROM chat_message_reactions cmr
       WHERE cmr.message_id = m.id
     ) message_reactions ON TRUE
     LEFT JOIN LATERAL (
       SELECT reaction_type
       FROM chat_message_reactions cmr
       WHERE cmr.message_id = m.id AND cmr.user_id = $2
       LIMIT 1
     ) own_reaction ON TRUE
     WHERE m.conversation_id = $1 AND COALESCE(m.moderation_status, 'visible') = 'visible'
     ORDER BY m.created_at ASC
     LIMIT 200`,
    [conversationId, userId]
  );

  res.json(result.rows);
});

router.get('/conversations/:conversationId/participants', async (req, res) => {
  await ready;
  const { conversationId } = req.params;
  const allowed = await pool.query(
    'SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, req.authUser.id]
  );
  if (!allowed.rows[0]) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });

  const result = await pool.query(
    `SELECT
       u.id,
       u.fullname,
       COALESCE(u.display_name, u.fullname) AS display_name,
       u.email,
       u.profile_image_url,
       cp.joined_at,
       (u.id = c.created_by) AS is_admin
     FROM chat_participants cp
     JOIN chat_conversations c ON c.id = cp.conversation_id
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = $1
     ORDER BY COALESCE(u.display_name, u.fullname) ASC`,
    [conversationId]
  );
  res.json(result.rows);
});

router.post('/conversations/:conversationId/participants', async (req, res) => {
  await ready;
  const conversationId = Number(req.params.conversationId);
  const requestedIds = Array.from(new Set(
    parseIdArray(req.body.participant_ids)
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
  ));

  const group = await pool.query(
    `SELECT id, name, created_by FROM chat_conversations
     WHERE id = $1 AND is_group = TRUE`,
    [conversationId]
  );
  if (!group.rows[0]) return res.status(404).json({ error: 'El grupo no existe.' });
  if (Number(group.rows[0].created_by) !== Number(req.authUser.id)) {
    return res.status(403).json({ error: 'Solo el administrador puede invitar integrantes.' });
  }
  if (requestedIds.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos una persona.' });
  }

  const currentCount = await pool.query(
    'SELECT COUNT(*)::int AS total FROM chat_participants WHERE conversation_id = $1',
    [conversationId]
  );
  const existing = await pool.query(
    `SELECT user_id FROM chat_participants
     WHERE conversation_id = $1 AND user_id = ANY($2::int[])`,
    [conversationId, requestedIds]
  );
  const existingSet = new Set(existing.rows.map((row) => Number(row.user_id)));
  const newIds = requestedIds.filter((id) => !existingSet.has(id));
  if (Number(currentCount.rows[0].total) + newIds.length > 200) {
    return res.status(400).json({ error: 'El grupo no puede superar 200 integrantes.' });
  }

  const validUsers = await pool.query(
    `SELECT id FROM users
     WHERE id = ANY($1::int[])
       AND COALESCE(account_status, 'active') = 'active'
       AND COALESCE(moderation_status, 'visible') = 'visible'`,
    [newIds]
  );
  if (validUsers.rows.length !== newIds.length) {
    return res.status(400).json({ error: 'Uno o más usuarios no están disponibles.' });
  }

  for (const row of validUsers.rows) {
    await pool.query(
      `INSERT INTO chat_participants (conversation_id, user_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [conversationId, row.id]
    );
    const notification = await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
       VALUES ($1, $2, 'chat_message', 'Te agregaron a un grupo', $3, $4)
       RETURNING *`,
      [row.id, req.authUser.id, `Ahora formas parte de ${group.rows[0].name}.`, conversationId]
    );
    sendToUser(row.id, 'notification', notification.rows[0]);
    sendToUser(row.id, 'conversation', { id: conversationId });
  }

  const participants = await getConversationParticipants(conversationId);
  participants.forEach((participantId) => sendToUser(participantId, 'conversation', { id: conversationId }));
  return res.json({ success: true, added: validUsers.rows.length });
});

router.delete('/conversations/:conversationId/participants/:participantId', async (req, res) => {
  await ready;
  const conversationId = Number(req.params.conversationId);
  const participantId = Number(req.params.participantId);
  const group = await pool.query(
    `SELECT id, created_by FROM chat_conversations
     WHERE id = $1 AND is_group = TRUE`,
    [conversationId]
  );
  if (!group.rows[0]) return res.status(404).json({ error: 'El grupo no existe.' });
  if (Number(group.rows[0].created_by) !== Number(req.authUser.id)) {
    return res.status(403).json({ error: 'Solo el administrador puede eliminar integrantes.' });
  }
  if (participantId === Number(req.authUser.id)) {
    return res.status(400).json({ error: 'Usa la opcion Salir del grupo.' });
  }

  const removed = await pool.query(
    `DELETE FROM chat_participants
     WHERE conversation_id = $1 AND user_id = $2
     RETURNING user_id`,
    [conversationId, participantId]
  );
  if (!removed.rows[0]) return res.status(404).json({ error: 'La persona no pertenece al grupo.' });
  sendToUser(participantId, 'conversation_removed', { conversation_id: conversationId });
  const remaining = await getConversationParticipants(conversationId);
  remaining.forEach((id) => sendToUser(id, 'conversation', { id: conversationId }));
  return res.json({ success: true });
});

router.post('/conversations/:conversationId/leave', async (req, res) => {
  await ready;
  const conversationId = Number(req.params.conversationId);
  const userId = Number(req.authUser.id);
  const group = await pool.query(
    `SELECT id, created_by FROM chat_conversations
     WHERE id = $1 AND is_group = TRUE`,
    [conversationId]
  );
  if (!group.rows[0]) return res.status(404).json({ error: 'El grupo no existe.' });

  const membership = await pool.query(
    'SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  if (!membership.rows[0]) return res.status(404).json({ error: 'No perteneces a este grupo.' });

  await pool.query(
    'DELETE FROM chat_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );

  if (Number(group.rows[0].created_by) === userId) {
    const successor = await pool.query(
      `SELECT user_id FROM chat_participants
       WHERE conversation_id = $1 ORDER BY joined_at ASC, user_id ASC LIMIT 1`,
      [conversationId]
    );
    if (successor.rows[0]) {
      await pool.query(
        'UPDATE chat_conversations SET created_by = $1 WHERE id = $2',
        [successor.rows[0].user_id, conversationId]
      );
    } else {
      await pool.query('DELETE FROM chat_conversations WHERE id = $1', [conversationId]);
    }
  }

  sendToUser(userId, 'conversation_removed', { conversation_id: conversationId });
  const remaining = await getConversationParticipants(conversationId);
  remaining.forEach((id) => sendToUser(id, 'conversation', { id: conversationId }));
  return res.json({ success: true });
});

router.post(
  '/direct/:targetUserId/messages',
  upload.array('attachments', 5),
  bindAuthenticatedActor('user_id', 'sender_id'),
  async (req, res) => {
  await ready;
  const { targetUserId } = req.params;
  const { sender_id, content, mentioned_user_ids } = req.body;

  if (!sender_id || !targetUserId) {
    return res.status(400).json({ error: 'sender_id y targetUserId son obligatorios.' });
  }

  if (!String(content || '').trim() && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ error: 'Escribe un mensaje o adjunta un archivo.' });
  }

  const conversationId = await getDirectConversation(sender_id, targetUserId);
  const files = req.files?.length ? req.files : [null];
  const messages = [];

  for (const file of files) {
    const message = await createMessage({
      conversationId,
      senderId: sender_id,
      content: file ? content : content,
      file,
    });
    const mentionedUserIds = await saveMessageMentions({
      messageId: message.id,
      conversationId,
      senderId: sender_id,
      rawIds: mentioned_user_ids,
    });
    const enrichedMessage = await buildMessagePayload(message.id);
    messages.push(enrichedMessage);
    await notifyParticipants({ conversationId, senderId: sender_id, message: enrichedMessage, mentionedUserIds });
  }

  res.json({ conversation_id: conversationId, messages });
  }
);

router.post(
  '/conversations/:conversationId/messages',
  upload.array('attachments', 5),
  bindAuthenticatedActor('user_id', 'sender_id'),
  async (req, res) => {
  await ready;
  const { conversationId } = req.params;
  const { sender_id, content, mentioned_user_ids } = req.body;

  const allowed = await pool.query(
    'SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, sender_id]
  );
  if (!allowed.rows[0]) return res.status(403).json({ error: 'No tienes acceso a este chat.' });

  if (!String(content || '').trim() && (!req.files || req.files.length === 0)) {
    return res.status(400).json({ error: 'Escribe un mensaje o adjunta un archivo.' });
  }

  const files = req.files?.length ? req.files : [null];
  const messages = [];

  for (const file of files) {
    const message = await createMessage({
      conversationId,
      senderId: sender_id,
      content,
      file,
    });
    const mentionedUserIds = await saveMessageMentions({
      messageId: message.id,
      conversationId,
      senderId: sender_id,
      rawIds: mentioned_user_ids,
    });
    const enrichedMessage = await buildMessagePayload(message.id);
    messages.push(enrichedMessage);
    await notifyParticipants({ conversationId, senderId: sender_id, message: enrichedMessage, mentionedUserIds });
  }

  res.json({ conversation_id: Number(conversationId), messages });
  }
);

router.post(
  '/groups',
  groupImageUpload.single('groupImage'),
  bindAuthenticatedActor('created_by'),
  async (req, res) => {
  await ready;
  const { name, created_by } = req.body;
  const participantIds = Array.from(new Set(
    parseIdArray(req.body.participant_ids)
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0 && id !== Number(created_by))
  ));
  const cleanName = String(name || '').trim();

  if (!cleanName || !created_by) {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio.' });
  }
  if (cleanName.length > 120) {
    return res.status(400).json({ error: 'El nombre no puede superar 120 caracteres.' });
  }
  if (participantIds.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos una persona.' });
  }
  if (participantIds.length > 199) {
    return res.status(400).json({ error: 'El grupo no puede superar 200 integrantes.' });
  }

  const validUsers = await pool.query(
    `SELECT id FROM users
     WHERE id = ANY($1::int[])
       AND COALESCE(account_status, 'active') = 'active'
       AND COALESCE(moderation_status, 'visible') = 'visible'`,
    [participantIds]
  );
  if (validUsers.rows.length !== participantIds.length) {
    return res.status(400).json({ error: 'Uno o más participantes no están disponibles.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const groupImageUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;
    const created = await client.query(
      `INSERT INTO chat_conversations (is_group, name, created_by, group_image_url)
       VALUES (TRUE, $1, $2, $3)
       RETURNING *`,
      [cleanName, created_by, groupImageUrl]
    );

    const participants = [Number(created_by), ...validUsers.rows.map((row) => Number(row.id))];
    for (const participantId of participants) {
      await client.query(
        `INSERT INTO chat_participants (conversation_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [created.rows[0].id, participantId]
      );
    }
    await client.query('COMMIT');

    const response = {
      ...created.rows[0],
      display_name: created.rows[0].name,
      other_profile_image: created.rows[0].group_image_url,
      participant_count: participants.length,
    };
    for (const participantId of participants.filter((id) => Number(id) !== Number(created_by))) {
      const notification = await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, 'chat_message', 'Te agregaron a un grupo', $3, $4)
         RETURNING *`,
        [participantId, created_by, `Ahora formas parte de ${cleanName}.`, created.rows[0].id]
      );
      sendToUser(participantId, 'notification', notification.rows[0]);
    }
    participants.forEach((participantId) => sendToUser(participantId, 'conversation', response));
    return res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    if (req.file) {
      fs.unlink(path.join(uploadDir, req.file.filename), () => {});
    }
    console.error('Error creando grupo:', error);
    return res.status(500).json({ error: 'No se pudo crear el grupo.' });
  } finally {
    client.release();
  }
  }
);

router.patch('/conversations/:conversationId/read', async (req, res) => {
  await ready;
  const { conversationId } = req.params;
  const { user_id } = req.body;

  await pool.query(
    `UPDATE chat_participants
     SET last_read_at = CURRENT_TIMESTAMP
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, user_id]
  );

  res.json({ success: true });
});

router.post('/conversations/:conversationId/typing', async (req, res) => {
  await ready;
  const { conversationId } = req.params;
  const { user_id, is_typing } = req.body;

  const allowed = await pool.query(
    'SELECT 1 FROM chat_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, user_id]
  );
  if (!allowed.rows[0]) return res.status(403).json({ error: 'No tienes acceso a este chat.' });

  const participants = await getConversationParticipants(conversationId);
  participants
    .filter((participantId) => Number(participantId) !== Number(user_id))
    .forEach((participantId) => {
      sendToUser(participantId, 'typing', {
        conversation_id: Number(conversationId),
        user_id: Number(user_id),
        is_typing: Boolean(is_typing),
      });
    });

  res.json({ success: true });
});

router.post('/messages/:messageId/reaction', async (req, res) => {
  await ready;
  const { messageId } = req.params;
  const userId = req.authUser.id;
  const reactionType = String(req.body.reaction_type || 'love');

  const messageResult = await pool.query(
    `SELECT m.id, m.conversation_id
     FROM chat_messages m
     JOIN chat_participants cp ON cp.conversation_id = m.conversation_id
     WHERE m.id = $1 AND cp.user_id = $2
       AND COALESCE(m.moderation_status, 'visible') = 'visible'`,
    [messageId, userId]
  );
  if (!messageResult.rows[0]) return res.status(403).json({ error: 'No tienes acceso a este mensaje.' });

  const existing = await pool.query(
    `SELECT reaction_type FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2`,
    [messageId, userId]
  );

  let userReaction = reactionType;
  if (existing.rows[0]?.reaction_type === reactionType) {
    await pool.query(`DELETE FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2`, [messageId, userId]);
    userReaction = null;
  } else {
    await pool.query(
      `INSERT INTO chat_message_reactions (message_id, user_id, reaction_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id)
       DO UPDATE SET reaction_type = EXCLUDED.reaction_type, created_at = CURRENT_TIMESTAMP`,
      [messageId, userId, reactionType]
    );
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM chat_message_reactions WHERE message_id = $1`,
    [messageId]
  );
  const payload = {
    message_id: Number(messageId),
    conversation_id: Number(messageResult.rows[0].conversation_id),
    user_id: Number(userId),
    reaction_type: userReaction,
    reaction_count: countResult.rows[0].total,
  };

  const participants = await getConversationParticipants(payload.conversation_id);
  participants.forEach((participantId) => sendToUser(participantId, 'message_reaction', payload));

  res.json(payload);
});

module.exports = router;

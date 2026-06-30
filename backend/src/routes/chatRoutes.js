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

const ensureTables = async () => {
  await pool.query(`
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
          'favorite_received',
          'chat_message'
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
       COALESCE(u.display_name, u.fullname) AS sender_name,
       u.profile_image_url AS sender_profile_image
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_id
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

const notifyParticipants = async ({ conversationId, senderId, message }) => {
  const participants = await getConversationParticipants(conversationId);
  const recipients = participants.filter((id) => Number(id) !== Number(senderId));

  for (const recipientId of recipients) {
    const notification = await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
       VALUES ($1, $2, 'chat_message', 'Nuevo mensaje', $3, $4)
       RETURNING *`,
      [recipientId, senderId, message.content || 'Te enviaron un archivo.', message.id]
    );

    sendToUser(recipientId, 'notification', notification.rows[0]);
  }

  participants.forEach((participantId) => {
    sendToUser(participantId, 'message', message);
  });
};

router.get('/events/:userId', async (req, res) => {
  await ready;

  const { userId } = req.params;
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

router.get('/conversations/:userId', async (req, res) => {
  await ready;
  const { userId } = req.params;

  const result = await pool.query(
    `SELECT
       c.id,
       c.is_group,
       c.name,
       c.updated_at,
       cp.last_read_at,
       lm.id AS last_message_id,
       lm.content AS last_message_content,
       lm.message_type AS last_message_type,
       lm.created_at AS last_message_at,
       lm.sender_id AS last_sender_id,
       COALESCE(other_user.display_name, other_user.fullname, c.name) AS display_name,
       other_user.id AS other_user_id,
       other_user.profile_image_url AS other_profile_image,
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
  const { userId } = req.query;

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
       COALESCE(u.display_name, u.fullname) AS sender_name,
       u.profile_image_url AS sender_profile_image
     FROM chat_messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1 AND COALESCE(m.moderation_status, 'visible') = 'visible'
     ORDER BY m.created_at ASC
     LIMIT 200`,
    [conversationId]
  );

  res.json(result.rows);
});

router.post('/direct/:targetUserId/messages', upload.array('attachments', 5), async (req, res) => {
  await ready;
  const { targetUserId } = req.params;
  const { sender_id, content } = req.body;

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
    messages.push(message);
    await notifyParticipants({ conversationId, senderId: sender_id, message });
  }

  res.json({ conversation_id: conversationId, messages });
});

router.post('/conversations/:conversationId/messages', upload.array('attachments', 5), async (req, res) => {
  await ready;
  const { conversationId } = req.params;
  const { sender_id, content } = req.body;

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
    messages.push(message);
    await notifyParticipants({ conversationId, senderId: sender_id, message });
  }

  res.json({ conversation_id: Number(conversationId), messages });
});

router.post('/groups', async (req, res) => {
  await ready;
  const { name, created_by, participant_ids = [] } = req.body;

  if (!name || !created_by) {
    return res.status(400).json({ error: 'name y created_by son obligatorios.' });
  }

  const participants = Array.from(
    new Set([Number(created_by), ...participant_ids.map((id) => Number(id))].filter(Boolean))
  );

  const created = await pool.query(
    `INSERT INTO chat_conversations (is_group, name, created_by)
     VALUES (TRUE, $1, $2)
     RETURNING *`,
    [name.trim(), created_by]
  );

  for (const participantId of participants) {
    await pool.query(
      `INSERT INTO chat_participants (conversation_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [created.rows[0].id, participantId]
    );
  }

  broadcast('conversation', created.rows[0]);
  res.json(created.rows[0]);
});

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

module.exports = router;

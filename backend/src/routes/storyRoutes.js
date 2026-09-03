const express = require('express');
const router = express.Router();
const { requireSession, bindAuthenticatedActor } = require('../middleware/adminAuth');
router.use(requireSession);
router.use(bindAuthenticatedActor('user_id', 'viewer_id'));
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'stories');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `story_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido para historias.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
});

const requireStoryAccess = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 1
       FROM stories s
       WHERE s.id = $1
         AND s.expires_at > NOW()
         AND COALESCE(s.moderation_status, 'visible') = 'visible'
         AND (
           s.user_id = $2
           OR s.visibility_type = 'public'
           OR (
             s.visibility_type = 'only_selected'
             AND EXISTS (
               SELECT 1 FROM story_audience_rules sar
               WHERE sar.story_id = s.id AND sar.target_user_id = $2 AND sar.rule_type = 'allow'
             )
           )
           OR (
             s.visibility_type = 'exclude_selected'
             AND NOT EXISTS (
               SELECT 1 FROM story_audience_rules sar
               WHERE sar.story_id = s.id AND sar.target_user_id = $2 AND sar.rule_type = 'exclude'
             )
           )
         )`,
      [req.params.id, req.authUser.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Historia no encontrada o no disponible.' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const ensureStoryMentionSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS story_mentions (
      story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
      mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (story_id, mentioned_user_id)
    )
  `);
  await pool.query(`
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN (
        'new_follower', 'recognition_received', 'reaction_received',
        'comment_received', 'comment_reply_received', 'mention_received',
        'story_mention', 'favorite_received', 'chat_message', 'report_updated'
      ))
  `);
};

const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const resolveMediaType = (mimetype) => {
  if (!mimetype) return 'image';
  return mimetype.startsWith('video') ? 'video' : 'image';
};

const ensureStoryPresentationColumns = async () => {
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS music_lyrics TEXT`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_fit VARCHAR(20) DEFAULT 'cover'`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_position_x INTEGER DEFAULT 50`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS media_position_y INTEGER DEFAULT 50`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS show_lyrics BOOLEAN DEFAULT TRUE`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS lyrics_position_x INTEGER DEFAULT 50`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS lyrics_position_y INTEGER DEFAULT 76`);
};

/**
 * Crear historia
 */
router.post(
  '/create',
  upload.fields([
    { name: 'storyMedia', maxCount: 1 },
    { name: 'storyAudio', maxCount: 1 },
  ]),
  bindAuthenticatedActor('user_id', 'viewer_id'),
  async (req, res) => {
    try {
      const {
        user_id,
        caption,
        music_name,
        music_lyrics,
        show_lyrics,
        lyrics_position_x,
        lyrics_position_y,
        music_external_url,
        music_start_seconds,
        duration_seconds,
        visibility_type,
        selected_users,
        excluded_users,
        tagged_user_ids,
        media_fit,
        media_position_x,
        media_position_y,
      } = req.body;

      await ensureStoryPresentationColumns();
      await ensureStoryMentionSchema();

      if (!user_id) {
        return res.status(400).json({ error: 'Falta user_id.' });
      }

      const storyMediaFile = req.files?.storyMedia?.[0];
      const storyAudioFile = req.files?.storyAudio?.[0];

      if (!storyMediaFile) {
        return res.status(400).json({ error: 'Debes subir un archivo para la historia.' });
      }

      const mediaType = resolveMediaType(storyMediaFile.mimetype);
      const finalVisibility = visibility_type || 'public';

      if (!['public', 'only_selected', 'exclude_selected'].includes(finalVisibility)) {
        return res.status(400).json({ error: 'Tipo de visibilidad invÃ¡lido.' });
      }

      const parsedDuration = Number(duration_seconds || (mediaType === 'video' ? 60 : 30));

      if (Number.isNaN(parsedDuration)) {
        return res.status(400).json({ error: 'La duracion es invalida.' });
      }

      const maxDuration = mediaType === 'video' ? 60 : 30;

      if (parsedDuration > maxDuration) {
        return res.status(400).json({
          error: mediaType === 'video'
            ? 'Los videos de historia no pueden durar mas de 1 minuto.'
            : 'Las imagenes de historia duran maximo 30 segundos.',
        });
      }

      const finalDuration = Math.min(Math.max(parsedDuration, 1), maxDuration);
      const finalMediaFit = ['cover', 'contain'].includes(media_fit) ? media_fit : 'cover';
      const finalPositionX = Math.min(Math.max(Number(media_position_x || 50), 0), 100);
      const finalPositionY = Math.min(Math.max(Number(media_position_y || 50), 0), 100);
      const finalShowLyrics = show_lyrics === 'false' || show_lyrics === false ? false : true;
      const finalLyricsPositionX = Math.min(Math.max(Number(lyrics_position_x || 50), 8), 92);
      const finalLyricsPositionY = Math.min(Math.max(Number(lyrics_position_y || 76), 18), 88);
      const mediaUrl = `/uploads/stories/${storyMediaFile.filename}`;
      const audioUrl = storyAudioFile
        ? `/uploads/stories/${storyAudioFile.filename}`
        : music_external_url || null;

      const storyResult = await pool.query(
        `
        INSERT INTO stories (
          user_id,
          media_url,
          media_type,
          caption,
          music_name,
          music_lyrics,
          show_lyrics,
          lyrics_position_x,
          lyrics_position_y,
          music_url,
          music_start_seconds,
          duration_seconds,
          visibility_type,
          media_fit,
          media_position_x,
          media_position_y,
          created_at,
          expires_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          NOW(),
          NOW() + INTERVAL '24 hours'
        )
        RETURNING *
        `,
        [
          user_id,
          mediaUrl,
          mediaType,
          caption || '',
          music_name || null,
          music_lyrics || null,
          finalShowLyrics,
          finalLyricsPositionX,
          finalLyricsPositionY,
          audioUrl,
          Number(music_start_seconds || 0),
          finalDuration,
          finalVisibility,
          finalMediaFit,
          finalPositionX,
          finalPositionY,
        ]
      );

      const story = storyResult.rows[0];
      const storyId = story.id;

      const taggedUsers = Array.from(new Set(
        parseJsonArray(tagged_user_ids)
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0 && id !== Number(user_id))
      ));
      const selectedUsers = Array.from(new Set([
        ...parseJsonArray(selected_users).map(Number),
        ...(finalVisibility === 'only_selected' ? taggedUsers : []),
      ])).filter((id) => Number.isInteger(id) && id > 0);
      const excludedUsers = parseJsonArray(excluded_users)
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0 && !taggedUsers.includes(id));

      if (finalVisibility === 'only_selected' && selectedUsers.length > 0) {
        for (const targetUserId of selectedUsers) {
          await pool.query(
            `
            INSERT INTO story_audience_rules (story_id, target_user_id, rule_type)
            VALUES ($1, $2, 'allow')
            ON CONFLICT (story_id, target_user_id, rule_type) DO NOTHING
            `,
            [storyId, targetUserId]
          );
        }
      }

      if (finalVisibility === 'exclude_selected' && excludedUsers.length > 0) {
        for (const targetUserId of excludedUsers) {
          await pool.query(
            `
            INSERT INTO story_audience_rules (story_id, target_user_id, rule_type)
            VALUES ($1, $2, 'exclude')
            ON CONFLICT (story_id, target_user_id, rule_type) DO NOTHING
            `,
            [storyId, targetUserId]
          );
        }
      }

      if (taggedUsers.length > 0) {
        const validUsers = await pool.query(
          `SELECT id FROM users
           WHERE id = ANY($1::int[])
             AND COALESCE(account_status, 'active') <> 'disabled'`,
          [taggedUsers]
        );

        for (const mentionedUser of validUsers.rows) {
          const mention = await pool.query(
            `INSERT INTO story_mentions (story_id, mentioned_user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING
             RETURNING mentioned_user_id`,
            [storyId, mentionedUser.id]
          );
          if (!mention.rows[0]) continue;

          await pool.query(
            `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
             VALUES ($1, $2, 'story_mention', 'Te etiquetaron en una historia', $3, $4)`,
            [mentionedUser.id, user_id, caption?.trim() || null, storyId]
          );
        }
      }

      res.status(201).json({
        message: 'Historia creada correctamente.',
        story,
      });
    } catch (error) {
      console.error('Error creating story:', error);
      res.status(500).json({ error: 'Error al crear la historia.' });
    }
  }
);

/**
 * Obtener feed de historias visibles para un usuario
 */
router.get('/feed/:userId', async (req, res) => {
  try {
    await ensureStoryMentionSchema();
    const userId = req.authUser.id;

    const result = await pool.query(
      `
      SELECT
        s.*,
        u.fullname,
        u.display_name,
        u.profile_image_url,
        EXISTS (
          SELECT 1
          FROM story_views seen
          WHERE seen.story_id = s.id
            AND seen.viewer_id = $1
        ) AS has_viewed,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', mentioned.id,
            'display_name', mentioned.display_name,
            'fullname', mentioned.fullname
          ) ORDER BY COALESCE(mentioned.display_name, mentioned.fullname))
          FROM story_mentions sm
          JOIN users mentioned ON mentioned.id = sm.mentioned_user_id
          WHERE sm.story_id = s.id
        ), '[]'::json) AS mentioned_users
      FROM stories s
      JOIN users u ON u.id = s.user_id
      WHERE s.expires_at > NOW()
        AND COALESCE(s.moderation_status, 'visible') = 'visible'
        AND (
          s.user_id = $1
          OR s.visibility_type = 'public'
          OR (
            s.visibility_type = 'only_selected'
            AND EXISTS (
              SELECT 1
              FROM story_audience_rules sar
              WHERE sar.story_id = s.id
                AND sar.target_user_id = $1
                AND sar.rule_type = 'allow'
            )
          )
          OR (
            s.visibility_type = 'exclude_selected'
            AND NOT EXISTS (
              SELECT 1
              FROM story_audience_rules sar
              WHERE sar.story_id = s.id
                AND sar.target_user_id = $1
                AND sar.rule_type = 'exclude'
            )
          )
        )
      ORDER BY s.user_id, s.created_at ASC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stories feed:', error);
    res.status(500).json({ error: 'Error al obtener historias.' });
  }
});

/**
 * Obtener una historia concreta desde una notificacion, respetando privacidad.
 */
router.get('/:id', requireStoryAccess, async (req, res) => {
  try {
    await ensureStoryMentionSchema();
    const result = await pool.query(
      `SELECT
         s.*,
         u.fullname,
         u.display_name,
         u.profile_image_url,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', mentioned.id,
             'display_name', mentioned.display_name,
             'fullname', mentioned.fullname
           ) ORDER BY COALESCE(mentioned.display_name, mentioned.fullname))
           FROM story_mentions sm
           JOIN users mentioned ON mentioned.id = sm.mentioned_user_id
           WHERE sm.story_id = s.id
         ), '[]'::json) AS mentioned_users
       FROM stories s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Historia no encontrada.' });
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo historia:', error.message);
    return res.status(500).json({ error: 'No se pudo abrir la historia.' });
  }
});

/**
 * Eliminar manualmente una historia propia y sus datos asociados.
 */
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureStoryMentionSchema();
    const storyId = Number(req.params.id);
    if (!Number.isInteger(storyId) || storyId <= 0) {
      return res.status(400).json({ error: 'Historia invalida.' });
    }

    await client.query('BEGIN');
    const storyResult = await client.query(
      `SELECT id, user_id, media_url, music_url
       FROM stories
       WHERE id = $1
       FOR UPDATE`,
      [storyId]
    );

    if (!storyResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Historia no encontrada.' });
    }

    const story = storyResult.rows[0];
    if (Number(story.user_id) !== Number(req.authUser.id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Solo el autor puede eliminar esta historia.' });
    }

    await client.query('DELETE FROM story_comments WHERE story_id = $1', [storyId]);
    await client.query('DELETE FROM story_reactions WHERE story_id = $1', [storyId]);
    await client.query('DELETE FROM story_views WHERE story_id = $1', [storyId]);
    await client.query('DELETE FROM story_audience_rules WHERE story_id = $1', [storyId]);
    await client.query('DELETE FROM story_mentions WHERE story_id = $1', [storyId]);
    await client.query(
      `DELETE FROM notifications WHERE type = 'story_mention' AND reference_id = $1`,
      [storyId]
    );
    await client.query('DELETE FROM stories WHERE id = $1', [storyId]);
    await client.query('COMMIT');

    const localUrls = [story.media_url, story.music_url]
      .filter((url) => typeof url === 'string' && url.startsWith('/uploads/stories/'));

    for (const localUrl of new Set(localUrls)) {
      const filePath = path.join(uploadDir, path.basename(localUrl));
      fs.unlink(filePath, (unlinkError) => {
        if (unlinkError && unlinkError.code !== 'ENOENT') {
          console.error('Error eliminando archivo de historia:', unlinkError.message);
        }
      });
    }

    return res.json({ success: true, deleted_story_id: storyId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error eliminando historia:', error.message);
    return res.status(500).json({ error: 'No se pudo eliminar la historia.' });
  } finally {
    client.release();
  }
});

/**
 * Registrar vista
 */
router.post('/:id/view', requireStoryAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { viewer_id } = req.body;

    if (!viewer_id) {
      return res.status(400).json({ error: 'Falta viewer_id.' });
    }

    await pool.query(
      `
      INSERT INTO story_views (story_id, viewer_id)
      VALUES ($1, $2)
      ON CONFLICT (story_id, viewer_id) DO NOTHING
      `,
      [id, viewer_id]
    );

    res.json({ message: 'Vista registrada.' });
  } catch (error) {
    console.error('Error registering story view:', error);
    res.status(500).json({ error: 'Error al registrar vista.' });
  }
});

/**
 * Ver quiÃ©n vio la historia
 */
router.get('/:id/views', async (req, res) => {
  try {
    const { id } = req.params;

    const ownedStory = await pool.query(
      'SELECT 1 FROM stories WHERE id = $1 AND user_id = $2',
      [id, req.authUser.id]
    );
    if (!ownedStory.rows[0]) {
      return res.status(403).json({ error: 'Solo el autor puede consultar las visualizaciones.' });
    }

    const result = await pool.query(
      `
      SELECT
        sv.viewer_id,
        sv.viewed_at,
        u.fullname,
        u.display_name,
        u.profile_image_url
      FROM story_views sv
      JOIN users u ON u.id = sv.viewer_id
      WHERE sv.story_id = $1
      ORDER BY sv.viewed_at DESC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching story views:', error);
    res.status(500).json({ error: 'Error al obtener vistas.' });
  }
});

/**
 * Reaccionar a historia
 */
router.post('/:id/react', requireStoryAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, reaction_type } = req.body;

    if (!user_id || !reaction_type) {
      return res.status(400).json({ error: 'Faltan datos para reaccionar.' });
    }

    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'fire'];

    if (!validReactions.includes(reaction_type)) {
      return res.status(400).json({ error: 'Tipo de reacciÃ³n invÃ¡lido.' });
    }

    const existing = await pool.query(
      `
      SELECT *
      FROM story_reactions
      WHERE story_id = $1 AND user_id = $2
      `,
      [id, user_id]
    );

    if (existing.rows.length > 0) {
      const currentReaction = existing.rows[0];

      if (currentReaction.reaction_type === reaction_type) {
        await pool.query(
          `
          DELETE FROM story_reactions
          WHERE story_id = $1 AND user_id = $2
          `,
          [id, user_id]
        );

        return res.json({ message: 'ReacciÃ³n eliminada.' });
      }

      await pool.query(
        `
        UPDATE story_reactions
        SET reaction_type = $3, created_at = NOW()
        WHERE story_id = $1 AND user_id = $2
        `,
        [id, user_id, reaction_type]
      );

      return res.json({ message: 'ReacciÃ³n actualizada.' });
    }

    await pool.query(
      `
      INSERT INTO story_reactions (story_id, user_id, reaction_type)
      VALUES ($1, $2, $3)
      `,
      [id, user_id, reaction_type]
    );

    res.json({ message: 'ReacciÃ³n registrada.' });
  } catch (error) {
    console.error('Error reacting to story:', error);
    res.status(500).json({ error: 'Error al reaccionar.' });
  }
});

/**
 * Ver reacciones de una historia
 */
router.get('/:id/reactions', requireStoryAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const totals = await pool.query(
      `
      SELECT reaction_type, COUNT(*) AS total
      FROM story_reactions
      WHERE story_id = $1
      GROUP BY reaction_type
      ORDER BY reaction_type
      `,
      [id]
    );

    const users = await pool.query(
      `
      SELECT
        sr.user_id,
        sr.reaction_type,
        sr.created_at,
        u.fullname,
        u.display_name,
        u.profile_image_url
      FROM story_reactions sr
      JOIN users u ON u.id = sr.user_id
      WHERE sr.story_id = $1
      ORDER BY sr.created_at DESC
      `,
      [id]
    );

    res.json({
      totals: totals.rows,
      users: users.rows,
    });
  } catch (error) {
    console.error('Error fetching story reactions:', error);
    res.status(500).json({ error: 'Error al obtener reacciones.' });
  }
});

/**
 * Comentar historia
 */
router.post('/:id/comments', requireStoryAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, comment } = req.body;

    if (!user_id || !comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comentario invÃ¡lido.' });
    }

    const result = await pool.query(
      `
      INSERT INTO story_comments (story_id, user_id, comment)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [id, user_id, comment.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error commenting story:', error);
    res.status(500).json({ error: 'Error al comentar historia.' });
  }
});

/**
 * Obtener comentarios de historia
 */
router.get('/:id/comments', requireStoryAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        sc.*,
        u.fullname,
        u.display_name,
        u.profile_image_url
      FROM story_comments sc
      JOIN users u ON u.id = sc.user_id
      WHERE sc.story_id = $1
      ORDER BY sc.created_at ASC
      `,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching story comments:', error);
    res.status(500).json({ error: 'Error al obtener comentarios.' });
  }
});

module.exports = router;

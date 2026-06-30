const express = require('express');
const router = express.Router();
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

/**
 * Crear historia
 */
router.post(
  '/create',
  upload.fields([
    { name: 'storyMedia', maxCount: 1 },
    { name: 'storyAudio', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        user_id,
        caption,
        music_name,
        music_external_url,
        music_start_seconds,
        duration_seconds,
        visibility_type,
        selected_users,
        excluded_users,
      } = req.body;

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
          music_url,
          music_start_seconds,
          duration_seconds,
          visibility_type,
          created_at,
          expires_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
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
          audioUrl,
          Number(music_start_seconds || 0),
          finalDuration,
          finalVisibility,
        ]
      );

      const story = storyResult.rows[0];
      const storyId = story.id;

      const selectedUsers = parseJsonArray(selected_users);
      const excludedUsers = parseJsonArray(excluded_users);

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
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
        s.*,
        u.fullname,
        u.display_name,
        u.profile_image_url
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
 * Registrar vista
 */
router.post('/:id/view', async (req, res) => {
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
router.post('/:id/react', async (req, res) => {
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
router.get('/:id/reactions', async (req, res) => {
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
router.post('/:id/comments', async (req, res) => {
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
router.get('/:id/comments', async (req, res) => {
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

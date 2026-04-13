const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { moderateText } = require('../../moderationService');
const {
  classifyRecognitionText,
  generateBadgeMetadata,
} = require('../services/aiService');

// ===============================
// CONFIGURACIÓN DE UPLOADS
// ===============================
const uploadDir = path.join(__dirname, '..', 'uploads', 'recognitions');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `recognition_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const fileFilter = (req, file, cb) => {
  const allowedTypes = [...IMAGE_TYPES, ...VIDEO_TYPES];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Formato no permitido. Usa imágenes PNG/JPG/WEBP o videos MP4/WEBM/MOV.'
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: 5,
    fileSize: 40 * 1024 * 1024, // 40 MB por archivo
  },
});

// ===============================
// HELPERS DE MENCIONES
// ===============================
const extractMentionHandles = (text = '') => {
  const mentionRegex = /@([a-zA-Z0-9._]+)/g;
  const handles = new Set();
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match[1]) {
      handles.add(match[1].toLowerCase());
    }
  }

  return Array.from(handles);
};

const createMentionNotifications = async ({
  commentId,
  recognitionId,
  actorUserId,
  commentText,
}) => {
  const handles = extractMentionHandles(commentText);

  if (!handles.length) return;

  const mentionedUsers = await pool.query(
    `SELECT id, email
     FROM users
     WHERE LOWER(split_part(email, '@', 1)) = ANY($1::text[])`,
    [handles]
  );

  for (const mentionedUser of mentionedUsers.rows) {
    if (Number(mentionedUser.id) === Number(actorUserId)) {
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO comment_mentions (comment_id, mentioned_user_id)
         VALUES ($1, $2)
         ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING`,
        [commentId, mentionedUser.id]
      );

      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          mentionedUser.id,
          actorUserId,
          'mention_received',
          'Te mencionaron en un comentario',
          commentText,
          Number(recognitionId),
        ]
      );
    } catch (error) {
      console.error('Error creando mención/notificación:', error.message);
    }
  }
};

// ===============================
// ENVIAR RECONOCIMIENTO
// ===============================
router.post('/send', upload.array('recognitionMedia', 5), async (req, res) => {
  try {
    const {
      sender_id,
      receiver_id,
      receiver_control_number,
      message,
      category,
      ai_refined_message,
    } = req.body;

    const moderation = await moderateText(message);

    if (!moderation.permitido) {
      return res.status(400).json({
        error: moderation.motivo,
        toxicidad: moderation.toxicidad,
      });
    }

    let finalReceiverId = receiver_id;

    if (!finalReceiverId && receiver_control_number) {
      const receiverEmail = `za${receiver_control_number}@zapopan.tecmm.edu.mx`;

      const userLookup = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [receiverEmail]
      );

      if (userLookup.rows.length === 0) {
        return res.status(404).json({
          error:
            'No se encontró al compañero. Debe haber iniciado sesión al menos una vez en ¡Tec! ¡you!.',
        });
      }

      finalReceiverId = userLookup.rows[0].id;
    }

    if (!finalReceiverId) {
      return res.status(400).json({
        error: 'Debes seleccionar un usuario válido para enviar el reconocimiento.',
      });
    }

    // ===============================
    // IA: CLASIFICACIÓN + METADATOS DE INSIGNIA
    // NOTA: si falla la IA, NO bloqueamos el envío
    // ===============================
    let aiCategory = null;
    let aiSentiment = null;
    let aiIntensity = null;
    let aiTags = [];
    let aiBadgeTitle = null;
    let aiBadgePrompt = null;

    try {
      const classification = await classifyRecognitionText({
        message,
      });

      aiCategory = classification.category || null;
      aiSentiment = classification.sentiment || null;
      aiIntensity = classification.intensity || null;
      aiTags = Array.isArray(classification.tags) ? classification.tags : [];

      try {
        const badgeMeta = await generateBadgeMetadata({
          message,
          category: aiCategory || category,
          sentiment: aiSentiment || 'positivo',
          intensity: aiIntensity || 'media',
          tags: aiTags,
        });

        aiBadgeTitle = badgeMeta.badgeTitle || null;
        aiBadgePrompt = badgeMeta.badgePrompt || null;
      } catch (badgeError) {
        console.error('Error generando metadatos de insignia:', badgeError.message);
      }
    } catch (classificationError) {
      console.error('Error clasificando reconocimiento con IA:', classificationError.message);
    }

    const newRecognition = await pool.query(
      `INSERT INTO recognitions (
        sender_id,
        receiver_id,
        message,
        ai_refined_message,
        category,
        ai_category,
        ai_sentiment,
        ai_intensity,
        ai_tags,
        ai_badge_title,
        ai_badge_prompt
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        sender_id,
        finalReceiverId,
        message,
        ai_refined_message || null,
        category,
        aiCategory,
        aiSentiment,
        aiIntensity,
        aiTags.length ? aiTags : null,
        aiBadgeTitle,
        aiBadgePrompt,
      ]
    );

    const recognitionId = newRecognition.rows[0].id;

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mediaPath = `/uploads/recognitions/${file.filename}`;

        let mediaType = null;

        if (IMAGE_TYPES.includes(file.mimetype)) {
          mediaType = 'image';
        } else if (VIDEO_TYPES.includes(file.mimetype)) {
          mediaType = 'video';
        }

        if (!mediaType) continue;

        await pool.query(
          `INSERT INTO recognition_media (recognition_id, media_url, media_type)
           VALUES ($1, $2, $3)`,
          [recognitionId, mediaPath, mediaType]
        );
      }
    }

    if (Number(sender_id) !== Number(finalReceiverId)) {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          finalReceiverId,
          sender_id,
          'recognition_received',
          'Recibiste un reconocimiento',
          message,
          recognitionId,
        ]
      );
    }

    res.json({
      success: true,
      message: '¡Reconocimiento enviado con éxito!',
      data: newRecognition.rows[0],
    });
  } catch (err) {
    console.error('Error en /send:', err.message);
    res.status(500).send('Error interno al procesar el reconocimiento.');
  }
});

// ===============================
// FEED DE RECONOCIMIENTOS
// ===============================
router.get('/feed', async (req, res) => {
  try {
    const feed = await pool.query(`
      SELECT
        r.*,
        COALESCE(s.display_name, s.fullname) AS sender_name,
        s.fullname AS sender_fullname,
        s.profile_image_url AS sender_profile_image,
        COALESCE(rec.display_name, rec.fullname) AS receiver_name,
        rec.fullname AS receiver_fullname,
        rec.profile_image_url AS receiver_profile_image,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', rm.id,
              'media_url', rm.media_url,
              'media_type', rm.media_type
            )
          ) FILTER (WHERE rm.id IS NOT NULL),
          '[]'
        ) AS media
      FROM recognitions r
      JOIN users s ON r.sender_id = s.id
      JOIN users rec ON r.receiver_id = rec.id
      LEFT JOIN recognition_media rm ON r.id = rm.recognition_id
      GROUP BY r.id, s.id, rec.id
      ORDER BY r.created_at DESC
    `);

    res.json(feed.rows);
  } catch (err) {
    console.error('Error en /feed:', err.message);
    res.status(500).send('Error al obtener las publicaciones del muro.');
  }
});

// ===============================
// REACCIONAR A RECONOCIMIENTO
// ===============================
router.post('/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, reaction_type } = req.body;

    const validReactions = ['like', 'celebrate', 'inspire', 'love'];

    if (!validReactions.includes(reaction_type)) {
      return res.status(400).json({ error: 'Tipo de reacción no válido.' });
    }

    const existingReaction = await pool.query(
      `SELECT * FROM recognition_reactions
       WHERE recognition_id = $1 AND user_id = $2`,
      [id, user_id]
    );

    const recognitionOwner = await pool.query(
      `SELECT receiver_id FROM recognitions WHERE id = $1`,
      [id]
    );

    const receiverId = recognitionOwner.rows[0]?.receiver_id || null;

    if (existingReaction.rows.length > 0) {
      if (existingReaction.rows[0].reaction_type === reaction_type) {
        await pool.query(
          `DELETE FROM recognition_reactions
           WHERE recognition_id = $1 AND user_id = $2`,
          [id, user_id]
        );

        return res.json({ removed: true });
      }

      const updated = await pool.query(
        `UPDATE recognition_reactions
         SET reaction_type = $1, created_at = CURRENT_TIMESTAMP
         WHERE recognition_id = $2 AND user_id = $3
         RETURNING *`,
        [reaction_type, id, user_id]
      );

      if (receiverId && Number(receiverId) !== Number(user_id)) {
        await pool.query(
          `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            receiverId,
            user_id,
            'reaction_received',
            'Reaccionaron a tu reconocimiento',
            reaction_type,
            Number(id),
          ]
        );
      }

      return res.json(updated.rows[0]);
    }

    const created = await pool.query(
      `INSERT INTO recognition_reactions (recognition_id, user_id, reaction_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user_id, reaction_type]
    );

    if (receiverId && Number(receiverId) !== Number(user_id)) {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          receiverId,
          user_id,
          'reaction_received',
          'Reaccionaron a tu reconocimiento',
          reaction_type,
          Number(id),
        ]
      );
    }

    res.json(created.rows[0]);
  } catch (err) {
    console.error('Error en POST /:id/react:', err.message);
    res.status(500).send('Error al guardar la reacción.');
  }
});

// ===============================
// OBTENER REACCIONES DE RECONOCIMIENTO
// ===============================
router.get('/:id/reactions', async (req, res) => {
  try {
    const { id } = req.params;

    const reactions = await pool.query(
      `SELECT reaction_type, COUNT(*)::int AS total
       FROM recognition_reactions
       WHERE recognition_id = $1
       GROUP BY reaction_type`,
      [id]
    );

    const userReactions = await pool.query(
      `SELECT
          rr.user_id,
          rr.reaction_type,
          COALESCE(u.display_name, u.fullname) AS user_name,
          u.profile_image_url
       FROM recognition_reactions rr
       JOIN users u ON rr.user_id = u.id
       WHERE rr.recognition_id = $1
       ORDER BY rr.created_at DESC`,
      [id]
    );

    res.json({
      totals: reactions.rows,
      users: userReactions.rows,
    });
  } catch (err) {
    console.error('Error en GET /:id/reactions:', err.message);
    res.status(500).send('Error al obtener las reacciones.');
  }
});

// ===============================
// FAVORITOS / GUARDADOS
// ===============================
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Falta user_id.' });
    }

    const recognitionOwner = await pool.query(
      `SELECT receiver_id FROM recognitions WHERE id = $1`,
      [id]
    );

    if (recognitionOwner.rows.length === 0) {
      return res.status(404).json({ error: 'Reconocimiento no encontrado.' });
    }

    const receiverId = recognitionOwner.rows[0]?.receiver_id || null;

    const favorite = await pool.query(
      `INSERT INTO recognition_favorites (user_id, recognition_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, recognition_id) DO NOTHING
       RETURNING *`,
      [user_id, id]
    );

    if (favorite.rows.length === 0) {
      return res.json({
        alreadyFavorited: true,
        message: 'El reconocimiento ya estaba guardado.',
      });
    }

    if (receiverId && Number(receiverId) !== Number(user_id)) {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          receiverId,
          user_id,
          'favorite_received',
          'Guardaron tu reconocimiento',
          'Un usuario guardó tu reconocimiento en favoritos.',
          Number(id),
        ]
      );
    }

    return res.json({
      success: true,
      favorite: favorite.rows[0],
    });
  } catch (err) {
    console.error('Error en POST /:id/favorite:', err.message);
    res.status(500).send('Error al guardar en favoritos.');
  }
});

// Quitar reconocimiento de favoritos
router.delete('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Falta user_id.' });
    }

    const deleted = await pool.query(
      `DELETE FROM recognition_favorites
       WHERE recognition_id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Ese favorito no existe.' });
    }

    return res.json({
      removed: true,
      favorite: deleted.rows[0],
    });
  } catch (err) {
    console.error('Error en DELETE /:id/favorite:', err.message);
    res.status(500).send('Error al eliminar de favoritos.');
  }
});

// Ver si un reconocimiento está guardado por un usuario
router.get('/:id/favorite-status/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;

    const result = await pool.query(
      `SELECT 1
       FROM recognition_favorites
       WHERE recognition_id = $1 AND user_id = $2
       LIMIT 1`,
      [id, userId]
    );

    return res.json({
      is_favorite: result.rows.length > 0,
    });
  } catch (err) {
    console.error('Error en GET /:id/favorite-status/:userId:', err.message);
    res.status(500).send('Error al verificar favorito.');
  }
});

// Obtener todos los favoritos de un usuario
router.get('/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const favorites = await pool.query(
      `SELECT
          r.id,
          r.sender_id,
          r.receiver_id,
          r.message,
          r.ai_refined_message,
          r.category,
          r.ai_category,
          r.ai_sentiment,
          r.ai_intensity,
          r.ai_tags,
          r.ai_badge_title,
          r.ai_badge_prompt,
          r.ai_badge_image_url,
          r.created_at,
          COALESCE(u1.display_name, u1.fullname, u1.email) AS sender_name,
          COALESCE(u2.display_name, u2.fullname, u2.email) AS receiver_name,
          rf.created_at AS favorited_at,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', rm.id,
                'media_url', rm.media_url,
                'media_type', rm.media_type
              )
            ) FILTER (WHERE rm.id IS NOT NULL),
            '[]'
          ) AS media
       FROM recognition_favorites rf
       INNER JOIN recognitions r
         ON rf.recognition_id = r.id
       LEFT JOIN users u1
         ON r.sender_id = u1.id
       LEFT JOIN users u2
         ON r.receiver_id = u2.id
       LEFT JOIN recognition_media rm
         ON r.id = rm.recognition_id
       WHERE rf.user_id = $1
       GROUP BY
         r.id,
         u1.id,
         u2.id,
         rf.created_at
       ORDER BY rf.created_at DESC`,
      [userId]
    );

    return res.json(favorites.rows);
  } catch (err) {
    console.error('Error en GET /favorites/:userId:', err.message);
    res.status(500).send('Error al obtener favoritos.');
  }
});

// ===============================
// AGREGAR COMENTARIO O RESPUESTA
// ===============================
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, comment, parent_comment_id } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        error: 'El comentario no puede estar vacío.',
      });
    }

    let finalParentCommentId = null;
    let parentCommentData = null;

    if (parent_comment_id) {
      const parentCommentLookup = await pool.query(
        `SELECT id, recognition_id, user_id
         FROM recognition_comments
         WHERE id = $1`,
        [parent_comment_id]
      );

      if (parentCommentLookup.rows.length === 0) {
        return res.status(404).json({
          error: 'El comentario al que intentas responder no existe.',
        });
      }

      parentCommentData = parentCommentLookup.rows[0];

      if (Number(parentCommentData.recognition_id) !== Number(id)) {
        return res.status(400).json({
          error: 'La respuesta no corresponde al reconocimiento indicado.',
        });
      }

      finalParentCommentId = parent_comment_id;
    }

    const newComment = await pool.query(
      `INSERT INTO recognition_comments (
        recognition_id,
        user_id,
        comment,
        parent_comment_id
      )
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, user_id, comment.trim(), finalParentCommentId]
    );

    const insertedCommentId = newComment.rows[0].id;

    await createMentionNotifications({
      commentId: insertedCommentId,
      recognitionId: id,
      actorUserId: user_id,
      commentText: comment.trim(),
    });

    const commentWithUser = await pool.query(
      `SELECT
          rc.id,
          rc.recognition_id,
          rc.user_id,
          rc.comment,
          rc.parent_comment_id,
          rc.created_at,
          COALESCE(u.display_name, u.fullname) AS user_name,
          u.profile_image_url
       FROM recognition_comments rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.id = $1`,
      [insertedCommentId]
    );

    const recognitionOwner = await pool.query(
      `SELECT receiver_id FROM recognitions WHERE id = $1`,
      [id]
    );

    const receiverId = recognitionOwner.rows[0]?.receiver_id || null;

    if (parentCommentData && Number(parentCommentData.user_id) !== Number(user_id)) {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          parentCommentData.user_id,
          user_id,
          'comment_reply_received',
          'Respondieron tu comentario',
          comment.trim(),
          Number(id),
        ]
      );
    } else if (receiverId && Number(receiverId) !== Number(user_id)) {
      await pool.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          receiverId,
          user_id,
          'comment_received',
          'Comentaron tu reconocimiento',
          comment.trim(),
          Number(id),
        ]
      );
    }

    res.json(commentWithUser.rows[0]);
  } catch (err) {
    console.error('Error en POST /:id/comments:', err.message);
    res.status(500).send('Error al agregar comentario.');
  }
});

// ===============================
// OBTENER COMENTARIOS EN ÁRBOL
// ===============================
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await pool.query(
      `SELECT
          rc.id,
          rc.recognition_id,
          rc.user_id,
          rc.comment,
          rc.parent_comment_id,
          rc.created_at,
          COALESCE(u.display_name, u.fullname) AS user_name,
          u.profile_image_url
       FROM recognition_comments rc
       JOIN users u ON rc.user_id = u.id
       WHERE rc.recognition_id = $1
       ORDER BY rc.created_at ASC`,
      [id]
    );

    const allComments = comments.rows;

    const commentMap = new Map();
    const rootComments = [];

    allComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    allComments.forEach((comment) => {
      const mappedComment = commentMap.get(comment.id);

      if (comment.parent_comment_id) {
        const parentComment = commentMap.get(comment.parent_comment_id);

        if (parentComment) {
          parentComment.replies.push(mappedComment);
        } else {
          rootComments.push(mappedComment);
        }
      } else {
        rootComments.push(mappedComment);
      }
    });

    res.json(rootComments);
  } catch (err) {
    console.error('Error en GET /:id/comments:', err.message);
    res.status(500).send('Error al obtener comentarios.');
  }
});

// ===============================
// OBTENER RECONOCIMIENTO POR ID
// ===============================
router.get('/:id/detail', async (req, res) => {
  try {
    const { id } = req.params;

    const recognition = await pool.query(
      `
      SELECT
        r.*,
        COALESCE(s.display_name, s.fullname) AS sender_name,
        s.fullname AS sender_fullname,
        s.profile_image_url AS sender_profile_image,
        COALESCE(rec.display_name, rec.fullname) AS receiver_name,
        rec.fullname AS receiver_fullname,
        rec.profile_image_url AS receiver_profile_image,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', rm.id,
              'media_url', rm.media_url,
              'media_type', rm.media_type
            )
          ) FILTER (WHERE rm.id IS NOT NULL),
          '[]'
        ) AS media
      FROM recognitions r
      JOIN users s ON r.sender_id = s.id
      JOIN users rec ON r.receiver_id = rec.id
      LEFT JOIN recognition_media rm ON r.id = rm.recognition_id
      WHERE r.id = $1
      GROUP BY r.id, s.id, rec.id
      `,
      [id]
    );

    if (recognition.rows.length === 0) {
      return res.status(404).json({ error: 'Reconocimiento no encontrado.' });
    }

    res.json(recognition.rows[0]);
  } catch (err) {
    console.error('Error en GET /:id/detail:', err.message);
    res.status(500).send('Error al obtener reconocimiento.');
  }
});

module.exports = router;
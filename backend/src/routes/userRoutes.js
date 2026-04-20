const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    evaluateAndUnlockAchievementsForUser,
} = require('../services/achievementService');

// Asegurar carpeta de uploads
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `user_${req.params.id || 'file'}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de imagen no permitido. Usa PNG, JPG o WEBP.'));
    }
};

const upload = multer({ storage, fileFilter });

// BUSCAR USUARIOS
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const currentUserId = req.query.currentUserId || null;

        if (!q || q.length < 2) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                COALESCE(u.display_name, u.fullname) AS display_name,
                u.email,
                u.profile_image_url,
                u.cover_image_url,
                u.role,
                u.bio,
                u.tags,
                u.is_verified,
                afd.code AS equipped_frame_code,
                EXISTS (
                    SELECT 1
                    FROM user_follows uf
                    WHERE uf.follower_id = $2
                      AND uf.following_id = u.id
                ) AS is_following
             FROM users u
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             WHERE
                LOWER(COALESCE(u.display_name, u.fullname)) LIKE LOWER($1)
                OR LOWER(u.fullname) LIKE LOWER($1)
                OR LOWER(u.email) LIKE LOWER($1)
             ORDER BY COALESCE(u.display_name, u.fullname) ASC
             LIMIT 12`,
            [`%${q}%`, currentUserId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error en /search:', err.message);
        res.status(500).send('Error al buscar usuarios.');
    }
});

// LISTAR TODOS LOS USUARIOS
router.get('/all', async (req, res) => {
    try {
        const currentUserId = req.query.currentUserId || null;

        const result = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                COALESCE(u.display_name, u.fullname) AS display_name,
                u.email,
                u.profile_image_url,
                u.cover_image_url,
                u.role,
                u.bio,
                u.tags,
                u.is_verified,
                afd.code AS equipped_frame_code,
                EXISTS (
                    SELECT 1
                    FROM user_follows uf
                    WHERE uf.follower_id = $1
                      AND uf.following_id = u.id
                ) AS is_following
             FROM users u
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             ORDER BY COALESCE(u.display_name, u.fullname) ASC`,
            [currentUserId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error en /all:', err.message);
        res.status(500).send('Error al obtener usuarios.');
    }
});

// OBTENER PERFIL
router.get('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const user = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                u.display_name,
                u.email,
                u.role,
                u.bio,
                u.profile_image_url,
                u.cover_image_url,
                u.tags,
                u.birth_date,
                u.location,
                u.is_verified,
                u.created_at,
                afd.code AS equipped_frame_code,
                (
                    SELECT COUNT(*)
                    FROM user_follows uf
                    WHERE uf.following_id = u.id
                )::int AS followers_count,
                (
                    SELECT COUNT(*)
                    FROM user_follows uf
                    WHERE uf.follower_id = u.id
                )::int AS following_count
             FROM users u
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             WHERE u.id = $1`,
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json(user.rows[0]);
    } catch (err) {
        console.error('Error en GET /profile/:id:', err.message);
        res.status(500).send('Error al obtener el perfil.');
    }
});

// ACTUALIZAR PERFIL
router.put('/profile/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { display_name, bio, tags, birth_date, location } = req.body;

        const cleanedTags = Array.isArray(tags)
            ? tags
                .map((tag) => String(tag).trim())
                .filter((tag) => tag !== '')
                .slice(0, 8)
            : [];

        const updatedUser = await pool.query(
            `UPDATE users
             SET display_name = $1,
                 bio = $2,
                 tags = $3,
                 birth_date = $4,
                 location = $5
             WHERE id = $6
             RETURNING
                id,
                fullname,
                display_name,
                email,
                role,
                bio,
                profile_image_url,
                cover_image_url,
                tags,
                birth_date,
                location,
                is_verified,
                created_at`,
            [
                display_name || null,
                bio || null,
                cleanedTags,
                birth_date || null,
                location || null,
                id
            ]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        let progress = null;

        try {
            progress = await evaluateAndUnlockAchievementsForUser(Number(id), {
                sourceType: 'profile_updated',
                sourceId: Number(id),
            });
        } catch (progressError) {
            console.error('Error evaluando progreso tras editar perfil:', progressError.message);
        }

        res.json({
            ...updatedUser.rows[0],
            progress,
        });
    } catch (err) {
        console.error('Error en PUT /profile/:id:', err.message);
        res.status(500).send('Error al actualizar el perfil.');
    }
});

// SUBIR FOTO DE PERFIL
router.post('/profile/:id/photo', upload.single('profileImage'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;

        const updatedUser = await pool.query(
            `UPDATE users
             SET profile_image_url = $1
             WHERE id = $2
             RETURNING
                id,
                fullname,
                display_name,
                email,
                role,
                bio,
                profile_image_url,
                cover_image_url,
                tags,
                birth_date,
                location,
                is_verified,
                created_at`,
            [imagePath, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        let progress = null;

        try {
            progress = await evaluateAndUnlockAchievementsForUser(Number(id), {
                sourceType: 'profile_photo_updated',
                sourceId: Number(id),
            });
        } catch (progressError) {
            console.error('Error evaluando progreso tras subir foto:', progressError.message);
        }

        res.json({
            ...updatedUser.rows[0],
            progress,
        });
    } catch (err) {
        console.error('Error en POST /profile/:id/photo:', err.message);
        res.status(500).send('Error al subir la foto de perfil.');
    }
});

// SUBIR PORTADA
router.post('/profile/:id/cover', upload.single('coverImage'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió ninguna imagen de portada.' });
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;

        const updatedUser = await pool.query(
            `UPDATE users
             SET cover_image_url = $1
             WHERE id = $2
             RETURNING
                id,
                fullname,
                display_name,
                email,
                role,
                bio,
                profile_image_url,
                cover_image_url,
                tags,
                birth_date,
                location,
                is_verified,
                created_at`,
            [imagePath, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        let progress = null;

        try {
            progress = await evaluateAndUnlockAchievementsForUser(Number(id), {
                sourceType: 'profile_cover_updated',
                sourceId: Number(id),
            });
        } catch (progressError) {
            console.error('Error evaluando progreso tras subir portada:', progressError.message);
        }

        res.json({
            ...updatedUser.rows[0],
            progress,
        });
    } catch (err) {
        console.error('Error en POST /profile/:id/cover:', err.message);
        res.status(500).send('Error al subir la portada.');
    }
});

// SEGUIR USUARIO
router.post('/:id/follow', async (req, res) => {
    try {
        const { id } = req.params;
        const { follower_id } = req.body;

        if (!follower_id) {
            return res.status(400).json({ error: 'follower_id es requerido.' });
        }

        if (Number(follower_id) === Number(id)) {
            return res.status(400).json({ error: 'No puedes seguirte a ti mismo.' });
        }

        const result = await pool.query(
            `INSERT INTO user_follows (follower_id, following_id)
             VALUES ($1, $2)
             ON CONFLICT (follower_id, following_id) DO NOTHING
             RETURNING *`,
            [follower_id, id]
        );

        if (result.rows.length > 0) {
            await pool.query(
                `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    id,
                    follower_id,
                    'new_follower',
                    'Tienes un nuevo seguidor',
                    null,
                    null
                ]
            );
        }

        res.json({
            success: true,
            followed: true,
            data: result.rows[0] || null
        });
    } catch (err) {
        console.error('Error en POST /:id/follow:', err.message);
        res.status(500).send('Error al seguir usuario.');
    }
});

// DEJAR DE SEGUIR
router.delete('/:id/follow', async (req, res) => {
    try {
        const { id } = req.params;
        const { follower_id } = req.body;

        if (!follower_id) {
            return res.status(400).json({ error: 'follower_id es requerido.' });
        }

        await pool.query(
            `DELETE FROM user_follows
             WHERE follower_id = $1 AND following_id = $2`,
            [follower_id, id]
        );

        res.json({
            success: true,
            followed: false
        });
    } catch (err) {
        console.error('Error en DELETE /:id/follow:', err.message);
        res.status(500).send('Error al dejar de seguir usuario.');
    }
});

// USUARIOS QUE SIGO
router.get('/:id/following', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                COALESCE(u.display_name, u.fullname) AS display_name,
                u.email,
                u.profile_image_url,
                u.cover_image_url,
                u.role,
                u.bio,
                u.tags,
                u.is_verified,
                afd.code AS equipped_frame_code,
                uf.created_at AS followed_at
             FROM user_follows uf
             JOIN users u ON uf.following_id = u.id
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             WHERE uf.follower_id = $1
             ORDER BY COALESCE(u.display_name, u.fullname) ASC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error en /:id/following:', err.message);
        res.status(500).send('Error al obtener seguidos.');
    }
});

// USUARIOS QUE ME SIGUEN
router.get('/:id/followers', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                COALESCE(u.display_name, u.fullname) AS display_name,
                u.email,
                u.profile_image_url,
                u.cover_image_url,
                u.role,
                u.bio,
                u.tags,
                u.is_verified,
                afd.code AS equipped_frame_code,
                uf.created_at AS followed_at
             FROM user_follows uf
             JOIN users u ON uf.follower_id = u.id
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             WHERE uf.following_id = $1
             ORDER BY COALESCE(u.display_name, u.fullname) ASC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error en /:id/followers:', err.message);
        res.status(500).send('Error al obtener seguidores.');
    }
});

// PERFIL PÚBLICO DE USUARIO
router.get('/:id/public', async (req, res) => {
    try {
        const { id } = req.params;
        const viewerId = req.query.viewerId || null;

        const userResult = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                COALESCE(u.display_name, u.fullname) AS display_name,
                u.email,
                u.role,
                u.bio,
                u.profile_image_url,
                u.cover_image_url,
                u.tags,
                u.birth_date,
                u.location,
                u.is_verified,
                u.created_at,
                afd.code AS equipped_frame_code,
                EXISTS (
                    SELECT 1
                    FROM user_follows uf
                    WHERE uf.follower_id = $2 AND uf.following_id = u.id
                ) AS is_following,
                (
                    SELECT COUNT(*)
                    FROM user_follows uf
                    WHERE uf.following_id = u.id
                )::int AS followers_count,
                (
                    SELECT COUNT(*)
                    FROM user_follows uf
                    WHERE uf.follower_id = u.id
                )::int AS following_count,
                (
                    SELECT COUNT(*)
                    FROM recognitions r
                    WHERE r.sender_id = u.id
                )::int AS recognitions_sent,
                (
                    SELECT COUNT(*)
                    FROM recognitions r
                    WHERE r.receiver_id = u.id
                )::int AS recognitions_received
             FROM users u
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             WHERE u.id = $1`,
            [id, viewerId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const recognitionsReceived = await pool.query(
            `SELECT
                r.id,
                r.message,
                r.category,
                r.created_at,
                COALESCE(s.display_name, s.fullname) AS sender_name,
                s.profile_image_url AS sender_profile_image
             FROM recognitions r
             JOIN users s ON r.sender_id = s.id
             WHERE r.receiver_id = $1
             ORDER BY r.created_at DESC
             LIMIT 6`,
            [id]
        );

        const recognitionsSent = await pool.query(
            `SELECT
                r.id,
                r.message,
                r.category,
                r.created_at,
                COALESCE(u.display_name, u.fullname) AS receiver_name,
                u.profile_image_url AS receiver_profile_image
             FROM recognitions r
             JOIN users u ON r.receiver_id = u.id
             WHERE r.sender_id = $1
             ORDER BY r.created_at DESC
             LIMIT 6`,
            [id]
        );

        res.json({
            user: userResult.rows[0],
            recognitions_received: recognitionsReceived.rows,
            recognitions_sent: recognitionsSent.rows,
        });
    } catch (err) {
        console.error('Error en /:id/public:', err.message);
        res.status(500).send('Error al obtener el perfil público.');
    }
});

// ACTIVIDAD RECIENTE DEL USUARIO
router.get('/:id/activity', async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await pool.query(
            `
            SELECT * FROM (
                SELECT
                    'recognition_received' AS type,
                    r.created_at,
                    COALESCE(s.display_name, s.fullname) AS actor_name,
                    s.profile_image_url AS actor_profile_image,
                    sender_frame.code AS actor_frame_code,
                    r.message AS content,
                    r.category AS extra
                FROM recognitions r
                JOIN users s ON r.sender_id = s.id
                LEFT JOIN user_avatar_frames sender_uaf
                  ON sender_uaf.user_id = s.id
                 AND sender_uaf.is_equipped = TRUE
                LEFT JOIN avatar_frame_definitions sender_frame
                  ON sender_frame.id = sender_uaf.frame_id
                WHERE r.receiver_id = $1

                UNION ALL

                SELECT
                    'new_follower' AS type,
                    uf.created_at,
                    COALESCE(u.display_name, u.fullname) AS actor_name,
                    u.profile_image_url AS actor_profile_image,
                    follower_frame.code AS actor_frame_code,
                    NULL AS content,
                    NULL AS extra
                FROM user_follows uf
                JOIN users u ON uf.follower_id = u.id
                LEFT JOIN user_avatar_frames follower_uaf
                  ON follower_uaf.user_id = u.id
                 AND follower_uaf.is_equipped = TRUE
                LEFT JOIN avatar_frame_definitions follower_frame
                  ON follower_frame.id = follower_uaf.frame_id
                WHERE uf.following_id = $1

                UNION ALL

                SELECT
                    'reaction_received' AS type,
                    rr.created_at,
                    COALESCE(u.display_name, u.fullname) AS actor_name,
                    u.profile_image_url AS actor_profile_image,
                    reactor_frame.code AS actor_frame_code,
                    rr.reaction_type AS content,
                    NULL AS extra
                FROM recognition_reactions rr
                JOIN users u ON rr.user_id = u.id
                JOIN recognitions r ON rr.recognition_id = r.id
                LEFT JOIN user_avatar_frames reactor_uaf
                  ON reactor_uaf.user_id = u.id
                 AND reactor_uaf.is_equipped = TRUE
                LEFT JOIN avatar_frame_definitions reactor_frame
                  ON reactor_frame.id = reactor_uaf.frame_id
                WHERE r.receiver_id = $1
                  AND rr.user_id <> $1
            ) activity_feed
            ORDER BY created_at DESC
            LIMIT 15
            `,
            [id]
        );

        res.json(activity.rows);
    } catch (err) {
        console.error('Error en /:id/activity:', err.message);
        res.status(500).send('Error al obtener actividad reciente.');
    }
});

// NOTIFICACIONES DEL USUARIO
router.get('/:id/notifications', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                n.id,
                n.user_id,
                n.actor_id,
                n.type,
                n.title,
                n.content,
                n.reference_id,
                n.is_read,
                n.created_at,
                COALESCE(u.display_name, u.fullname) AS actor_name,
                u.profile_image_url AS actor_profile_image,
                afd.code AS actor_frame_code
             FROM notifications n
             LEFT JOIN users u
               ON n.actor_id = u.id
             LEFT JOIN user_avatar_frames uaf
               ON uaf.user_id = u.id
              AND uaf.is_equipped = TRUE
             LEFT JOIN avatar_frame_definitions afd
               ON afd.id = uaf.frame_id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error en /:id/notifications:', err.message);
        res.status(500).send('Error al obtener notificaciones.');
    }
});

// CONTAR NOTIFICACIONES NO LEÍDAS
router.get('/:id/notifications/unread-count', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM notifications
             WHERE user_id = $1
               AND is_read = FALSE`,
            [id]
        );

        res.json({
            total: result.rows[0]?.total || 0,
        });
    } catch (err) {
        console.error('Error en GET /:id/notifications/unread-count:', err.message);
        res.status(500).send('Error al contar notificaciones no leídas.');
    }
});

// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
router.patch('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;

        const updated = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = $1
             RETURNING *`,
            [notificationId]
        );

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada.' });
        }

        res.json({
            success: true,
            notification: updated.rows[0],
        });
    } catch (err) {
        console.error('Error en PATCH /notifications/:notificationId/read:', err.message);
        res.status(500).send('Error al marcar notificación como leída.');
    }
});

// MARCAR TODAS COMO LEÍDAS
router.patch('/:id/notifications/read-all', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1
               AND is_read = FALSE`,
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error en PATCH /:id/notifications/read-all:', err.message);
        res.status(500).send('Error al marcar todas las notificaciones como leídas.');
    }
});

// MARCAR NOTIFICACIONES COMO LEÍDAS (legacy)
router.patch('/:id/notifications/read', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1`,
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error en PATCH /:id/notifications/read:', err.message);
        res.status(500).send('Error al actualizar notificaciones.');
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        cb(null, `user_${req.params.id}_${Date.now()}${ext}`);
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

// Validar correo institucional
const isValidInstitutionalEmail = (email) => {
    const regex = /^za\d+@zapopan\.tecmm\.edu\.mx$/;
    return regex.test(email);
};

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!isValidInstitutionalEmail(email)) {
            return res.status(400).json({
                error: 'Acceso denegado. Solo se permiten correos institucionales (@zapopan.tecmm.edu.mx).'
            });
        }

        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length > 0) {
            return res.json(user.rows[0]);
        } else {
            const tempName = email.split('@')[0];
            const newUser = await pool.query(
                `INSERT INTO users (fullname, display_name, email, role, bio, tags)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    tempName,
                    tempName,
                    email,
                    'student',
                    'Usuario participante en la comunidad ¡Tec! ¡you!',
                    ['Comunidad TSJ', 'Reconocimiento positivo']
                ]
            );
            return res.json(newUser.rows[0]);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el proceso de autenticación');
    }
});

// BUSCAR USUARIOS
router.get('/search', async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const currentUserId = req.query.currentUserId || null;

        if (!q) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT
                u.id,
                u.fullname,
                COALESCE(u.display_name, u.fullname) AS display_name,
                u.email,
                u.profile_image_url,
                u.role,
                u.bio,
                EXISTS (
                    SELECT 1
                    FROM user_follows uf
                    WHERE uf.follower_id = $2 AND uf.following_id = u.id
                ) AS is_following
             FROM users u
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
                u.role,
                u.bio,
                EXISTS (
                    SELECT 1
                    FROM user_follows uf
                    WHERE uf.follower_id = $1 AND uf.following_id = u.id
                ) AS is_following
             FROM users u
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
            `SELECT id, fullname, display_name, email, role, bio, profile_image_url, tags, created_at
             FROM users
             WHERE id = $1`,
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
        const { display_name, bio, tags } = req.body;

        const updatedUser = await pool.query(
            `UPDATE users
             SET display_name = $1,
                 bio = $2,
                 tags = $3
             WHERE id = $4
             RETURNING id, fullname, display_name, email, role, bio, profile_image_url, tags, created_at`,
            [display_name, bio, tags, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error('Error en PUT /profile/:id:', err.message);
        res.status(500).send('Error al actualizar el perfil.');
    }
});

// SUBIR FOTO
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
             RETURNING id, fullname, display_name, email, role, bio, profile_image_url, tags, created_at`,
            [imagePath, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error('Error en POST /profile/:id/photo:', err.message);
        res.status(500).send('Error al subir la foto de perfil.');
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
                u.role,
                u.bio,
                uf.created_at AS followed_at
             FROM user_follows uf
             JOIN users u ON uf.following_id = u.id
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
                u.role,
                u.bio,
                uf.created_at AS followed_at
             FROM user_follows uf
             JOIN users u ON uf.follower_id = u.id
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
                u.tags,
                u.created_at,
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
                    r.message AS content,
                    r.category AS extra
                FROM recognitions r
                JOIN users s ON r.sender_id = s.id
                WHERE r.receiver_id = $1

                UNION ALL

                SELECT
                    'new_follower' AS type,
                    uf.created_at,
                    COALESCE(u.display_name, u.fullname) AS actor_name,
                    u.profile_image_url AS actor_profile_image,
                    NULL AS content,
                    NULL AS extra
                FROM user_follows uf
                JOIN users u ON uf.follower_id = u.id
                WHERE uf.following_id = $1

                UNION ALL

                SELECT
                    'reaction_received' AS type,
                    rr.created_at,
                    COALESCE(u.display_name, u.fullname) AS actor_name,
                    u.profile_image_url AS actor_profile_image,
                    rr.reaction_type AS content,
                    NULL AS extra
                FROM recognition_reactions rr
                JOIN users u ON rr.user_id = u.id
                JOIN recognitions r ON rr.recognition_id = r.id
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
                u.profile_image_url AS actor_profile_image
             FROM notifications n
             LEFT JOIN users u ON n.actor_id = u.id
             WHERE n.user_id = $1
             ORDER BY n.created_at DESC
             LIMIT 30`,
            [id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error en /:id/notifications:', err.message);
        res.status(500).send('Error al obtener notificaciones.');
    }
});

// CONTADOR DE NO LEÍDAS
router.get('/:id/notifications/unread-count', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM notifications
             WHERE user_id = $1 AND is_read = FALSE`,
            [id]
        );

        res.json({ total: result.rows[0].total });
    } catch (err) {
        console.error('Error en unread-count:', err.message);
        res.status(500).send('Error al obtener contador de notificaciones.');
    }
});

// MARCAR UNA COMO LEÍDA
router.patch('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = $1
             RETURNING *`,
            [notificationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al marcar notificación como leída:', err.message);
        res.status(500).send('Error al actualizar la notificación.');
    }
});

// MARCAR TODAS COMO LEÍDAS
router.patch('/:id/notifications/read-all', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE user_id = $1 AND is_read = FALSE`,
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error al marcar todas como leídas:', err.message);
        res.status(500).send('Error al actualizar notificaciones.');
    }
});

module.exports = router;
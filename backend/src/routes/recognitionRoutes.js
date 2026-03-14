const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta para imágenes de reconocimientos
const uploadDir = path.join(__dirname, '..', 'uploads', 'recognitions');
fs.mkdirSync(uploadDir, { recursive: true });

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `recognition_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`);
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

// ENVIAR RECONOCIMIENTO
router.post('/send', upload.array('recognitionImages', 5), async (req, res) => {
    try {
        const { sender_id, receiver_id, receiver_control_number, message, category } = req.body;

        let finalReceiverId = receiver_id;

        if (!finalReceiverId && receiver_control_number) {
            const receiverEmail = `za${receiver_control_number}@zapopan.tecmm.edu.mx`;

            const userLookup = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [receiverEmail]
            );

            if (userLookup.rows.length === 0) {
                return res.status(404).json({
                    error: 'No se encontró al compañero. Debe haber iniciado sesión al menos una vez en ¡Tec! ¡you!.'
                });
            }

            finalReceiverId = userLookup.rows[0].id;
        }

        if (!finalReceiverId) {
            return res.status(400).json({
                error: 'Debes seleccionar un usuario válido para enviar el reconocimiento.'
            });
        }

        const newRecognition = await pool.query(
            `INSERT INTO recognitions (sender_id, receiver_id, message, category)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [sender_id, finalReceiverId, message, category]
        );

        const recognitionId = newRecognition.rows[0].id;

        // Guardar imágenes si existen
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imagePath = `/uploads/recognitions/${file.filename}`;

                await pool.query(
                    `INSERT INTO recognition_images (recognition_id, image_url)
                     VALUES ($1, $2)`,
                    [recognitionId, imagePath]
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
                    recognitionId
                ]
            );
        }

        res.json({
            success: true,
            message: '¡Reconocimiento enviado con éxito!',
            data: newRecognition.rows[0]
        });
    } catch (err) {
        console.error('Error en /send:', err.message);
        res.status(500).send('Error interno al procesar el reconocimiento.');
    }
});

// FEED
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
                            'id', ri.id,
                            'image_url', ri.image_url
                        )
                    ) FILTER (WHERE ri.id IS NOT NULL),
                    '[]'
                ) AS images
            FROM recognitions r
            JOIN users s ON r.sender_id = s.id
            JOIN users rec ON r.receiver_id = rec.id
            LEFT JOIN recognition_images ri ON r.id = ri.recognition_id
            GROUP BY r.id, s.id, rec.id
            ORDER BY r.created_at DESC
        `);

        res.json(feed.rows);
    } catch (err) {
        console.error('Error en /feed:', err.message);
        res.status(500).send('Error al obtener las publicaciones del muro.');
    }
});

// REACCIONAR
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
                        Number(id)
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
                    Number(id)
                ]
            );
        }

        res.json(created.rows[0]);
    } catch (err) {
        console.error('Error en POST /:id/react:', err.message);
        res.status(500).send('Error al guardar la reacción.');
    }
});

// OBTENER REACCIONES
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
            users: userReactions.rows
        });
    } catch (err) {
        console.error('Error en GET /:id/reactions:', err.message);
        res.status(500).send('Error al obtener las reacciones.');
    }
});

// AGREGAR COMENTARIO
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({ error: 'El comentario no puede estar vacío.' });
        }

        const newComment = await pool.query(
            `INSERT INTO recognition_comments (recognition_id, user_id, comment)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [id, user_id, comment.trim()]
        );

        const recognitionOwner = await pool.query(
            `SELECT receiver_id FROM recognitions WHERE id = $1`,
            [id]
        );

        const receiverId = recognitionOwner.rows[0]?.receiver_id || null;

        if (receiverId && Number(receiverId) !== Number(user_id)) {
            await pool.query(
                `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    receiverId,
                    user_id,
                    'comment_received',
                    'Comentaron tu reconocimiento',
                    comment.trim(),
                    Number(id)
                ]
            );
        }

        res.json(newComment.rows[0]);
    } catch (err) {
        console.error('Error en POST /:id/comments:', err.message);
        res.status(500).send('Error al agregar comentario.');
    }
});

// OBTENER COMENTARIOS
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;

        const comments = await pool.query(
            `SELECT
                rc.id,
                rc.recognition_id,
                rc.user_id,
                rc.comment,
                rc.created_at,
                COALESCE(u.display_name, u.fullname) AS user_name,
                u.profile_image_url
             FROM recognition_comments rc
             JOIN users u ON rc.user_id = u.id
             WHERE rc.recognition_id = $1
             ORDER BY rc.created_at ASC`,
            [id]
        );

        res.json(comments.rows);
    } catch (err) {
        console.error('Error en GET /:id/comments:', err.message);
        res.status(500).send('Error al obtener comentarios.');
    }
});

module.exports = router;
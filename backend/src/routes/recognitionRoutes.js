const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ruta para enviar un nuevo reconocimiento
router.post('/send', async (req, res) => {
    try {
        const { sender_id, receiver_id, message, category } = req.body;

        // Insertamos el reconocimiento en la base de datos
        // Dejamos 'ai_refined_message' como null por ahora (hasta tener la API Key)
        const newRecognition = await pool.query(
            "INSERT INTO recognitions (sender_id, receiver_id, message, category) VALUES ($1, $2, $3, $4) RETURNING *",
            [sender_id, receiver_id, message, category]
        );

        res.json({
            success: true,
            message: "¡Reconocimiento enviado con éxito!",
            data: newRecognition.rows[0]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error al procesar el reconocimiento");
    }
});

// Ruta para ver el muro de reconocimientos (Feed)
router.get('/feed', async (req, res) => {
    try {
        const feed = await pool.query(`
            SELECT r.*, 
                   s.fullname AS sender_name, 
                   rec.fullname AS receiver_name 
            FROM recognitions r
            JOIN users s ON r.sender_id = s.id
            JOIN users rec ON r.receiver_id = rec.id
            ORDER BY r.created_at DESC
        `);
        res.json(feed.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error al obtener el feed");
    }
});

module.exports = router;
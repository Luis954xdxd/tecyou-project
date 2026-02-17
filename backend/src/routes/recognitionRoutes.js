const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * RUTA PARA ENVIAR RECONOCIMIENTO
 * Ahora busca al compañero por su Número de Control (ej: 220113032)
 * en lugar de pedir el ID interno de la base de datos.
 */
router.post('/send', async (req, res) => {
    try {
        const { sender_id, receiver_control_number, message, category } = req.body;

        // 1. Reconstruimos el correo institucional a partir del número de control
        // El patrón es 'za' + número + el dominio del Tecnológico Superior de Jalisco
        const receiverEmail = `za${receiver_control_number}@zapopan.tecmm.edu.mx`;

        // 2. Buscamos al usuario receptor en la tabla 'users'
        const userLookup = await pool.query(
            "SELECT id FROM users WHERE email = $1", 
            [receiverEmail]
        );

        // Si el compañero no existe (nunca ha iniciado sesión)
        if (userLookup.rows.length === 0) {
            return res.status(404).json({ 
                error: "No se encontró al compañero. Debe haber iniciado sesión al menos una vez en ¡Tec! ¡you!." 
            });
        }

        const receiver_id = userLookup.rows[0].id;

        // 3. Insertamos el reconocimiento con el ID real encontrado
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
        console.error("Error en /send:", err.message);
        res.status(500).send("Error interno al procesar el reconocimiento.");
    }
});

/**
 * RUTA PARA EL MURO (FEED)
 * Muestra los nombres reales de los alumnos usando JOINs
 */
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
        console.error("Error en /feed:", err.message);
        res.status(500).send("Error al obtener las publicaciones del muro.");
    }
});

module.exports = router;
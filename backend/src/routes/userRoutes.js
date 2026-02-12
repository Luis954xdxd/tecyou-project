const express = require('express');
const router = express.Router();
const pool = require('../db'); // Traemos la conexión a la base de datos

// Ruta para registrar un nuevo usuario (Estudiante/Docente)
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, role } = req.body;
        
        // Insertamos los datos en la tabla 'users' que creamos en el schema.sql
        const newUser = await pool.query(
            "INSERT INTO users (fullname, email, role) VALUES ($1, $2, $3) RETURNING *",
            [fullname, email, role]
        );

        res.json(newUser.rows[0]); // Devolvemos el usuario creado para confirmar
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor al registrar usuario");
    }
});

// Ruta para obtener a todos los usuarios (útil para el buscador de la red social)
router.get('/all', async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT * FROM users");
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
    }
});

module.exports = router;
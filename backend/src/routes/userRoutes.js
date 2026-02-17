const express = require('express');
const router = express.Router();
const pool = require('../db');

// Función para validar el correo institucional del TSJ Zapopan
const isValidInstitutionalEmail = (email) => {
    // Expresión regular: busca "za", luego dígitos (número de control) y el dominio oficial
    const regex = /^za\d+@zapopan\.tecmm\.edu\.mx$/;
    return regex.test(email);
};

router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        // Validar formato de correo antes de consultar la base de datos
        if (!isValidInstitutionalEmail(email)) {
            return res.status(400).json({ 
                error: "Acceso denegado. Solo se permiten correos institucionales (@zapopan.tecmm.edu.mx)." 
            });
        }

        // Buscar si el usuario ya existe
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length > 0) {
            res.json(user.rows[0]);
        } else {
            // Si el correo es válido pero no existe, lo registramos (Auto-registro inicial)
            // Extraemos un nombre temporal del correo o pedimos que se complete después
            const tempName = email.split('@')[0]; 
            const newUser = await pool.query(
                "INSERT INTO users (fullname, email, role) VALUES ($1, $2, $3) RETURNING *",
                [tempName, email, 'student']
            );
            res.json(newUser.rows[0]);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el proceso de autenticación");
    }
});

module.exports = router;
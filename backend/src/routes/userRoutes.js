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

module.exports = router;
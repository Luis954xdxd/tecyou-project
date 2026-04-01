const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const storiesPath = path.join(__dirname, '..', 'uploads', 'stories');

    if (!fs.existsSync(storiesPath)) {
      fs.mkdirSync(storiesPath, { recursive: true });
    }

    cb(null, storiesPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `story-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido para historias. Solo imágenes o videos válidos.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 40 * 1024 * 1024,
  },
});

router.post('/upload', upload.single('storyMedia'), async (req, res) => {
  try {
    const { user_id, text_content = '' } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'Falta el user_id.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Debes subir una imagen o video.' });
    }

    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const mediaUrl = `/uploads/stories/${req.file.filename}`;

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO stories (user_id, media_url, media_type, text_content, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, mediaUrl, mediaType, text_content, expiresAt]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error subiendo historia:', error);
    res.status(500).json({ error: 'No se pudo subir la historia.' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.*,
         u.fullname,
         u.display_name,
         u.profile_image_url
       FROM stories s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.expires_at > NOW()
       ORDER BY s.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo historias activas:', error);
    res.status(500).json({ error: 'No se pudieron obtener las historias.' });
  }
});

module.exports = router;
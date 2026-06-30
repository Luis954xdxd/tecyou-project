const express = require('express');
const pool = require('../db');
const { requireSession } = require('../middleware/adminAuth');

const router = express.Router();
const ALLOWED_TYPES = ['recognition', 'comment', 'profile', 'story', 'chat_message'];
const ALLOWED_REASONS = [
  'harassment',
  'inappropriate',
  'impersonation',
  'spam',
  'false_information',
  'personal_information',
  'other',
];

const ensureReportSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS content_reports (
      id SERIAL PRIMARY KEY,
      reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      target_type VARCHAR(40) NOT NULL,
      target_id INTEGER NOT NULL,
      reason VARCHAR(80) NOT NULL,
      details TEXT,
      status VARCHAR(30) DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      resolution_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolution_note TEXT`);
  await pool.query(`ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP`);
  await pool.query(`ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE recognition_comments ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
};

router.use(async (req, res, next) => {
  try {
    await ensureReportSchema();
    next();
  } catch (error) {
    console.error('Error preparando reportes:', error.message);
    res.status(500).json({ error: 'No se pudo preparar el sistema de reportes.' });
  }
});

router.post('/', requireSession, async (req, res) => {
  try {
    const targetType = String(req.body.target_type || '');
    const targetId = Number(req.body.target_id);
    const reason = String(req.body.reason || '');
    const details = String(req.body.details || '').trim().slice(0, 1000);

    if (!ALLOWED_TYPES.includes(targetType) || !Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({ error: 'El contenido reportado no es valido.' });
    }
    if (!ALLOWED_REASONS.includes(reason)) {
      return res.status(400).json({ error: 'Selecciona un motivo valido.' });
    }
    if (reason === 'other' && details.length < 8) {
      return res.status(400).json({ error: 'Explica brevemente el motivo del reporte.' });
    }

    if (targetType === 'recognition') {
      const target = await pool.query(`SELECT id, sender_id FROM recognitions WHERE id = $1`, [targetId]);
      if (target.rows.length === 0) return res.status(404).json({ error: 'La publicacion ya no existe.' });
      if (Number(target.rows[0].sender_id) === Number(req.authUser.id)) {
        return res.status(400).json({ error: 'No puedes reportar tu propia publicacion.' });
      }
    }
    if (targetType === 'comment') {
      const target = await pool.query(`SELECT id, user_id FROM recognition_comments WHERE id = $1`, [targetId]);
      if (target.rows.length === 0) return res.status(404).json({ error: 'El comentario ya no existe.' });
      if (Number(target.rows[0].user_id) === Number(req.authUser.id)) return res.status(400).json({ error: 'No puedes reportar tu propio comentario.' });
    }
    if (targetType === 'profile') {
      const target = await pool.query(`SELECT id FROM users WHERE id = $1`, [targetId]);
      if (target.rows.length === 0) return res.status(404).json({ error: 'El perfil ya no existe.' });
      if (targetId === Number(req.authUser.id)) return res.status(400).json({ error: 'No puedes reportar tu propio perfil.' });
    }
    if (targetType === 'story') {
      const target = await pool.query(`SELECT id, user_id FROM stories WHERE id = $1`, [targetId]);
      if (target.rows.length === 0) return res.status(404).json({ error: 'La historia ya no existe.' });
      if (Number(target.rows[0].user_id) === Number(req.authUser.id)) return res.status(400).json({ error: 'No puedes reportar tu propia historia.' });
    }
    if (targetType === 'chat_message') {
      const target = await pool.query(
        `SELECT cm.id, cm.sender_id
         FROM chat_messages cm
         JOIN chat_participants cp ON cp.conversation_id = cm.conversation_id
         WHERE cm.id = $1 AND cp.user_id = $2`,
        [targetId, req.authUser.id]
      );
      if (target.rows.length === 0) return res.status(404).json({ error: 'El mensaje no existe o no pertenece a tu conversacion.' });
      if (Number(target.rows[0].sender_id) === Number(req.authUser.id)) return res.status(400).json({ error: 'No puedes reportar tu propio mensaje.' });
    }

    const duplicate = await pool.query(
      `SELECT id FROM content_reports
       WHERE reporter_user_id = $1 AND target_type = $2 AND target_id = $3
         AND status IN ('pending', 'reviewing')
       LIMIT 1`,
      [req.authUser.id, targetType, targetId]
    );
    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Ya enviaste un reporte sobre este contenido y sigue en revision.' });
    }

    const result = await pool.query(
      `INSERT INTO content_reports
         (reporter_user_id, target_type, target_id, reason, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status, created_at`,
      [req.authUser.id, targetType, targetId, reason, details || null]
    );
    res.status(201).json({
      message: 'Reporte enviado al equipo de moderacion.',
      report: result.rows[0],
    });
  } catch (error) {
    console.error('Error creando reporte:', error.message);
    res.status(500).json({ error: 'No se pudo enviar el reporte.' });
  }
});

module.exports = router;
module.exports.ensureReportSchema = ensureReportSchema;

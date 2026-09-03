const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { requireSession, requireSystemRole } = require('../middleware/adminAuth');
const router = express.Router();
const challengeDir = path.join(__dirname, '..', 'uploads', 'challenges');
const evidenceDir = path.join(__dirname, '..', 'uploads', 'recognitions');
[challengeDir, evidenceDir].forEach((dir) => fs.mkdirSync(dir, { recursive: true }));
const types = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, file.fieldname === 'evidence' ? evidenceDir : challengeDir),
    filename: (req, file, cb) => cb(null, `${file.fieldname}_${Date.now()}_${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    const allowed = types.includes(file.mimetype);
    cb(allowed ? null : new Error('Formato no permitido.'), allowed);
  },
  limits: { files: 1, fileSize: 40 * 1024 * 1024 },
});
const kind = (file) => file.mimetype.startsWith('video/') ? 'video' : 'image';
const ensureSchema = async () => {
  await pool.query(`
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN (
        'new_follower', 'recognition_received', 'reaction_received',
        'comment_received', 'comment_reply_received', 'mention_received',
        'story_mention', 'favorite_received', 'chat_message', 'report_updated',
        'institutional_challenge'
      ))
  `);
  await pool.query(`CREATE TABLE IF NOT EXISTS institutional_challenges (
    id SERIAL PRIMARY KEY, creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL, points INTEGER NOT NULL CHECK (points > 0), media_url TEXT,
    media_type VARCHAR(10), is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS institutional_challenge_completions (
    id SERIAL PRIMARY KEY, challenge_id INTEGER NOT NULL REFERENCES institutional_challenges(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recognition_id INTEGER REFERENCES recognitions(id) ON DELETE SET NULL,
    evidence_url TEXT NOT NULL, evidence_type VARCHAR(10) NOT NULL, points_awarded INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(challenge_id, user_id))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS user_reward_points (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
};
router.use(requireSession);
router.use(async (req, res, next) => {
  try { await ensureSchema(); next(); }
  catch (error) { console.error(error); res.status(500).json({ error: 'No se pudo preparar el módulo institucional.' }); }
});
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`SELECT c.*, COALESCE(u.display_name,u.fullname) creator_name,
      u.profile_image_url creator_profile_image, (cc.id IS NOT NULL) completed,
      COALESCE(p.total_points,0)::int user_total_points
      FROM institutional_challenges c JOIN users u ON u.id=c.creator_id
      LEFT JOIN institutional_challenge_completions cc ON cc.challenge_id=c.id AND cc.user_id=$1
      LEFT JOIN user_reward_points p ON p.user_id=$1 WHERE c.is_active=TRUE ORDER BY c.created_at DESC`,
      [req.authUser.id]);
    res.json({ challenges: result.rows });
  } catch (error) { res.status(500).json({ error: 'No se pudieron cargar las publicaciones institucionales.' }); }
});
router.post('/', requireSystemRole('admin','super_admin'), upload.single('challengeMedia'), async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();
    const points = Number(req.body.points);
    if (!content) return res.status(400).json({ error: 'El texto es obligatorio.' });
    if (!Number.isInteger(points) || points < 1 || points > 100000) return res.status(400).json({ error: 'Los puntos deben estar entre 1 y 100000.' });
    const result = await pool.query(`INSERT INTO institutional_challenges
      (creator_id,content,points,media_url,media_type) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.authUser.id, content, points, req.file ? `/uploads/challenges/${req.file.filename}` : null, req.file ? kind(req.file) : null]);
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
       SELECT id, $1, 'institutional_challenge', 'Nueva actividad institucional', $2, $3
       FROM users
       WHERE role IN ('student', 'teacher') AND id <> $1
         AND COALESCE(account_status, 'active') = 'active'`,
      [req.authUser.id, content, result.rows[0].id]
    );
    res.status(201).json({ challenge: result.rows[0] });
  } catch (error) { console.error(error); res.status(500).json({ error: 'No se pudo crear la publicación.' }); }
});
router.post('/:id/complete', upload.single('evidence'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'La evidencia en imagen o video es obligatoria.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM institutional_challenges WHERE id=$1 AND is_active=TRUE FOR UPDATE', [req.params.id]);
    if (!found.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Publicación no disponible.' }); }
    const item = found.rows[0];
    const url = `/uploads/recognitions/${req.file.filename}`;
    const rec = await client.query(`INSERT INTO recognitions (sender_id,receiver_id,message,category)
      VALUES ($1,$1,$2,'Colaboración') RETURNING id`, [req.authUser.id, `Cumplí el reto institucional: ${item.content}`]);
    await client.query('INSERT INTO recognition_media (recognition_id,media_url,media_type) VALUES ($1,$2,$3)', [rec.rows[0].id, url, kind(req.file)]);
    await client.query(`INSERT INTO institutional_challenge_completions
      (challenge_id,user_id,recognition_id,evidence_url,evidence_type,points_awarded) VALUES ($1,$2,$3,$4,$5,$6)`,
      [item.id, req.authUser.id, rec.rows[0].id, url, kind(req.file), item.points]);
    const score = await client.query(`INSERT INTO user_reward_points (user_id,total_points) VALUES ($1,$2)
      ON CONFLICT (user_id) DO UPDATE SET total_points=user_reward_points.total_points+EXCLUDED.total_points,
      updated_at=CURRENT_TIMESTAMP RETURNING total_points`, [req.authUser.id, item.points]);
    await client.query('COMMIT');
    res.status(201).json({ completed: true, recognition_id: rec.rows[0].id, points_awarded: item.points, total_points: score.rows[0].total_points });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return res.status(409).json({ error: 'Ya completaste esta publicación.' });
    console.error(error); res.status(500).json({ error: 'No se pudo registrar la evidencia.' });
  } finally { client.release(); }
});
module.exports = router;
module.exports.ensureSchema = ensureSchema;

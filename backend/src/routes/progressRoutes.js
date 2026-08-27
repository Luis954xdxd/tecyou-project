const express = require('express');
const router = express.Router();
const {
  requireSession,
  requireAcademicRole,
  bindAuthenticatedActor,
} = require('../middleware/adminAuth');
router.use(requireSession);
const pool = require('../db');
const {
  getUserAchievements,
  getUserBadges,
  getUserFrames,
  getUserProgressSummary,
  assignBadgeToUser,
} = require('../services/achievementService');

// ===============================
// RESUMEN DE PROGRESO DE UN USUARIO
// ===============================
router.get('/:userId/summary', async (req, res) => {
  try {
    const { userId } = req.params;

    const summary = await getUserProgressSummary(Number(userId));

    res.json({
      ok: true,
      summary,
    });
  } catch (error) {
    console.error('Error en GET /:userId/summary:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'No se pudo obtener el resumen de progreso.',
    });
  }
});

// ===============================
// LOGROS DE UN USUARIO
// ===============================
router.get('/:userId/achievements', async (req, res) => {
  try {
    const { userId } = req.params;

    const achievements = await getUserAchievements(Number(userId));

    res.json({
      ok: true,
      achievements,
    });
  } catch (error) {
    console.error('Error en GET /:userId/achievements:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'No se pudieron obtener los logros.',
    });
  }
});

// ===============================
// INSIGNIAS DE UN USUARIO
// ===============================
router.get('/:userId/badges', async (req, res) => {
  try {
    const { userId } = req.params;

    const badges = await getUserBadges(Number(userId));

    res.json({
      ok: true,
      badges,
    });
  } catch (error) {
    console.error('Error en GET /:userId/badges:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'No se pudieron obtener las insignias.',
    });
  }
});

// ===============================
// MARCOS DE UN USUARIO
// ===============================
router.get('/:userId/frames', async (req, res) => {
  try {
    const { userId } = req.params;

    const frames = await getUserFrames(Number(userId));

    res.json({
      ok: true,
      frames,
    });
  } catch (error) {
    console.error('Error en GET /:userId/frames:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'No se pudieron obtener los marcos.',
    });
  }
});

// ===============================
// DEFINICIONES DE INSIGNIAS
// ===============================
router.get('/definitions/badges/all', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM badge_definitions
      WHERE is_active = TRUE
      ORDER BY id ASC
      `
    );

    res.json({
      ok: true,
      badges: result.rows,
    });
  } catch (error) {
    console.error('Error en GET /definitions/badges/all:', error.message);
    res.status(500).json({
      ok: false,
      message: 'No se pudieron obtener las definiciones de insignias.',
    });
  }
});

// ===============================
// DEFINICIONES DE MARCOS
// ===============================
router.get('/definitions/frames/all', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM avatar_frame_definitions
      WHERE is_active = TRUE
      ORDER BY display_order ASC, id ASC
      `
    );

    res.json({
      ok: true,
      frames: result.rows,
    });
  } catch (error) {
    console.error('Error en GET /definitions/frames/all:', error.message);
    res.status(500).json({
      ok: false,
      message: 'No se pudieron obtener las definiciones de marcos.',
    });
  }
});

// ===============================
// ASIGNAR INSIGNIA MANUALMENTE
// SOLO MAESTROS
// ===============================
router.post(
  '/badges/assign',
  requireAcademicRole('teacher'),
  bindAuthenticatedActor('assigned_by_user_id'),
  async (req, res) => {
  try {
    const {
      target_user_id,
      badge_id,
      assigned_by_user_id,
      reason,
    } = req.body;

    if (!target_user_id || !badge_id || !assigned_by_user_id) {
      return res.status(400).json({
        ok: false,
        message: 'target_user_id, badge_id y assigned_by_user_id son obligatorios.',
      });
    }

    const result = await assignBadgeToUser({
      targetUserId: Number(target_user_id),
      badgeId: Number(badge_id),
      assignedByUserId: Number(assigned_by_user_id),
      reason: reason || null,
    });

    res.json({
      ok: true,
      message: result.alreadyAssigned
        ? 'La insignia ya estaba asignada a este usuario.'
        : 'Insignia asignada correctamente.',
      result,
    });
  } catch (error) {
    console.error('Error en POST /badges/assign:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'No se pudo asignar la insignia.',
    });
  }
  }
);

module.exports = router;

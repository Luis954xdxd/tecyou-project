const express = require('express');
const pool = require('../db');
const { requireSession, requireSystemRole } = require('../middleware/adminAuth');

const router = express.Router();
const ADMIN_ROLES = ['moderator', 'admin', 'super_admin'];

const ensureAdminSchema = async () => {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role VARCHAR(30) DEFAULT 'user'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) DEFAULT 'active'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`);
  await pool.query(`ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP`);
  await pool.query(`ALTER TABLE recognitions ADD COLUMN IF NOT EXISTS moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL`);
  await pool.query(`ALTER TABLE recognition_comments ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE stories ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
  await pool.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(30) DEFAULT 'visible'`);
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id SERIAL PRIMARY KEY,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(80) NOT NULL,
      target_type VARCHAR(40) NOT NULL,
      target_id INTEGER,
      reason TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS resolution_note TEXT`);
};

const audit = async (actorId, action, targetType, targetId, reason, metadata = {}) => {
  await pool.query(
    `INSERT INTO admin_audit_logs
       (actor_user_id, action, target_type, target_id, reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [actorId, action, targetType, targetId, reason || null, metadata]
  );
};

router.use(async (req, res, next) => {
  try {
    await ensureAdminSchema();
    next();
  } catch (error) {
    console.error('Error preparando administracion:', error.message);
    res.status(500).json({ error: 'No se pudo preparar el modulo administrativo.' });
  }
});
router.use(requireSession);
router.use(requireSystemRole(...ADMIN_ROLES));

router.get('/overview', async (req, res) => {
  try {
    const [
      users,
      recognitions,
      reports,
      suspended,
      recent,
      activeUsers,
      weeklyPosts,
      resolvedReports,
      topCategory,
      activeUsersByDay,
      postsByWeek,
      reportsByStatus,
      categories,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total FROM users`),
      pool.query(`SELECT COUNT(*)::int AS total FROM recognitions`),
      pool.query(`SELECT COUNT(*)::int AS total FROM content_reports WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE account_status = 'suspended'`),
      pool.query(`
        SELECT id, fullname, display_name, email, profile_image_url,
               role, system_role, account_status, last_login_at, created_at
        FROM users
        ORDER BY COALESCE(last_login_at, created_at) DESC
        LIMIT 6
      `),
      pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE last_login_at >= NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM recognitions WHERE created_at >= NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM content_reports WHERE status = 'resolved'`),
      pool.query(`
        SELECT category, COUNT(*)::int AS total
        FROM recognitions
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
      `),
      pool.query(`
        SELECT TO_CHAR(day, 'DD Mon') AS label,
               COUNT(u.id)::int AS total
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') day
        LEFT JOIN users u ON DATE(u.last_login_at) = DATE(day)
        GROUP BY day
        ORDER BY day
      `),
      pool.query(`
        SELECT TO_CHAR(week_start, 'DD Mon') AS label,
               COUNT(r.id)::int AS total
        FROM generate_series(
          date_trunc('week', CURRENT_DATE) - INTERVAL '5 weeks',
          date_trunc('week', CURRENT_DATE),
          INTERVAL '1 week'
        ) week_start
        LEFT JOIN recognitions r
          ON date_trunc('week', r.created_at) = week_start
        GROUP BY week_start
        ORDER BY week_start
      `),
      pool.query(`
        SELECT COALESCE(status, 'pending') AS label, COUNT(*)::int AS total
        FROM content_reports
        GROUP BY COALESCE(status, 'pending')
        ORDER BY total DESC
      `),
      pool.query(`
        SELECT COALESCE(category, 'Sin categoria') AS label, COUNT(*)::int AS total
        FROM recognitions
        GROUP BY COALESCE(category, 'Sin categoria')
        ORDER BY total DESC
        LIMIT 8
      `),
    ]);

    res.json({
      totals: {
        users: users.rows[0].total,
        recognitions: recognitions.rows[0].total,
        pending_reports: reports.rows[0].total,
        suspended_users: suspended.rows[0].total,
        active_users_24h: activeUsers.rows[0].total,
        weekly_recognitions: weeklyPosts.rows[0].total,
        resolved_reports: resolvedReports.rows[0].total,
        top_category: topCategory.rows[0]?.category || 'Sin datos',
      },
      recent_users: recent.rows,
      charts: {
        active_users_by_day: activeUsersByDay.rows,
        posts_by_week: postsByWeek.rows,
        reports_by_status: reportsByStatus.rows,
        categories: categories.rows,
      },
    });
  } catch (error) {
    console.error('Error en resumen administrativo:', error.message);
    res.status(500).json({ error: 'No se pudo cargar el resumen.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || 'all');
    const values = [`%${search}%`];
    let statusFilter = '';
    if (status !== 'all') {
      values.push(status);
      statusFilter = `AND COALESCE(account_status, 'active') = $${values.length}`;
    }

    const result = await pool.query(
      `SELECT id, fullname, display_name, email, profile_image_url, role,
              COALESCE(system_role, 'user') AS system_role,
              COALESCE(account_status, 'active') AS account_status,
              suspended_until, last_login_at, created_at
       FROM users
       WHERE ($1 = '%%' OR fullname ILIKE $1 OR display_name ILIKE $1 OR email ILIKE $1)
       ${statusFilter}
       ORDER BY created_at DESC
       LIMIT 100`,
      values
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error listando usuarios administrativos:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const status = String(req.query.status || 'pending');
    const targetType = String(req.query.target_type || 'all');
    const reason = String(req.query.reason || 'all');
    const search = String(req.query.search || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();
    const allowedStatuses = ['pending', 'reviewing', 'resolved', 'dismissed', 'all'];
    const allowedTargets = ['recognition', 'comment', 'profile', 'story', 'chat_message', 'all'];
    const selectedStatus = allowedStatuses.includes(status) ? status : 'pending';
    const selectedTargetType = allowedTargets.includes(targetType) ? targetType : 'all';
    const values = [];
    const filters = [];
    if (selectedStatus !== 'all') {
      values.push(selectedStatus);
      filters.push(`cr.status = $${values.length}`);
    }
    if (selectedTargetType !== 'all') {
      values.push(selectedTargetType);
      filters.push(`cr.target_type = $${values.length}`);
    }
    if (reason !== 'all') {
      values.push(reason);
      filters.push(`cr.reason = $${values.length}`);
    }
    if (from) {
      values.push(from);
      filters.push(`cr.created_at >= $${values.length}::date`);
    }
    if (to) {
      values.push(to);
      filters.push(`cr.created_at < ($${values.length}::date + INTERVAL '1 day')`);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const searchValue = search ? `%${search}%` : '';

    const result = await pool.query(
      `SELECT
         cr.*,
         COALESCE(reporter.display_name, reporter.fullname, 'Cuenta eliminada') AS reporter_name,
         reporter.profile_image_url AS reporter_profile_image,
         COALESCE(author.display_name, author.fullname, comment_author.display_name, comment_author.fullname, story_author.display_name, story_author.fullname, message_author.display_name, message_author.fullname, target_profile.display_name, target_profile.fullname) AS author_name,
         COALESCE(author.profile_image_url, comment_author.profile_image_url, story_author.profile_image_url, message_author.profile_image_url, target_profile.profile_image_url) AS author_profile_image,
         r.category AS content_category,
         COALESCE(r.moderation_status, rc.moderation_status, st.moderation_status, target_profile.moderation_status, cm.moderation_status) AS moderation_status,
         COALESCE(r.message, rc.comment, st.caption, cm.content, target_profile.bio) AS content_text,
         COALESCE(st.media_url, cm.media_url) AS target_media_url,
         COALESCE(st.media_type, cm.message_type) AS target_media_type,
         COALESCE(
           (SELECT json_agg(json_build_object('id', rm.id, 'media_url', rm.media_url, 'media_type', rm.media_type) ORDER BY rm.id)
            FROM recognition_media rm WHERE rm.recognition_id = r.id),
           '[]'::json
         ) AS media,
         duplicate_reports.total AS target_report_count
       FROM content_reports cr
       LEFT JOIN users reporter ON reporter.id = cr.reporter_user_id
       LEFT JOIN recognitions r ON cr.target_type = 'recognition' AND r.id = cr.target_id
       LEFT JOIN users author ON author.id = r.sender_id
       LEFT JOIN recognition_comments rc ON cr.target_type = 'comment' AND rc.id = cr.target_id
       LEFT JOIN users comment_author ON comment_author.id = rc.user_id
       LEFT JOIN stories st ON cr.target_type = 'story' AND st.id = cr.target_id
       LEFT JOIN users story_author ON story_author.id = st.user_id
       LEFT JOIN users target_profile ON cr.target_type = 'profile' AND target_profile.id = cr.target_id
       LEFT JOIN chat_messages cm ON cr.target_type = 'chat_message' AND cm.id = cr.target_id
       LEFT JOIN users message_author ON message_author.id = cm.sender_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS total
         FROM content_reports cr2
         WHERE cr2.target_type = cr.target_type
           AND cr2.target_id = cr.target_id
       ) duplicate_reports ON TRUE
       ${whereClause}
       ${searchValue ? `${whereClause ? 'AND' : 'WHERE'} (
         reporter.display_name ILIKE $${values.length + 1}
         OR reporter.fullname ILIKE $${values.length + 1}
         OR reporter.email ILIKE $${values.length + 1}
         OR author.display_name ILIKE $${values.length + 1}
         OR author.fullname ILIKE $${values.length + 1}
         OR comment_author.display_name ILIKE $${values.length + 1}
         OR comment_author.fullname ILIKE $${values.length + 1}
         OR story_author.display_name ILIKE $${values.length + 1}
         OR story_author.fullname ILIKE $${values.length + 1}
         OR message_author.display_name ILIKE $${values.length + 1}
         OR message_author.fullname ILIKE $${values.length + 1}
         OR target_profile.display_name ILIKE $${values.length + 1}
         OR target_profile.fullname ILIKE $${values.length + 1}
         OR r.message ILIKE $${values.length + 1}
         OR rc.comment ILIKE $${values.length + 1}
         OR st.caption ILIKE $${values.length + 1}
         OR cm.content ILIKE $${values.length + 1}
       )` : ''}
       ORDER BY CASE cr.status WHEN 'pending' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
                cr.created_at DESC
       LIMIT 100`,
      searchValue ? [...values, searchValue] : values
    );
    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Error cargando reportes:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los reportes.' });
  }
});

router.patch('/reports/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const reportId = Number(req.params.id);
    const action = String(req.body.action || '');
    const note = String(req.body.note || '').trim();
    const allowedActions = ['review', 'dismiss', 'resolve', 'hide_content', 'restore_content'];
    if (!allowedActions.includes(action)) return res.status(400).json({ error: 'Accion no valida.' });
    if (['dismiss', 'resolve', 'hide_content'].includes(action) && note.length < 5) {
      return res.status(400).json({ error: 'Escribe una nota de resolucion de al menos 5 caracteres.' });
    }

    await client.query('BEGIN');
    const reportResult = await client.query(`SELECT * FROM content_reports WHERE id = $1 FOR UPDATE`, [reportId]);
    if (reportResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reporte no encontrado.' });
    }
    const report = reportResult.rows[0];
    let nextStatus = report.status;
    if (action === 'review') nextStatus = 'reviewing';
    if (action === 'dismiss') nextStatus = 'dismissed';
    if (['resolve', 'hide_content', 'restore_content'].includes(action)) nextStatus = 'resolved';

    if (report.target_type === 'recognition' && action === 'hide_content') {
      await client.query(
        `UPDATE recognitions SET moderation_status = 'hidden', moderated_at = CURRENT_TIMESTAMP, moderated_by = $1 WHERE id = $2`,
        [req.authUser.id, report.target_id]
      );
    }
    if (report.target_type === 'recognition' && action === 'restore_content') {
      await client.query(
        `UPDATE recognitions SET moderation_status = 'visible', moderated_at = CURRENT_TIMESTAMP, moderated_by = $1 WHERE id = $2`,
        [req.authUser.id, report.target_id]
      );
    }
    const moderationTargets = {
      comment: ['recognition_comments', 'id'],
      story: ['stories', 'id'],
      profile: ['users', 'id'],
      chat_message: ['chat_messages', 'id'],
    };
    if (moderationTargets[report.target_type] && ['hide_content', 'restore_content'].includes(action)) {
      const [table, idColumn] = moderationTargets[report.target_type];
      const nextVisibility = action === 'hide_content' ? 'hidden' : 'visible';
      await client.query(`UPDATE ${table} SET moderation_status = $1 WHERE ${idColumn} = $2`, [nextVisibility, report.target_id]);
    }

    const updated = await client.query(
      `UPDATE content_reports
       SET status = $1::varchar, reviewed_by = $2,
           reviewed_at = CASE WHEN $1::varchar IN ('resolved', 'dismissed') THEN CURRENT_TIMESTAMP ELSE reviewed_at END,
           resolution_note = CASE WHEN $3::text <> '' THEN $3::text ELSE resolution_note END
       WHERE id = $4 RETURNING *`,
      [nextStatus, req.authUser.id, note, reportId]
    );
    if (['resolved', 'dismissed'].includes(nextStatus) && report.reporter_user_id) {
      await client.query(
        `INSERT INTO notifications (user_id, actor_id, type, title, content, reference_id)
         VALUES ($1, $2, 'report_updated', $3, $4, $5)`,
        [
          report.reporter_user_id,
          req.authUser.id,
          nextStatus === 'resolved' ? 'Tu reporte fue resuelto' : 'Tu reporte fue descartado',
          note || 'El equipo de moderacion reviso tu reporte.',
          reportId,
        ]
      );
    }
    await client.query(
      `INSERT INTO admin_audit_logs
         (actor_user_id, action, target_type, target_id, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.authUser.id, `report_${action}`, report.target_type, report.target_id, note || null, { report_id: reportId }]
    );
    await client.query('COMMIT');
    res.json({ report: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resolviendo reporte:', error.message);
    res.status(500).json({
      error: 'No se pudo procesar el reporte.',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  } finally {
    client.release();
  }
});

router.patch('/users/:id/status', requireSystemRole('admin', 'super_admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    const targetId = Number(req.params.id);
    const { status, reason, suspended_until } = req.body;
    const allowed = ['active', 'warned', 'suspended', 'disabled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Estado no valido.' });
    if (!reason || String(reason).trim().length < 5) {
      return res.status(400).json({ error: 'Escribe un motivo de al menos 5 caracteres.' });
    }
    if (targetId === Number(req.authUser.id)) {
      return res.status(400).json({ error: 'No puedes sancionar tu propia cuenta.' });
    }

    await client.query('BEGIN');
    const targetResult = await client.query(`SELECT system_role FROM users WHERE id = $1`, [targetId]);
    if (targetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    if (targetResult.rows[0].system_role === 'super_admin' && req.authUser.system_role !== 'super_admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Solo un superadministrador puede gestionar esa cuenta.' });
    }

    const updated = await client.query(
      `UPDATE users
       SET account_status = $1,
           suspended_until = CASE WHEN $1 = 'suspended' THEN $2::timestamp ELSE NULL END
       WHERE id = $3
       RETURNING id, account_status, suspended_until`,
      [status, suspended_until || null, targetId]
    );
    await client.query(
      `INSERT INTO admin_audit_logs
        (actor_user_id, action, target_type, target_id, reason, metadata)
       VALUES ($1, 'user_status_changed', 'user', $2, $3, $4)`,
      [req.authUser.id, targetId, String(reason).trim(), { status, suspended_until: suspended_until || null }]
    );
    await client.query('COMMIT');
    res.json({ user: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cambiando estado de usuario:', error.message);
    res.status(500).json({ error: 'No se pudo actualizar la cuenta.' });
  } finally {
    client.release();
  }
});

router.patch('/users/:id/role', requireSystemRole('super_admin'), async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const { system_role, reason } = req.body;
    const allowed = ['user', 'moderator', 'admin', 'super_admin'];
    if (!allowed.includes(system_role)) return res.status(400).json({ error: 'Rol no valido.' });
    if (targetId === Number(req.authUser.id) && system_role !== 'super_admin') {
      return res.status(400).json({ error: 'No puedes retirar tu propio rol de superadministrador.' });
    }
    const updated = await pool.query(
      `UPDATE users SET system_role = $1 WHERE id = $2
       RETURNING id, system_role`,
      [system_role, targetId]
    );
    if (updated.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await audit(req.authUser.id, 'system_role_changed', 'user', targetId, reason, { system_role });
    res.json({ user: updated.rows[0] });
  } catch (error) {
    console.error('Error cambiando rol administrativo:', error.message);
    res.status(500).json({ error: 'No se pudo cambiar el rol.' });
  }
});

router.get('/audit', requireSystemRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT log.*, COALESCE(u.display_name, u.fullname, 'Cuenta eliminada') AS actor_name
      FROM admin_audit_logs log
      LEFT JOIN users u ON u.id = log.actor_user_id
      ORDER BY log.created_at DESC
      LIMIT 100
    `);
    res.json({ logs: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo cargar la auditoria.' });
  }
});

module.exports = router;
module.exports.ensureAdminSchema = ensureAdminSchema;

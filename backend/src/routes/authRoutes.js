const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { issueSessionToken } = require('../middleware/adminAuth');

const router = express.Router();

const ensureAccountColumns = async () => {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role VARCHAR(30) DEFAULT 'user'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(30) DEFAULT 'active'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`);
};

const STUDENT_REGEX = /^za\d+@zapopan\.tecmm\.edu\.mx$/i;
const TEACHER_REGEX = /^[a-z]+(?:\.[a-z]+)+@zapopan\.tecmm\.edu\.mx$/i;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const isValidInstitutionalEmail = (email = '') => {
  return STUDENT_REGEX.test(email) || TEACHER_REGEX.test(email);
};

const getRoleFromEmail = (email = '') => {
  if (STUDENT_REGEX.test(email)) return 'student';
  if (TEACHER_REGEX.test(email)) return 'teacher';
  return 'student';
};

const isValidPassword = (password = '') => PASSWORD_REGEX.test(password);

const getDefaultBio = () =>
  'Usuario participante en la comunidad ¡Tec! ¡you!, enfocado en reconocer logros, fortalecer vínculos y visibilizar el impacto positivo dentro del TSJ.';

const sanitizeUser = (userRow) => {
  if (!userRow) return null;
  const { password_hash, ...safeUser } = userRow;
  return safeUser;
};

// ===============================
// REGISTRO
// ===============================
router.post('/register', async (req, res) => {
  try {
    await ensureAccountColumns();
    const { email, password, confirmPassword } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'Correo, contraseña y confirmación de contraseña son obligatorios.',
      });
    }

    if (!isValidInstitutionalEmail(normalizedEmail)) {
      return res.status(400).json({
        error:
          'Solo se permiten correos institucionales válidos del TSJ para alumnos o maestros.',
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error:
          'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula y un carácter especial.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'La confirmación de contraseña no coincide.',
      });
    }

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    const passwordHash = await bcrypt.hash(password, 10);
    const role = getRoleFromEmail(normalizedEmail);
    const tempName = normalizedEmail.split('@')[0];

    // Usuario ya existe
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];

      // Ya estaba registrado con contraseña
      if (user.password_hash) {
        return res.status(409).json({
          error: 'Este correo ya tiene una cuenta registrada. Inicia sesión.',
        });
      }

      // Usuario antiguo: se activa su cuenta sin perder su id, perfil ni reconocimientos
      const updatedUser = await pool.query(
        `UPDATE users
         SET password_hash = $1,
             role = COALESCE(role, $2),
             fullname = COALESCE(NULLIF(fullname, ''), $3),
             display_name = COALESCE(NULLIF(display_name, ''), $3),
             bio = COALESCE(bio, $4),
             tags = COALESCE(tags, $5)
         WHERE id = $6
         RETURNING *`,
        [
          passwordHash,
          role,
          tempName,
          getDefaultBio(),
          ['Comunidad TSJ', 'Reconocimiento positivo'],
          user.id,
        ]
      );

      return res.status(200).json({
        message: 'Cuenta existente activada correctamente.',
        user: sanitizeUser(updatedUser.rows[0]),
      });
    }

    // Usuario nuevo
    const newUser = await pool.query(
      `INSERT INTO users (
        fullname,
        display_name,
        email,
        role,
        bio,
        tags,
        is_verified,
        password_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        tempName,
        tempName,
        normalizedEmail,
        role,
        getDefaultBio(),
        ['Comunidad TSJ', 'Reconocimiento positivo'],
        false,
        passwordHash,
      ]
    );

    return res.status(201).json({
      message: 'Cuenta registrada correctamente.',
      user: sanitizeUser(newUser.rows[0]),
    });
  } catch (err) {
    console.error('Error en POST /register:', err.message);
    return res.status(500).json({
      error: 'Error interno al registrar la cuenta.',
    });
  }
});

// ===============================
// LOGIN
// ===============================
router.post('/login', async (req, res) => {
  try {
    await ensureAccountColumns();
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: 'Correo y contraseña son obligatorios.',
      });
    }

    if (!isValidInstitutionalEmail(normalizedEmail)) {
      return res.status(400).json({
        error:
          'Solo se permiten correos institucionales válidos del TSJ para alumnos o maestros.',
      });
    }

    const userResult = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No existe una cuenta registrada con ese correo. Primero regístrate.',
      });
    }

    let user = userResult.rows[0];

    // Usuario antiguo sin contraseña
    if (!user.password_hash) {
      return res.status(403).json({
        code: 'ACCOUNT_NEEDS_ACTIVATION',
        error:
          'Esta cuenta ya existe desde el sistema anterior, pero aún no tiene contraseña. Ve a Registro y completa su activación con el mismo correo.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'La contraseña es incorrecta.',
      });
    }

    return res.json({
      message: 'Inicio de sesión exitoso.',
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Error en POST /login:', err.message);
    return res.status(500).json({
      error: 'Error interno al iniciar sesión.',
    });
  }
});

// Login con sesion firmada. Se mantiene /login por compatibilidad temporal.
router.post('/session', async (req, res) => {
  try {
    await ensureAccountColumns();
    const normalizedEmail = normalizeEmail(req.body.email);
    const password = req.body.password || '';

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Correo y contrasena son obligatorios.' });
    }
    if (!isValidInstitutionalEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Usa un correo institucional valido del TSJ.' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [normalizedEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta registrada con ese correo.' });
    }

    let user = result.rows[0];
    if (!user.password_hash) {
      return res.status(403).json({
        code: 'ACCOUNT_NEEDS_ACTIVATION',
        error: 'Esta cuenta necesita activarse desde la pantalla de registro.',
      });
    }
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'La contrasena es incorrecta.' });
    }

    const configuredSuperAdmin = normalizeEmail(process.env.SUPER_ADMIN_EMAIL || '');
    if (configuredSuperAdmin && normalizedEmail === configuredSuperAdmin) {
      const promoted = await pool.query(
        `UPDATE users SET system_role = 'super_admin' WHERE id = $1 RETURNING *`,
        [user.id]
      );
      user = promoted.rows[0] || user;
    }

    const suspensionActive =
      user.account_status === 'suspended' &&
      (!user.suspended_until || new Date(user.suspended_until) > new Date());
    if (user.account_status === 'disabled' || suspensionActive) {
      return res.status(403).json({
        code: 'ACCOUNT_RESTRICTED',
        error: user.account_status === 'disabled'
          ? 'Esta cuenta fue deshabilitada. Contacta a un administrador.'
          : 'Esta cuenta se encuentra suspendida temporalmente.',
      });
    }

    if (user.account_status === 'suspended') {
      const reactivated = await pool.query(
        `UPDATE users SET account_status = 'active', suspended_until = NULL WHERE id = $1 RETURNING *`,
        [user.id]
      );
      user = reactivated.rows[0] || user;
    }

    const loginResult = await pool.query(
      `UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [user.id]
    );
    user = loginResult.rows[0] || user;

    return res.json({
      message: 'Inicio de sesion exitoso.',
      user: sanitizeUser(user),
      token: issueSessionToken(user),
    });
  } catch (error) {
    console.error('Error en POST /session:', error.message);
    return res.status(500).json({ error: 'Error interno al iniciar sesion.' });
  }
});

module.exports = router;

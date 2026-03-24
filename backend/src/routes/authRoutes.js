const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');

const router = express.Router();

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

    const user = userResult.rows[0];

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

module.exports = router;
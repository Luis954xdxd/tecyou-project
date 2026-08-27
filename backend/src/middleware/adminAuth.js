const crypto = require('crypto');
const pool = require('../db');

const SESSION_TTL_SECONDS = 60 * 60 * 12;

const getSessionSecret = () =>
  process.env.SESSION_SECRET || 'tec-you-development-session-secret-change-me';

const encode = (value) => Buffer.from(value).toString('base64url');

const sign = (value) =>
  crypto.createHmac('sha256', getSessionSecret()).update(value).digest('base64url');

const issueSessionToken = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode(JSON.stringify({
    sub: Number(user.id),
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  }));

  return `${payload}.${sign(payload)}`;
};

const readSessionToken = (token = '') => {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.sub || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

const requireSession = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const bearerToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    // EventSource no permite configurar Authorization. Se admite el token en
    // query exclusivamente para el canal SSE y se evita para el resto de la API.
    const sseToken = req.path.startsWith('/events/')
      ? String(req.query.access_token || '')
      : '';
    const token = bearerToken || sseToken;
    const session = readSessionToken(token);

    if (!session) {
      return res.status(401).json({ error: 'Sesion invalida o vencida.' });
    }

    const result = await pool.query(
      `SELECT id, fullname, display_name, email, role,
              COALESCE(system_role, 'user') AS system_role,
              COALESCE(account_status, 'active') AS account_status,
              suspended_until
       FROM users
       WHERE id = $1`,
      [session.sub]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'La cuenta de la sesion ya no existe.' });
    }

    const user = result.rows[0];
    const suspensionActive =
      user.account_status === 'suspended' &&
      (!user.suspended_until || new Date(user.suspended_until) > new Date());

    if (user.account_status === 'disabled' || suspensionActive) {
      return res.status(403).json({ error: 'Esta cuenta no tiene acceso al sistema.' });
    }

    req.authUser = user;
    return next();
  } catch (error) {
    console.error('Error validando sesion:', error.message);
    return res.status(500).json({ error: 'No se pudo validar la sesion.' });
  }
};

const requireSystemRole = (...allowedRoles) => (req, res, next) => {
  if (!req.authUser || !allowedRoles.includes(req.authUser.system_role)) {
    return res.status(403).json({ error: 'No tienes permisos para realizar esta accion.' });
  }
  return next();
};

const requireAcademicRole = (...allowedRoles) => (req, res, next) => {
  if (!req.authUser || !allowedRoles.includes(req.authUser.role)) {
    return res.status(403).json({ error: 'Tu rol academico no permite realizar esta accion.' });
  }
  return next();
};

const requireSelfParam = (paramName = 'id') => (req, res, next) => {
  if (Number(req.params[paramName]) !== Number(req.authUser?.id)) {
    return res.status(403).json({ error: 'No puedes realizar esta accion sobre otra cuenta.' });
  }
  return next();
};

const bindAuthenticatedActor = (...fieldNames) => (req, res, next) => {
  req.body = req.body || {};
  fieldNames.forEach((fieldName) => {
    req.body[fieldName] = req.authUser.id;
  });
  return next();
};

module.exports = {
  issueSessionToken,
  requireSession,
  requireSystemRole,
  requireAcademicRole,
  requireSelfParam,
  bindAuthenticatedActor,
};

const { Pool } = require('pg');
require('dotenv').config();

const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

// DATABASE_URL permite usar proveedores cloud como Railway, Render, Supabase o Neon.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    };

const pool = new Pool({
  ...poolConfig,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
});

// Prueba de conexión inicial
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.stack);
  } else {
    console.log('Conexión a PostgreSQL exitosa. Hora del servidor:', res.rows[0].now);
  }
});

module.exports = pool;

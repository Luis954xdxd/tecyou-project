const axios = require('axios');

const MODERATION_URL = process.env.MODERATION_URL || 'http://127.0.0.1:8001/moderate';

const PALABRAS_PROHIBIDAS = [
  'pendejo',
  'pendeja',
  'idiota',
  'imbecil',
  'estupido',
  'mierda',
  'cabron',
  'puta',
  'puto',
  'joto',
  'maricon',
  'perra',
  'perro',
];

function normalizarTexto(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

function contienePalabraProhibida(text = '') {
  const limpio = ` ${normalizarTexto(text)} `;

  return PALABRAS_PROHIBIDAS.some((palabra) => {
    const palabraLimpia = normalizarTexto(palabra);
    return limpio.includes(` ${palabraLimpia} `);
  });
}

async function moderateText(text) {
  const cleanText = String(text || '').trim();

  if (!cleanText) {
    return {
      permitido: false,
      motivo: 'El mensaje no puede estar vacio.',
      toxicidad: 0,
    };
  }

  if (contienePalabraProhibida(cleanText)) {
    return {
      permitido: false,
      motivo: 'Tu mensaje contiene lenguaje ofensivo.',
      toxicidad: 1,
      source: 'local-blocklist',
    };
  }

  try {
    const response = await axios.post(
      MODERATION_URL,
      { text: cleanText },
      { timeout: 1 }
    );

    return response.data;
  } catch (error) {
    console.error('Error en moderacion:', error.message);

    return {
      permitido: true,
      motivo: 'Moderacion avanzada no disponible; se aplico filtro local.',
      toxicidad: 0,
      source: 'local-fallback',
    };
  }
}

module.exports = {
  moderateText,
  contienePalabraProhibida,
};

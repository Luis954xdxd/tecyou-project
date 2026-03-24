const axios = require('axios');

const MODERATION_URL = 'http://127.0.0.1:8001/moderate';

async function moderateText(text) {
  try {
    const response = await axios.post(
      MODERATION_URL,
      { text },
      { timeout: 1200 }
    );

    return response.data;
  } catch (error) {
    console.error('Error en moderación:', error.message);

    return {
      permitido: true,
      motivo: 'Moderación no disponible, se permitió por continuidad.',
      toxicidad: 0
    };
  }
}

module.exports = { moderateText };
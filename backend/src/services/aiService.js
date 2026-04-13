const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

async function generateRecognitionText({
  baseText,
  recognitionType = '',
  receiverName = '',
  senderName = '',
}) {
  const safeBaseText = normalizeText(baseText);
  const safeRecognitionType = normalizeText(recognitionType);
  const safeReceiverName = normalizeText(receiverName);
  const safeSenderName = normalizeText(senderName);

  if (!safeBaseText) {
    throw new Error('El texto base del reconocimiento es obligatorio.');
  }

  const systemPrompt = `
Eres un asistente de redacción para una plataforma universitaria de reconocimientos llamada ¡Tec! ¡you!.
Tu trabajo es mejorar el texto de un reconocimiento manteniendo la intención original del usuario.

Reglas obligatorias:
1. Responde únicamente con el texto final del reconocimiento.
2. Escribe en español.
3. Mantén un tono positivo, respetuoso, claro y natural.
4. No inventes hechos que no aparezcan en el mensaje original.
5. No uses emojis.
6. No escribas títulos, listas ni explicaciones.
7. El resultado debe sentirse humano y apropiado para una comunidad académica.
8. Si el mensaje original es corto, amplíalo moderadamente sin exagerar.
9. El resultado debe tener entre 2 y 4 oraciones.
`;

  const userPrompt = `
Mejora la redacción del siguiente reconocimiento.

Datos de contexto:
- Tipo de reconocimiento: ${safeRecognitionType || 'No especificado'}
- Persona reconocida: ${safeReceiverName || 'No especificada'}
- Persona que reconoce: ${safeSenderName || 'No especificada'}

Texto original:
"${safeBaseText}"
`;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      throw new Error('La IA no devolvió texto.');
    }

    return outputText;
  } catch (error) {
    console.error('Error al generar reconocimiento con IA:', error);

    if (error.status === 401) {
      throw new Error('La API key de OpenAI es inválida o no tiene acceso.');
    }

    if (error.status === 429) {
      throw new Error('Se alcanzó el límite de solicitudes o la cuota de OpenAI.');
    }

    throw new Error(
      error?.message || 'Ocurrió un error al comunicarse con OpenAI.'
    );
  }
}

async function classifyRecognitionText({ message }) {
  const safeMessage = normalizeText(message);

  if (!safeMessage) {
    throw new Error('El mensaje a clasificar es obligatorio.');
  }

  const systemPrompt = `
Eres un clasificador de reconocimientos positivos para una plataforma universitaria llamada ¡Tec! ¡you!.

Tu tarea es analizar el mensaje y clasificarlo SOLO dentro de estas categorías permitidas:
- Colaboración
- Académico
- Liderazgo
- Creatividad

También debes detectar:
- sentiment: "positivo" o "muy_positivo"
- intensity: "baja", "media" o "alta"
- tags: entre 2 y 4 palabras clave relevantes en español

Reglas obligatorias:
1. Responde exclusivamente en formato JSON válido.
2. No agregues explicaciones.
3. No uses markdown.
4. No inventes categorías fuera de las permitidas.
5. Si el mensaje puede encajar en varias categorías, elige la más dominante.
`;

  const userPrompt = `
Clasifica el siguiente reconocimiento:

"${safeMessage}"

Devuelve el resultado con esta estructura exacta:
{
  "category": "Colaboración",
  "sentiment": "positivo",
  "intensity": "media",
  "tags": ["ejemplo1", "ejemplo2"]
}
`;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      throw new Error('La IA no devolvió clasificación.');
    }

    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch (parseError) {
      console.error('Respuesta no parseable de clasificación IA:', outputText);
      throw new Error('La IA devolvió una clasificación con formato inválido.');
    }

    const allowedCategories = [
      'Colaboración',
      'Académico',
      'Liderazgo',
      'Creatividad',
    ];

    const allowedSentiments = ['positivo', 'muy_positivo'];
    const allowedIntensities = ['baja', 'media', 'alta'];

    if (!allowedCategories.includes(parsed.category)) {
      throw new Error('La categoría devuelta por la IA no es válida.');
    }

    if (!allowedSentiments.includes(parsed.sentiment)) {
      parsed.sentiment = 'positivo';
    }

    if (!allowedIntensities.includes(parsed.intensity)) {
      parsed.intensity = 'media';
    }

    if (!Array.isArray(parsed.tags)) {
      parsed.tags = [];
    }

    parsed.tags = parsed.tags
      .filter((tag) => typeof tag === 'string' && tag.trim() !== '')
      .map((tag) => tag.trim())
      .slice(0, 4);

    return parsed;
  } catch (error) {
    console.error('Error al clasificar reconocimiento con IA:', error);

    if (error.status === 401) {
      throw new Error('La API key de OpenAI es inválida o no tiene acceso.');
    }

    if (error.status === 429) {
      throw new Error('Se alcanzó el límite de solicitudes o la cuota de OpenAI.');
    }

    throw new Error(
      error?.message || 'Ocurrió un error al clasificar el reconocimiento con IA.'
    );
  }
}

async function generateBadgeMetadata({
  message,
  category,
  sentiment = 'positivo',
  intensity = 'media',
  tags = [],
}) {
  const safeMessage = normalizeText(message);
  const safeCategory = normalizeText(category);

  if (!safeMessage) {
    throw new Error('El mensaje es obligatorio para generar metadatos de insignia.');
  }

  const systemPrompt = `
Eres un asistente creativo para una plataforma universitaria de reconocimientos llamada ¡Tec! ¡you!.

Tu tarea es generar los metadatos de una insignia visual basándote en:
- el mensaje
- la categoría
- el sentimiento
- la intensidad
- los tags

Debes responder SOLO en JSON válido con esta estructura:
{
  "badgeTitle": "Nombre corto de la insignia",
  "badgePrompt": "Prompt visual en inglés para generar una insignia moderna, elegante, universitaria y minimalista"
}

Reglas:
1. El badgeTitle debe ser corto, positivo y profesional.
2. El badgePrompt debe describir una insignia o badge, no una escena realista.
3. El estilo debe ser clean, modern, glossy, academic, vector badge.
4. No uses markdown.
5. No agregues explicaciones.
`;

  const userPrompt = `
Genera metadatos para una insignia con estos datos:

Mensaje: "${safeMessage}"
Categoría: "${safeCategory}"
Sentimiento: "${sentiment}"
Intensidad: "${intensity}"
Tags: ${Array.isArray(tags) ? tags.join(', ') : ''}

Responde con:
{
  "badgeTitle": "...",
  "badgePrompt": "..."
}
`;

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: systemPrompt,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      throw new Error('La IA no devolvió metadatos de insignia.');
    }

    let parsed;

    try {
      parsed = JSON.parse(outputText);
    } catch (parseError) {
      console.error('Respuesta no parseable de insignia IA:', outputText);
      throw new Error('La IA devolvió metadatos de insignia con formato inválido.');
    }

    return {
      badgeTitle: normalizeText(parsed.badgeTitle) || 'Insignia de Reconocimiento',
      badgePrompt:
        normalizeText(parsed.badgePrompt) ||
        'Modern university badge, clean vector style, elegant, blue and purple tones, recognition award icon',
    };
  } catch (error) {
    console.error('Error al generar metadatos de insignia con IA:', error);

    if (error.status === 401) {
      throw new Error('La API key de OpenAI es inválida o no tiene acceso.');
    }

    if (error.status === 429) {
      throw new Error('Se alcanzó el límite de solicitudes o la cuota de OpenAI.');
    }

    throw new Error(
      error?.message || 'No se pudieron generar los metadatos de la insignia.'
    );
  }
}

module.exports = {
  generateRecognitionText,
  classifyRecognitionText,
  generateBadgeMetadata,
};
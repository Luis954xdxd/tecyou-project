// backend/src/services/tecAgentService.js

const OpenAI = require('openai');
const tecKnowledge = require('../data/tecKnowledge');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askTecAgent(userQuestion) {
  const cleanQuestion = String(userQuestion || '').trim();

  if (!cleanQuestion) {
    return {
      answer: 'Escribe una pregunta para poder ayudarte.',
    };
  }

  const response = await client.responses.create({
    model: 'gpt-5.4-mini',
    instructions: `
${tecKnowledge}

Instrucciones estrictas:
- Responde únicamente sobre el TecMM Zapopan, TSJ Zapopan o la plataforma ¡Tec! ¡you!.
- Si el usuario pregunta algo fuera del tema, responde:
  "Solo puedo ayudarte con información relacionada con el Tecnológico Superior de Jalisco, unidad Zapopan, o la plataforma ¡Tec! ¡you!."
- No inventes datos.
- Si no está en la base de conocimiento, dilo claramente.
- Responde en español.
`,
    input: cleanQuestion,
  });

  return {
    answer: response.output_text,
  };
}

module.exports = {
  askTecAgent,
};
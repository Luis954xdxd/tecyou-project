// backend/src/routes/tecAgentRoutes.js

const express = require('express');
const router = express.Router();
const { requireSession } = require('../middleware/adminAuth');
router.use(requireSession);

const { askTecAgent } = require('../services/tecAgentService');

router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    const result = await askTecAgent(question);

    res.json({
      ok: true,
      answer: result.answer,
    });
  } catch (error) {
    console.error('Error en agente Tec:', error.message);

    res.status(500).json({
      ok: false,
      error: 'No se pudo responder la pregunta en este momento.',
    });
  }
});

module.exports = router;

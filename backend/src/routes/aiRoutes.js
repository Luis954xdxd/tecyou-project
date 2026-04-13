const express = require('express');
const router = express.Router();

const {
  generateRecognitionText,
  classifyRecognitionText,
} = require('../services/aiService');

router.post('/generate-recognition', async (req, res) => {
  try {
    const {
      baseText,
      recognitionType,
      receiverName,
      senderName,
    } = req.body;

    if (!baseText || !String(baseText).trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El campo baseText es obligatorio.',
      });
    }

    const improvedText = await generateRecognitionText({
      baseText,
      recognitionType,
      receiverName,
      senderName,
    });

    return res.status(200).json({
      ok: true,
      originalText: baseText,
      improvedText,
    });
  } catch (error) {
    console.error('Error en /generate-recognition:', error);

    return res.status(500).json({
      ok: false,
      message: error.message || 'No se pudo generar el reconocimiento con IA.',
    });
  }
});

router.post('/classify-recognition', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El campo message es obligatorio.',
      });
    }

    const classification = await classifyRecognitionText({ message });

    return res.status(200).json({
      ok: true,
      classification,
    });
  } catch (error) {
    console.error('Error en /classify-recognition:', error);

    return res.status(500).json({
      ok: false,
      message: error.message || 'No se pudo clasificar el reconocimiento con IA.',
    });
  }
});

module.exports = router;
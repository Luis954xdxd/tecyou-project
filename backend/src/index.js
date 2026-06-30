require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const tecAgentRoutes = require('./routes/tecAgentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { startModerationService } = require('./services/moderationProcess');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estÃ¡ticos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recognitions', recognitionRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tec-agent', tecAgentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Prueba de vida del servidor
app.get('/', (req, res) => {
  res.send('Servidor de Â¡Tec! Â¡you! activo y operando ðŸŽ“');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error detectado:', err.stack || err.message);

  res.status(500).json({
    error: err.message || 'Algo saliÃ³ mal en el servidor.',
  });
});

const startServer = async () => {
  await reportRoutes.ensureReportSchema();
  await startModerationService();

  app.listen(PORT, () => {
    console.log(`Servidor listo en: http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error.message);
  process.exit(1);
});


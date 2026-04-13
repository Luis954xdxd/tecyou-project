require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recognitions', recognitionRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/ai', aiRoutes);

// Prueba de vida del servidor
app.get('/', (req, res) => {
  res.send('Servidor de ¡Tec! ¡you! activo y operando 🎓');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error detectado:', err.stack || err.message);

  res.status(500).json({
    error: err.message || 'Algo salió mal en el servidor.',
  });
});

app.listen(PORT, () => {
  console.log(`Servidor listo en: http://localhost:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/userRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');

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

// Prueba de vida del servidor
app.get('/', (req, res) => {
  res.send('Servidor de ¡Tec! ¡you! activo y operando 🎓');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error detectado:', err.stack);
  res.status(500).send('Algo salió mal en el servidor.');
});

app.listen(PORT, () => {
  console.log(`Servidor listo en: http://localhost:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const userRoutes = require('./routes/userRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/recognitions', recognitionRoutes);

// Prueba de vida del servidor
app.get('/', (req, res) => {
  res.send('Servidor de ¡Tec! ¡you! activo y operando 🎓');
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(" Error detectado:", err.stack);
  res.status(500).send('Algo salió mal en el servidor.');
});

app.listen(PORT, () => {
  console.log(` Servidor listo en: http://localhost:${PORT}`);
});
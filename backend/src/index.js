// 1. Importación de librerías
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); // Importamos la conexión que hicimos antes

// 2. Inicialización de la aplicación
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares (Software intermedio)
app.use(cors()); // Permite que React se comunique con este servidor
app.use(express.json()); // Permite que el servidor entienda datos en formato JSON

// 4. Ruta de prueba (Endpoint)
app.get('/', (req, res) => {
  res.send('El servidor de ¡Tec! ¡you! está funcionando correctamente ');
});
// Importar rutas
const userRoutes = require('./routes/userRoutes');

// Usar rutas
app.use('/api/users', userRoutes);
// 5. Encendido del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Estado para guardar los reconocimientos que vienen del servidor
  const [recognitions, setRecognitions] = useState([]);

  // Función para obtener los datos del Backend
  const fetchFeed = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/recognitions/feed');
      setRecognitions(response.data);
    } catch (error) {
      console.error("Error al obtener el feed:", error);
    }
  };

  // Se ejecuta una sola vez cuando la página carga
  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>¡Tec! ¡you!</h1>
        <p>Plataforma de Reconocimiento Universitario - TSJ Zapopan</p>
      </header>

      <main className="feed-container">
        <h2>Muro de Reconocimientos</h2>
        {recognitions.length === 0 ? (
          <p>Aún no hay reconocimientos. ¡Sé el primero en enviar uno!</p>
        ) : (
          recognitions.map((rec) => (
            <div key={rec.id} className="recognition-card">
              <p><strong>De:</strong> {rec.sender_name}</p>
              <p><strong>Para:</strong> {rec.receiver_name}</p>
              <p className="message">"{rec.message}"</p>
              <span className="category">{rec.category}</span>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default App;
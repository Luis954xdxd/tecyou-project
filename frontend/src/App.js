import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
// Importamos el formulario que creamos para enviar reconocimientos
import RecognitionForm from './components/RecognitionForm';

function App() {
  // Estado para almacenar la lista de reconocimientos obtenidos del backend [cite: 54]
  const [recognitions, setRecognitions] = useState([]);

  /**
   * Función para obtener los datos actualizados desde el servidor.
   * Se conecta al puerto 5000 definido en nuestro backend.
   */
  const fetchFeed = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/recognitions/feed');
      setRecognitions(response.data);
    } catch (error) {
      console.error("Error al obtener el feed:", error);
    }
  };

  /**
   * useEffect asegura que la aplicación cargue los datos 
   * en cuanto el usuario entra a la plataforma[cite: 54].
   */
  useEffect(() => {
    fetchFeed();
  }, []);

  return (
    <div className="App">
      {/* Encabezado con la identidad del Tecnológico Superior de Jalisco [cite: 12, 29] */}
      <header className="App-header">
        <h1>¡Tec! ¡you!</h1>
        <p>Plataforma de Reconocimiento Universitario - Campus Zapopan</p>
      </header>

      <main className="container">
        {/* Sección para enviar reconocimientos [cite: 30] */}
        <section className="form-section">
          <RecognitionForm onRecognitionSent={fetchFeed} />
        </section>

        <hr />

        {/* Sección del Muro de Reconocimientos (Feed) [cite: 22] */}
        <section className="feed-section">
          <h2>Muro de Reconocimientos</h2>
          {recognitions.length === 0 ? (
            <p className="no-data">Aún no hay reconocimientos. ¡Sé el primero en motivar a tu comunidad!</p>
          ) : (
            <div className="feed-container">
              {recognitions.map((rec) => (
                <div key={rec.id} className="recognition-card">
                  <div className="card-header">
                    <span className="sender">De: <strong>{rec.sender_name}</strong></span>
                    <span className="receiver">Para: <strong>{rec.receiver_name}</strong></span>
                  </div>
                  <div className="card-body">
                    <p className="message">"{rec.message}"</p>
                    {/* Espacio reservado para la versión refinada por IA [cite: 31, 16] */}
                    {rec.ai_refined_message && (
                      <p className="ai-message"><em>Versión IA:</em> {rec.ai_refined_message}</p>
                    )}
                  </div>
                  <div className="card-footer">
                    <span className="category-tag">{rec.category}</span>
                    <span className="date">{new Date(rec.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
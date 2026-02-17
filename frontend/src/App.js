import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import RecognitionForm from './components/RecognitionForm';

function App() {
  const [user, setUser] = useState(null); 
  const [emailInput, setEmailInput] = useState('');
  const [recognitions, setRecognitions] = useState([]);
  const [error, setError] = useState('');

  const fetchFeed = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/recognitions/feed');
      setRecognitions(response.data);
    } catch (error) {
      console.error("Error al obtener el feed:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Intentamos la conexión al backend
      const response = await axios.post('http://localhost:5000/api/users/login', { email: emailInput });
      setUser(response.data);
      fetchFeed();
    } catch (err) {
      // Si hay error, mostramos el mensaje específico del servidor o uno genérico de conexión
      console.error("Detalle del error:", err);
      setError(err.response?.data?.error || "No se pudo conectar con el servidor. ¿Está encendido el Backend?");
    }
  };

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            {/* Reemplazamos el logo por un icono institucional genérico o texto */}
            <div className="tec-logo-placeholder">🎓</div>
            <h2>¡Tec! <strong>¡you!</strong></h2>
            <p>Inicia sesión con tu correo institucional del TSJ.</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Correo Institucional</label>
              <input 
                type="email" 
                placeholder="zaXXXXXXXXX@zapopan.tecmm.edu.mx" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button type="submit" className="btn-primary">Ingresar al Portal →</button>
          </form>
          <div className="login-footer">
            <p>Exclusivo para la comunidad del Tecnológico Superior de Jalisco.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="main-nav">
        <div className="nav-content">
          <span className="logo-text">¡Tec! <strong>¡you!</strong></span>
          <div className="user-info">
            <span>Hola, <strong>{user.fullname}</strong></span>
            <button onClick={() => setUser(null)} className="btn-logout">Cerrar Sesión</button>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <aside className="sidebar">
          <RecognitionForm onRecognitionSent={fetchFeed} senderId={user.id} />
        </aside>

        <section className="feed-section">
          <div className="feed-header">
            <h2>Muro de la Comunidad</h2>
            <p>Visualiza el impacto positivo de tus compañeros.</p>
          </div>
          
          <div className="feed-container">
            {recognitions.length === 0 ? (
              <p className="empty-feed">Aún no hay mensajes. ¡Comienza la cadena de gratitud!</p>
            ) : (
              recognitions.map((rec) => (
                <div key={rec.id} className="recognition-card">
                  <div className="card-accent"></div>
                  <div className="card-content">
                    <div className="card-meta">
                      <span className="badge-category">{rec.category}</span>
                      <span className="date">{new Date(rec.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="main-text">
                      <strong>{rec.sender_name}</strong> reconoció a <strong>{rec.receiver_name}</strong>
                    </p>
                    <p className="message-text">"{rec.message}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
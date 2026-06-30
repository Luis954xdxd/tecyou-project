import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logoTSJ from '../assets/logo-tsj.png';
import '../styles/auth.css';

const API_BASE = 'http://localhost:5000';

function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/auth/session`, {
        email: form.email,
        password: form.password,
      });

      const loggedUser = response.data.user;
      const sessionToken = response.data.token;

      if (onLoginSuccess) {
        await onLoginSuccess(loggedUser, sessionToken);
      }

      navigate(['moderator', 'admin', 'super_admin'].includes(loggedUser.system_role) ? '/admin' : '/');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'No se pudo iniciar sesión. Verifica que el backend esté encendido.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-brand-top">
            <div className="auth-brand-badge">TSJ</div>
            <span className="auth-brand-label">Plataforma de reconocimiento</span>
          </div>

          <h1>
            ¡Tec! <span>¡you!</span>
          </h1>

          <p className="auth-brand-description">
            Reconoce el esfuerzo, la dedicación y el impacto positivo de tu comunidad
            académica en un espacio moderno, institucional y humano.
          </p>

          <div className="auth-highlight-list">
            <div className="auth-highlight-card">
              <strong>Reconoce</strong>
              <span>Comparte mensajes positivos con tu comunidad.</span>
            </div>

            <div className="auth-highlight-card">
              <strong>Conecta</strong>
              <span>Fortalece el sentido de pertenencia del TSJ.</span>
            </div>

            <div className="auth-highlight-card">
              <strong>Inspira</strong>
              <span>Haz visible el impacto de las buenas acciones.</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <img src={logoTSJ} alt="Logo TSJ" className="auth-logo" />
            <h2>Iniciar sesión</h2>
            <p>Accede con tu correo institucional y tu contraseña.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label htmlFor="email">Correo institucional</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="za220113032@zapopan.tecmm.edu.mx o nombre.apellido@zapopan.tecmm.edu.mx"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {error ? <p className="auth-error-msg">{error}</p> : null}

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar al portal'}
            </button>
          </form>

          <div className="auth-footer">
            <p>¿Todavía no tienes cuenta?</p>
            <Link to="/registro" className="auth-secondary-link">
              Ir a registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logoTSJ from '../assets/logo-tsj.png';
import '../styles/auth.css';

const API_BASE = 'http://localhost:5000';

const STUDENT_REGEX = /^za\d+@zapopan\.tecmm\.edu\.mx$/i;
const TEACHER_REGEX = /^[a-z]+(?:\.[a-z]+)+@zapopan\.tecmm\.edu\.mx$/i;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

function RegisterPage({ onRegisterSuccess }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const emailType = useMemo(() => {
    if (STUDENT_REGEX.test(form.email)) return 'Alumno';
    if (TEACHER_REGEX.test(form.email)) return 'Maestro';
    return 'Formato no reconocido';
  }, [form.email]);

  const passwordChecks = useMemo(() => {
    return {
      minLength: form.password.length >= 8,
      hasUppercase: /[A-Z]/.test(form.password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(form.password),
      match: form.password !== '' && form.password === form.confirmPassword,
    };
  }, [form.password, form.confirmPassword]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateBeforeSubmit = () => {
    if (!STUDENT_REGEX.test(form.email) && !TEACHER_REGEX.test(form.email)) {
      return 'Debes usar un correo institucional válido de alumno o maestro.';
    }

    if (!PASSWORD_REGEX.test(form.password)) {
      return 'La contraseña debe tener mínimo 8 caracteres, al menos una mayúscula y un carácter especial.';
    }

    if (form.password !== form.confirmPassword) {
      return 'La confirmación de contraseña no coincide.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const validationError = validateBeforeSubmit();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/auth/register`, {
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccessMsg(response.data.message || '¡Cuenta creada! Redirigiendo al login...');

      // No iniciamos sesión automáticamente tras el registro.
      // El usuario debe hacer login con su correo y contraseña.
      setTimeout(() => {
        navigate('/login');
      }, 1400);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'No se pudo completar el registro. Verifica el backend.'
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
            <span className="auth-brand-label">Registro institucional</span>
          </div>

          <h1>
            ¡Tec! <span>¡you!</span>
          </h1>

          <p className="auth-brand-description">
            Registra tu cuenta con tu correo institucional del TSJ. Si tu cuenta ya
            existía antes del sistema con contraseña, este registro la activará sin perder
            tus reconocimientos ni tu perfil.
          </p>

          <div className="auth-highlight-list">
            <div className="auth-highlight-card">
              <strong>Alumno</strong>
              <span>Ejemplo: za220113032@zapopan.tecmm.edu.mx</span>
            </div>

            <div className="auth-highlight-card">
              <strong>Maestro</strong>
              <span>Ejemplo: nombre.apellido@zapopan.tecmm.edu.mx</span>
            </div>

            <div className="auth-highlight-card">
              <strong>Seguridad</strong>
              <span>Contraseña con mayúscula, carácter especial y mínimo 8 caracteres.</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <img src={logoTSJ} alt="Logo TSJ" className="auth-logo" />
            <h2>Crear cuenta</h2>
            <p>Completa tu registro institucional.</p>
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
              <small className="auth-helper-text">Tipo detectado: {emailType}</small>
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crea tu contraseña"
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

            <div className="auth-input-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="password-input-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="password-checklist">
              <div className={passwordChecks.minLength ? 'ok' : 'pending'}>
                Mínimo 8 caracteres
              </div>
              <div className={passwordChecks.hasUppercase ? 'ok' : 'pending'}>
                Al menos una mayúscula
              </div>
              <div className={passwordChecks.hasSpecialChar ? 'ok' : 'pending'}>
                Al menos un carácter especial
              </div>
              <div className={passwordChecks.match ? 'ok' : 'pending'}>
                Confirmación de contraseña correcta
              </div>
            </div>

            {error ? <p className="auth-error-msg">{error}</p> : null}
            {successMsg ? <p className="auth-success-msg">{successMsg}</p> : null}

            <button type="submit" className="auth-primary-btn" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="auth-footer">
            <p>¿Ya tienes cuenta?</p>
            <Link to="/login" className="auth-secondary-link">
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
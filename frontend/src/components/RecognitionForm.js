import React, { useState } from 'react';
import axios from 'axios';

function RecognitionForm({ onRecognitionSent, senderId }) {
  const [formData, setFormData] = useState({
    receiver_control_number: '',
    message: '',
    category: 'Colaboración'
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (feedback.text) {
      setFeedback({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      await axios.post('http://localhost:5000/api/recognitions/send', {
        sender_id: senderId,
        receiver_control_number: formData.receiver_control_number,
        message: formData.message,
        category: formData.category
      });

      setFeedback({
        type: 'success',
        text: '¡Reconocimiento enviado con éxito!'
      });

      onRecognitionSent();

      setFormData({
        receiver_control_number: '',
        message: '',
        category: 'Colaboración'
      });
    } catch (error) {
      console.error('Error al enviar:', error);
      setFeedback({
        type: 'error',
        text: error.response?.data?.error || 'Error al enviar. Verifica los datos.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recognition-form">
      <div className="form-intro-card">
        <p className="section-label">Reconocimiento positivo</p>
        <h3>Motiva a un compañero</h3>
        <p className="form-helper-text">
          Comparte un mensaje que haga visible el esfuerzo, talento o impacto positivo
          de alguien dentro de la comunidad TSJ.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="recognition-form-fields">
        <div className="input-group-custom">
          <label>Número de control del compañero</label>
          <input
            type="number"
            name="receiver_control_number"
            className="form-control"
            placeholder="Ej. 220113032"
            value={formData.receiver_control_number}
            onChange={handleChange}
            required
          />
          <small className="field-hint">
            Ingresa el número de control del estudiante o compañero a reconocer.
          </small>
        </div>

        <div className="input-group-custom">
          <label>Categoría del logro</label>
          <select
            name="category"
            className="form-control"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="Colaboración">🤝 Colaboración</option>
            <option value="Académico">📚 Académico</option>
            <option value="Liderazgo">⭐ Liderazgo</option>
            <option value="Creatividad">💡 Creatividad</option>
          </select>
        </div>

        <div className="input-group-custom">
          <label>Tu mensaje</label>
          <textarea
            name="message"
            className="form-control form-textarea"
            placeholder="Escribe algo inspirador, claro y positivo..."
            value={formData.message}
            onChange={handleChange}
            required
          />
          <small className="field-hint">
            Haz que el reconocimiento sea específico y genuino.
          </small>
        </div>

        {feedback.text && (
          <div className={`form-feedback ${feedback.type}`}>
            {feedback.text}
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Enviando reconocimiento...' : 'Enviar reconocimiento'}
        </button>
      </form>
    </div>
  );
}

export default RecognitionForm;
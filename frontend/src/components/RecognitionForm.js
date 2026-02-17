import React, { useState } from 'react';
import axios from 'axios';

function RecognitionForm({ onRecognitionSent, senderId }) {
  // Ajustamos el estado para usar 'receiver_control_number' en lugar de 'receiver_id'
  const [formData, setFormData] = useState({
    receiver_control_number: '',
    message: '',
    category: 'Colaboración'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviamos el objeto con los nombres exactos que espera el Backend
      await axios.post('http://localhost:5000/api/recognitions/send', {
        sender_id: senderId,
        receiver_control_number: formData.receiver_control_number,
        message: formData.message,
        category: formData.category
      });

      alert("¡Reconocimiento enviado con éxito!");
      onRecognitionSent(); // Refresca el muro automáticamente
      
      // Limpiamos el formulario
      setFormData({ 
        receiver_control_number: '', 
        message: '', 
        category: 'Colaboración' 
      });
    } catch (error) {
      console.error("Error al enviar:", error);
      // Mostramos el error específico del servidor (ej: si el compañero no existe)
      alert(error.response?.data?.error || "Error al enviar. Verifica los datos.");
    }
  };

  return (
    <div className="recognition-form">
      <h3> Motiva a un compañero</h3>
      <form onSubmit={handleSubmit}>
        
        <div className="input-group-custom">
          <label>Número de Control del Compañero:</label>
          <input 
            type="number" 
            name="receiver_control_number" 
            className="form-control" 
            placeholder="Ej: 220113032" 
            value={formData.receiver_control_number} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="input-group-custom">
          <label>Categoría del Logro:</label>
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
          <label>Tu Mensaje:</label>
          <textarea 
            name="message" 
            className="form-control" 
            placeholder="Escribe algo inspirador..." 
            value={formData.message} 
            onChange={handleChange} 
            required 
          />
        </div>

        <button type="submit" className="btn-submit">
          Enviar Reconocimiento 
        </button>

      </form>
    </div>
  );
}

export default RecognitionForm;
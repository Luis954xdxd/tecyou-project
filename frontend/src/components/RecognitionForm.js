import React, { useState } from 'react';
import axios from 'axios';

function RecognitionForm({ onRecognitionSent }) {
  // Estado para capturar los datos del formulario
  const [formData, setFormData] = useState({
    sender_id: '',
    receiver_id: '',
    message: '',
    category: 'Colaboración'
  });

  // Función para actualizar el estado conforme el usuario escribe
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Función para enviar los datos al Backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    try {
      await axios.post('http://localhost:5000/api/recognitions/send', formData);
      alert("¡Reconocimiento enviado con éxito!");
      onRecognitionSent(); // Llama a la función para refrescar el muro
      // Limpia el formulario
      setFormData({ sender_id: '', receiver_id: '', message: '', category: 'Colaboración' });
    } catch (error) {
      console.error("Error al enviar:", error);
      alert("Hubo un error al enviar el reconocimiento.");
    }
  };

  return (
    <form className="recognition-form" onSubmit={handleSubmit}>
      <h3>Enviar Nuevo Reconocimiento</h3>
      <input type="number" name="sender_id" placeholder="Tu ID de Usuario" value={formData.sender_id} onChange={handleChange} required />
      <input type="number" name="receiver_id" placeholder="ID del Compañero" value={formData.receiver_id} onChange={handleChange} required />
      <select name="category" value={formData.category} onChange={handleChange}>
        <option value="Colaboración">Colaboración</option>
        <option value="Académico">Académico</option>
        <option value="Apoyo">Apoyo Extracurricular</option>
        <option value="Actitud">Actitud Positiva</option>
      </select>
      <textarea name="message" placeholder="Escribe tu mensaje aquí..." value={formData.message} onChange={handleChange} required />
      <button type="submit">Enviar Reconocimiento</button>
    </form>
  );
}

export default RecognitionForm;
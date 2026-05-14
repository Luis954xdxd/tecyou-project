import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function TecAgentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hola 👋 Soy el asistente del TecMM Zapopan. Puedo ayudarte con dudas sobre el TecMM, trámites generales o la plataforma ¡Tec! ¡you!.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSendQuestion = async (e) => {
    e.preventDefault();

    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    const userMessage = {
      role: 'user',
      text: cleanQuestion,
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/tec-agent/ask`, {
        question: cleanQuestion,
      });

      const assistantMessage = {
        role: 'assistant',
        text: response.data.answer || 'No pude generar una respuesta.',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error preguntando al agente Tec:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'No pude responder en este momento. Intenta de nuevo más tarde.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="tec-agent-floating-btn"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div className="tec-agent-chatbot">
          <div className="tec-agent-header">
            <div>
              <strong>Asistente TecMM Zapopan</strong>
              <span>Información institucional</span>
            </div>

            <button
              type="button"
              className="tec-agent-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="tec-agent-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`tec-agent-message ${message.role}`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="tec-agent-message assistant">
                Pensando respuesta...
              </div>
            )}
          </div>

          <form className="tec-agent-form" onSubmit={handleSendQuestion}>
            <input
              type="text"
              placeholder="Pregunta algo del TecMM Zapopan..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />

            <button type="submit" disabled={loading || !question.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default TecAgentChatbot;
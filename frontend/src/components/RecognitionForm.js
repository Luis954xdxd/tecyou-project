import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function RecognitionForm({ onRecognitionSent, senderId, preselectedUser }) {
  const [formData, setFormData] = useState({
    receiver_control_number: '',
    message: '',
    category: 'Colaboración',
  });

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [formFeedback, setFormFeedback] = useState({
    type: '',
    message: '',
  });

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    if (preselectedUser) {
      setSelectedUser(preselectedUser);
      setSearchInput(preselectedUser.display_name || preselectedUser.fullname || '');
      setSearchResults([]);
      setFormData((prev) => ({
        ...prev,
        receiver_control_number: '',
      }));
    }
  }, [preselectedUser]);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchInput.trim().length < 2 || selectedUser) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchingUsers(true);
        const response = await axios.get(
          `${API_BASE}/api/users/search?q=${encodeURIComponent(
            searchInput
          )}&currentUserId=${senderId}`
        );

        const filtered = response.data.filter(
          (user) => Number(user.id) !== Number(senderId)
        );

        setSearchResults(filtered);
      } catch (error) {
        console.error('Error buscando usuarios:', error);
      } finally {
        setSearchingUsers(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchInput, senderId, selectedUser]);

  const handleChange = (e) => {
    setFormFeedback({ type: '', message: '' });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectUser = (user) => {
    setFormFeedback({ type: '', message: '' });
    setSelectedUser(user);
    setSearchInput(user.display_name || user.fullname);
    setSearchResults([]);
    setFormData((prev) => ({
      ...prev,
      receiver_control_number: '',
    }));
  };

  const handleClearSelectedUser = () => {
    setFormFeedback({ type: '', message: '' });
    setSelectedUser(null);
    setSearchInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormFeedback({ type: '', message: '' });

    if (!selectedUser && !formData.receiver_control_number.trim()) {
      setFormFeedback({
        type: 'error',
        message: 'Selecciona un compañero por nombre o ingresa un número de control.',
      });
      return;
    }

    try {
      setSending(true);

      await axios.post(`${API_BASE}/api/recognitions/send`, {
        sender_id: senderId,
        receiver_id: selectedUser ? selectedUser.id : null,
        receiver_control_number: selectedUser ? null : formData.receiver_control_number,
        message: formData.message,
        category: formData.category,
      });

      onRecognitionSent();

      setFormData({
        receiver_control_number: '',
        message: '',
        category: 'Colaboración',
      });
      setSearchInput('');
      setSearchResults([]);
      setSelectedUser(null);

      setFormFeedback({
        type: 'success',
        message: 'Se envió el reconocimiento correctamente.',
      });
    } catch (error) {
      console.error('Error al enviar:', error);
      setFormFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Error al enviar. Verifica los datos.',
      });
    } finally {
      setSending(false);
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
          <label>Buscar compañero por nombre</label>
          <input
            type="text"
            className="form-control"
            placeholder="Ej. Luis López"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (selectedUser) setSelectedUser(null);
              setFormFeedback({ type: '', message: '' });
            }}
          />
          <small className="field-hint">
            Escribe al menos 2 letras para buscar por nombre visible, nombre real o correo.
          </small>

          {searchingUsers && <div className="user-search-status">Buscando usuarios...</div>}

          {!selectedUser && searchResults.length > 0 && (
            <div className="user-search-results">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="user-search-item"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="user-search-avatar">
                    {user.profile_image_url ? (
                      <img
                        src={resolveImageUrl(user.profile_image_url)}
                        alt={user.display_name}
                        className="user-search-avatar-image"
                      />
                    ) : (
                      <div className="user-search-avatar-fallback">
                        {(user.display_name || user.fullname || 'TSJ')
                          .split(' ')
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="user-search-meta">
                    <strong>{user.display_name || user.fullname}</strong>
                    <span>{user.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="form-divider-text">o también puedes usar número de control</div>

        <div className="input-group-custom">
          <label>Número de control del compañero</label>
          <input
            type="number"
            name="receiver_control_number"
            className="form-control"
            placeholder="Ej. 220113032"
            value={formData.receiver_control_number}
            onChange={handleChange}
            disabled={!!selectedUser}
          />
          <small className="field-hint">
            Ingresa el número de control del estudiante o compañero a reconocer.
          </small>
        </div>

        {selectedUser && (
          <div className="selected-user-card">
            <div className="selected-user-card-left">
              {selectedUser.profile_image_url ? (
                <img
                  src={resolveImageUrl(selectedUser.profile_image_url)}
                  alt={selectedUser.display_name}
                  className="selected-user-avatar"
                />
              ) : (
                <div className="selected-user-avatar-fallback">
                  {(selectedUser.display_name || selectedUser.fullname || 'TSJ')
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}

              <div className="selected-user-info">
                <strong>{selectedUser.display_name || selectedUser.fullname}</strong>
                <span>{selectedUser.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="selected-user-clear"
              onClick={handleClearSelectedUser}
            >
              Quitar
            </button>
          </div>
        )}

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
            placeholder="Escribe algo inspirador..."
            value={formData.message}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="btn-submit" disabled={sending}>
          {sending ? 'Enviando...' : 'Enviar reconocimiento'}
        </button>

        {formFeedback.message && (
          <div className={`form-feedback ${formFeedback.type}`}>
            {formFeedback.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default RecognitionForm;
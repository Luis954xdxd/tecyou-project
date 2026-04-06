import React, { useState } from 'react';

function CreateStoryModal({ isOpen, onClose, onSubmit, users }) {
  const [formData, setFormData] = useState({
    caption: '',
    duration_seconds: 5,
    visibility_type: 'public',
  });

  const [mediaFile, setMediaFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [musicName, setMusicName] = useState('');
  const [musicStartSeconds, setMusicStartSeconds] = useState(0);
  const [visibilityType, setVisibilityType] = useState('public');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [excludedUsers, setExcludedUsers] = useState([]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'duration_seconds'
          ? Math.min(Math.max(Number(value || 1), 1), 300)
          : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setMediaFile(file);
  };

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
  };

  const handleUserToggle = (userId, mode = 'selected') => {
    if (mode === 'selected') {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
      return;
    }

    setExcludedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const resetForm = () => {
    setFormData({
      caption: '',
      duration_seconds: 5,
      visibility_type: 'public',
    });
    setMediaFile(null);
    setAudioFile(null);
    setMusicName('');
    setMusicStartSeconds(0);
    setVisibilityType('public');
    setSelectedUsers([]);
    setExcludedUsers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mediaFile) {
      alert('Debes seleccionar una imagen o video.');
      return;
    }

    const data = new FormData();
    data.append('storyMedia', mediaFile);
    data.append('caption', formData.caption);
    data.append('music_name', musicName);
    data.append('music_start_seconds', musicStartSeconds);
    data.append('duration_seconds', formData.duration_seconds);
    data.append('visibility_type', visibilityType);
    data.append('selected_users', JSON.stringify(selectedUsers));
    data.append('excluded_users', JSON.stringify(excludedUsers));

    if (audioFile) {
      data.append('storyAudio', audioFile);
    }

    try {
      await onSubmit(data);
      resetForm();
    } catch (error) {
      console.error('Error en submit del modal:', error);
    }
  };

  return (
    <div className="create-story-modal-overlay" onClick={handleClose}>
      <div
        className="create-story-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="create-story-close-btn"
          onClick={handleClose}
        >
          ✕
        </button>

        <h2>Crear historia</h2>

        <form onSubmit={handleSubmit} className="create-story-form">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            required
          />

          <textarea
            name="caption"
            placeholder="Escribe algo para tu historia..."
            value={formData.caption}
            onChange={handleChange}
            rows={3}
          />

          <input
            type="text"
            placeholder="Nombre de la canción"
            value={musicName}
            onChange={(e) => setMusicName(e.target.value)}
          />

          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
          />

          <div className="story-field-help">
            Sube un audio opcional para acompañar tu historia.
          </div>

          <input
            type="number"
            min="0"
            placeholder="Inicio del audio (segundos)"
            value={musicStartSeconds}
            onChange={(e) => setMusicStartSeconds(Number(e.target.value || 0))}
          />

          <div className="story-field-help">
            Aquí indicas desde qué segundo debe empezar a sonar el audio.
          </div>

          <input
            type="number"
            name="duration_seconds"
            min="1"
            max="300"
            value={formData.duration_seconds}
            onChange={handleChange}
            placeholder="Duración de la historia (segundos)"
          />

          <div className="story-field-help">
            Tiempo total que dura la historia antes de pasar a la siguiente. Máximo 300 segundos (5 minutos).
          </div>

          <select
            value={visibilityType}
            onChange={(e) => {
              const newValue = e.target.value;
              setVisibilityType(newValue);
              setFormData((prev) => ({
                ...prev,
                visibility_type: newValue,
              }));
            }}
          >
            <option value="public">Visible para todos</option>
            <option value="only_selected">Solo usuarios seleccionados</option>
            <option value="exclude_selected">Todos excepto algunos</option>
          </select>

          {visibilityType === 'only_selected' && (
            <div className="story-users-box">
              <strong>Selecciona quién sí puede verla</strong>
              <div className="story-users-list">
                {users?.length > 0 ? (
                  users.map((user) => (
                    <label key={user.id} className="story-user-option">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id, 'selected')}
                      />
                      <span>{user.display_name || user.fullname}</span>
                    </label>
                  ))
                ) : (
                  <p>No hay usuarios disponibles.</p>
                )}
              </div>
            </div>
          )}

          {visibilityType === 'exclude_selected' && (
            <div className="story-users-box">
              <strong>Selecciona quién NO puede verla</strong>
              <div className="story-users-list">
                {users?.length > 0 ? (
                  users.map((user) => (
                    <label key={user.id} className="story-user-option">
                      <input
                        type="checkbox"
                        checked={excludedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id, 'excluded')}
                      />
                      <span>{user.display_name || user.fullname}</span>
                    </label>
                  ))
                ) : (
                  <p>No hay usuarios disponibles.</p>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="create-story-submit-btn">
            Publicar historia
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateStoryModal;
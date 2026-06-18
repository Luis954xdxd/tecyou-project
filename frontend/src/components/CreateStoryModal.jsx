import React, { useEffect, useMemo, useState } from 'react';

const MUSIC_SUGGESTIONS = [
  { title: 'Desde Que Te Tengo', artist: 'Carin Leon' },
  { title: 'Las Mañanitas', artist: 'Ariel Camacho' },
  { title: 'Life Goes On', artist: 'Oliver Tree' },
  { title: 'Oye Mi Amor', artist: 'Mana' },
  { title: 'Polvo Rosita', artist: 'Lenin Ramirez' },
  { title: 'Niña De Mi Corazón', artist: 'La Arrolladora' },
];

function CreateStoryModal({ isOpen, onClose, onSubmit, users }) {
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [musicName, setMusicName] = useState('');
  const [musicSearch, setMusicSearch] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [visibilityType, setVisibilityType] = useState('public');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [excludedUsers, setExcludedUsers] = useState([]);

  const mediaPreview = useMemo(
    () => (mediaFile ? URL.createObjectURL(mediaFile) : null),
    [mediaFile]
  );

  const audioPreview = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : null),
    [audioFile]
  );

  const filteredSongs = MUSIC_SUGGESTIONS.filter((song) =>
    `${song.title} ${song.artist}`.toLowerCase().includes(musicSearch.toLowerCase())
  );

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCaption('');
    setMediaFile(null);
    setAudioFile(null);
    setMusicName('');
    setMusicSearch('');
    setDurationSeconds(30);
    setVisibilityType('public');
    setSelectedUsers([]);
    setExcludedUsers([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0] || null;
    setMediaFile(file);
    if (!file) return;
    if (file.type.startsWith('image/')) setDurationSeconds(30);
    if (file.type.startsWith('video/')) setDurationSeconds(60);
  };

  const toggleUser = (userId, mode) => {
    const setter = mode === 'allow' ? setSelectedUsers : setExcludedUsers;
    setter((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!mediaFile) {
      alert('Debes seleccionar una imagen o video.');
      return;
    }

    const isVideo = mediaFile.type.startsWith('video/');
    const finalDuration = isVideo
      ? Math.min(Number(durationSeconds || 60), 60)
      : Math.min(Number(durationSeconds || 30), 30);

    const data = new FormData();
    data.append('storyMedia', mediaFile);
    data.append('caption', caption);
    data.append('music_name', musicName);
    data.append('music_start_seconds', 0);
    data.append('duration_seconds', finalDuration);
    data.append('visibility_type', visibilityType);
    data.append('selected_users', JSON.stringify(selectedUsers));
    data.append('excluded_users', JSON.stringify(excludedUsers));

    if (audioFile) data.append('storyAudio', audioFile);

    try {
      await onSubmit(data);
      resetForm();
    } catch (error) {
      console.error('Error en submit del modal:', error);
    }
  };

  return (
    <div className="create-story-modal-overlay story-studio-overlay" onClick={handleClose}>
      <form className="story-studio" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <aside className="story-studio-sidebar">
          <div className="story-studio-top">
            <button type="button" className="story-studio-close" onClick={handleClose}>
              {'\u00d7'}
            </button>
            <div>
              <h2>Tu historia</h2>
              <p>Editor estilo Tec You</p>
            </div>
          </div>

          <label className="story-studio-action">
            <span>{'\uD83D\uDDBC'}</span>
            <strong>Foto o video</strong>
            <small>Imagen 30s, video maximo 60s</small>
            <input type="file" accept="image/*,video/*" onChange={handleMediaChange} />
          </label>

          <label className="story-studio-field">
            <span>Texto</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Agrega texto a tu historia..."
            />
          </label>

          <div className="story-studio-field">
            <span>Musica</span>
            <input
              value={musicSearch}
              onChange={(event) => setMusicSearch(event.target.value)}
              placeholder="Buscar musica"
            />
            <div className="story-music-results">
              {filteredSongs.map((song) => (
                <button
                  type="button"
                  key={`${song.title}-${song.artist}`}
                  onClick={() => {
                    setMusicName(`${song.title} - ${song.artist}`);
                    setMusicSearch(song.title);
                  }}
                >
                  <strong>{song.title}</strong>
                  <small>{song.artist}</small>
                </button>
              ))}
            </div>
            <label className="story-local-audio">
              Subir audio local
              <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="story-studio-field">
            <span>Privacidad</span>
            <div className="story-privacy-options">
              {[
                ['public', 'Publico', 'Cualquier usuario de la comunidad'],
                ['only_selected', 'Personalizado', 'Solo personas elegidas'],
                ['exclude_selected', 'Ocultar historia a', 'Todos excepto algunos'],
              ].map(([value, title, description]) => (
                <button
                  type="button"
                  key={value}
                  className={visibilityType === value ? 'active' : ''}
                  onClick={() => setVisibilityType(value)}
                >
                  <strong>{title}</strong>
                  <small>{description}</small>
                </button>
              ))}
            </div>
          </div>

          {visibilityType !== 'public' && (
            <div className="story-users-box studio-users">
              <strong>
                {visibilityType === 'only_selected'
                  ? 'Quien puede verla'
                  : 'Ocultar historia a'}
              </strong>
              <div className="story-users-list">
                {users?.map((user) => {
                  const list = visibilityType === 'only_selected' ? selectedUsers : excludedUsers;
                  return (
                    <label key={user.id} className="story-user-option">
                      <input
                        type="checkbox"
                        checked={list.includes(user.id)}
                        onChange={() =>
                          toggleUser(user.id, visibilityType === 'only_selected' ? 'allow' : 'exclude')
                        }
                      />
                      <span>{user.display_name || user.fullname}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className="create-story-submit-btn story-studio-submit">
            Compartir en historia
          </button>
        </aside>

        <section className="story-studio-preview">
          <h3>Vista previa</h3>
          <div className="story-phone-preview">
            {mediaPreview ? (
              mediaFile?.type.startsWith('video/') ? (
                <video src={mediaPreview} controls />
              ) : (
                <img src={mediaPreview} alt="Vista previa de historia" />
              )
            ) : (
              <div className="story-preview-empty">
                <span>{'\u2728'}</span>
                <p>Selecciona una foto o video</p>
              </div>
            )}
            {caption && <p className="story-preview-caption">{caption}</p>}
            {musicName && <span className="story-preview-music">{'\u266B'} {musicName}</span>}
          </div>
          {audioPreview && <audio controls src={audioPreview} />}
        </section>
      </form>
    </div>
  );
}

export default CreateStoryModal;

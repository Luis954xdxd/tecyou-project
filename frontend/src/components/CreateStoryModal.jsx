import React, { useEffect, useMemo, useRef, useState } from 'react';

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

function CreateStoryModal({ isOpen, onClose, onSubmit, users }) {
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [musicName, setMusicName] = useState('');
  const [musicSearch, setMusicSearch] = useState('');
  const [musicResults, setMusicResults] = useState([]);
  const [musicLoading, setMusicLoading] = useState(false);
  const [selectedMusicPreview, setSelectedMusicPreview] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [visibilityType, setVisibilityType] = useState('public');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [excludedUsers, setExcludedUsers] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [mediaFit, setMediaFit] = useState('cover');
  const [mediaPositionX, setMediaPositionX] = useState(50);
  const [mediaPositionY, setMediaPositionY] = useState(50);
  const [formError, setFormError] = useState('');
  const mediaInputRef = useRef(null);

  const mediaPreview = useMemo(
    () => (mediaFile ? URL.createObjectURL(mediaFile) : null),
    [mediaFile]
  );

  const audioPreview = useMemo(
    () => (audioFile ? URL.createObjectURL(audioFile) : null),
    [audioFile]
  );

  const activeNameQuery = useMemo(() => {
    const match = caption.match(/[@A-Za-z0-9._\-ÁÉÍÓÚÜÑáéíóúüñ]{2,30}$/);
    if (!match) return '';
    return match[0].replace(/^@/, '').toLowerCase();
  }, [caption]);

  const tagSuggestions = useMemo(() => {
    if (!activeNameQuery) return [];
    return (users || [])
      .filter((user) => !taggedUsers.some((tagged) => Number(tagged.id) === Number(user.id)))
      .filter((user) => {
        const name = `${user.display_name || ''} ${user.fullname || ''}`.toLowerCase();
        const email = String(user.email || '').toLowerCase();
        return name.split(/\s+/).some((part) => part.startsWith(activeNameQuery)) || email.startsWith(activeNameQuery);
      })
      .sort((a, b) => {
        const aName = String(a.display_name || a.fullname || '').toLowerCase();
        const bName = String(b.display_name || b.fullname || '').toLowerCase();
        return Number(bName.startsWith(activeNameQuery)) - Number(aName.startsWith(activeNameQuery));
      })
      .slice(0, 6);
  }, [activeNameQuery, taggedUsers, users]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const query = musicSearch.trim();
    if (query.length < 2) {
      setMusicResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setMusicLoading(true);
        const response = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=8`
        );
        const data = await response.json();
        setMusicResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        console.error('Error buscando musica:', error);
        setMusicResults([]);
      } finally {
        setMusicLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [musicSearch]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCaption('');
    setMediaFile(null);
    setAudioFile(null);
    setMusicName('');
    setMusicSearch('');
    setMusicResults([]);
    setSelectedMusicPreview('');
    setDurationSeconds(30);
    setVisibilityType('public');
    setSelectedUsers([]);
    setExcludedUsers([]);
    setTaggedUsers([]);
    setMediaFit('cover');
    setMediaPositionX(50);
    setMediaPositionY(50);
    setFormError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleMediaChange = (event) => {
    const file = event.target.files?.[0] || null;
    setMediaFile(file);
    if (!file) return;
    setFormError('');
    setMediaFit('cover');
    setMediaPositionX(50);
    setMediaPositionY(50);
    if (file.type.startsWith('image/')) setDurationSeconds(30);
    if (file.type.startsWith('video/')) setDurationSeconds(60);
  };

  const applyVisibility = (value) => {
    setVisibilityType(value);
    if (value === 'following') {
      setSelectedUsers((users || []).filter((item) => item.is_following).map((item) => item.id));
      setExcludedUsers([]);
      return;
    }
    if (value === 'public') {
      setSelectedUsers([]);
      setExcludedUsers([]);
    }
  };

  const toggleUser = (userId, mode) => {
    const setter = mode === 'allow' ? setSelectedUsers : setExcludedUsers;
    setter((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const addTaggedUser = (user) => {
    setTaggedUsers((prev) => [...prev, user]);
    const displayName = user.display_name || user.fullname;
    setCaption((prev) => prev.replace(
      /[@A-Za-z0-9._\-ÁÉÍÓÚÜÑáéíóúüñ]{2,30}$/,
      `@${displayName} `
    ));
    setExcludedUsers((prev) => prev.filter((id) => Number(id) !== Number(user.id)));
    if (visibilityType === 'only_selected' || visibilityType === 'following') {
      setSelectedUsers((prev) => prev.includes(user.id) ? prev : [...prev, user.id]);
    }
  };

  const handleCaptionChange = (value) => {
    setCaption(value);
    setTaggedUsers((prev) => prev.filter((user) => value.includes(`@${user.display_name || user.fullname}`)));
  };

  const removeTaggedUser = (user) => {
    const mention = `@${user.display_name || user.fullname}`;
    setTaggedUsers((prev) => prev.filter((item) => Number(item.id) !== Number(user.id)));
    setCaption((prev) => prev.replace(mention, '').replace(/\s{2,}/g, ' ').trimStart());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!mediaFile) {
      setFormError('Debes seleccionar una imagen o video para compartir tu historia.');
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
    data.append('music_external_url', selectedMusicPreview);
    data.append('music_start_seconds', 0);
    data.append('duration_seconds', finalDuration);
    data.append('visibility_type', visibilityType === 'following' ? 'only_selected' : visibilityType);
    data.append('selected_users', JSON.stringify(selectedUsers));
    data.append('excluded_users', JSON.stringify(excludedUsers));
    data.append('tagged_user_ids', JSON.stringify(taggedUsers.map((user) => user.id)));
    data.append('media_fit', mediaFit);
    data.append('media_position_x', mediaPositionX);
    data.append('media_position_y', mediaPositionY);

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

          <label className="story-studio-action" htmlFor="story-media-input">
            <ImageIcon />
            <strong>Foto o video</strong>
            <small>Imagen 30s, video maximo 60s</small>
          </label>
          <input
            id="story-media-input"
            ref={mediaInputRef}
            className="story-hidden-file"
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
          />

          <div className="story-studio-field story-caption-field">
            <span>Texto</span>
            <textarea
              value={caption}
              onChange={(event) => handleCaptionChange(event.target.value)}
              placeholder="Agrega texto y escribe un nombre para etiquetar..."
            />
            {tagSuggestions.length > 0 && (
              <div className="story-tag-suggestions">
                {tagSuggestions.map((user) => (
                  <button type="button" key={user.id} onClick={() => addTaggedUser(user)}>
                    <strong>{user.display_name || user.fullname}</strong>
                    <small>{user.email}</small>
                  </button>
                ))}
              </div>
            )}
            {taggedUsers.length > 0 && (
              <div className="story-tagged-users">
                {taggedUsers.map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => removeTaggedUser(user)}
                    title="Quitar etiqueta"
                  >
                    @{user.display_name || user.fullname} {'\u00d7'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="story-studio-field">
            <span>Musica</span>
            <input
              value={musicSearch}
              onChange={(event) => setMusicSearch(event.target.value)}
              placeholder="Buscar musica en iTunes"
            />
            <div className="story-music-results">
              {musicLoading && <small>Buscando canciones...</small>}
              {musicResults.length > 0 ? musicResults.map((song) => (
                <button
                  type="button"
                  key={song.trackId}
                  onClick={() => {
                    setMusicName(`${song.trackName} - ${song.artistName}`);
                    setMusicSearch(song.trackName);
                    setSelectedMusicPreview(song.previewUrl || '');
                  }}
                >
                  {song.artworkUrl60 && <img src={song.artworkUrl60} alt={song.trackName} />}
                  <strong>{song.trackName}</strong>
                  <small>{song.artistName}</small>
                </button>
              )) : (
                <small>
                  {musicSearch.trim().length >= 2
                    ? 'Sin resultados por ahora.'
                    : 'Escribe al menos 2 letras para buscar canciones.'}
                </small>
              )}
            </div>
            {selectedMusicPreview && (
              <audio controls src={selectedMusicPreview} className="story-music-preview-audio" />
            )}
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
                ['following', 'Personas que sigo', 'Solo usuarios que sigues'],
                ['only_selected', 'Personalizado', 'Elige personas especificas'],
                ['exclude_selected', 'Ocultar historia a', 'Todos excepto algunos'],
              ].map(([value, title, description]) => (
                <button
                  type="button"
                  key={value}
                  className={visibilityType === value ? 'active' : ''}
                  onClick={() => applyVisibility(value)}
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
                {visibilityType === 'exclude_selected' ? 'Ocultar historia a' : visibilityType === 'following' ? 'Personas que sigo' : 'Quien puede verla'}
              </strong>
              <div className="story-users-list">
                {users?.map((user) => {
                  const list = visibilityType === 'exclude_selected' ? excludedUsers : selectedUsers;
                  return (
                    <label key={user.id} className="story-user-option">
                      <input
                        type="checkbox"
                        checked={list.includes(user.id)}
                        onChange={() =>
                          toggleUser(user.id, visibilityType === 'exclude_selected' ? 'exclude' : 'allow')
                        }
                      />
                      <span>{user.display_name || user.fullname}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {mediaFile && (
            <div className="story-studio-field story-crop-controls">
              <span>Encuadre de historia</span>
              <div className="story-fit-toggle">
                <button type="button" className={mediaFit === 'cover' ? 'active' : ''} onClick={() => setMediaFit('cover')}>
                  Llenar
                </button>
                <button type="button" className={mediaFit === 'contain' ? 'active' : ''} onClick={() => setMediaFit('contain')}>
                  Completa
                </button>
              </div>
              <label>
                <small>Enfoque horizontal</small>
                <input type="range" min="0" max="100" value={mediaPositionX} onChange={(event) => setMediaPositionX(Number(event.target.value))} />
              </label>
              <label>
                <small>Enfoque vertical</small>
                <input type="range" min="0" max="100" value={mediaPositionY} onChange={(event) => setMediaPositionY(Number(event.target.value))} />
              </label>
            </div>
          )}

          <button type="submit" className="create-story-submit-btn story-studio-submit">
            Compartir en historia
          </button>
          {formError && <p className="story-studio-error">{formError}</p>}
        </aside>

        <section className="story-studio-preview">
          <h3>Vista previa</h3>
          <div className="story-phone-preview">
            {mediaPreview ? (
              mediaFile?.type.startsWith('video/') ? (
                <video
                  src={mediaPreview}
                  controls
                  style={{
                    '--story-media-fit': mediaFit,
                    '--story-media-position': `${mediaPositionX}% ${mediaPositionY}%`,
                  }}
                />
              ) : (
                <img
                  src={mediaPreview}
                  alt="Vista previa de historia"
                  style={{
                    '--story-media-fit': mediaFit,
                    '--story-media-position': `${mediaPositionX}% ${mediaPositionY}%`,
                  }}
                />
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

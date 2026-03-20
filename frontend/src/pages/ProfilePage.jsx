import React, { useMemo, useState } from 'react';

const API_BASE = 'http://localhost:5000';

function ProfilePage({
  user,
  profileImage,
  coverImage,
  displayName,
  profileBio,
  profileTags,
  recognitions,
  onBack,
  onOpenImageViewer,
  darkMode,
  onOpenEditProfile,
  followingCount,
  followersCount,
}) {
  const [activeTab, setActiveTab] = useState('media');
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const safeRecognitions = Array.isArray(recognitions) ? recognitions : [];

  const recognitionsSent = useMemo(
    () => safeRecognitions.filter((rec) => Number(rec.sender_id) === Number(user.id)),
    [safeRecognitions, user.id]
  );

  const recognitionsReceived = useMemo(
    () => safeRecognitions.filter((rec) => Number(rec.receiver_id) === Number(user.id)),
    [safeRecognitions, user.id]
  );

  const galleryImages = useMemo(() => {
    const allImages = [];

    safeRecognitions.forEach((rec) => {
      if (Array.isArray(rec.images)) {
        rec.images.forEach((img) => {
          if (img?.image_url) {
            allImages.push({
              ...img,
              fullUrl: resolveImageUrl(img.image_url),
            });
          }
        });
      }
    });

    return allImages;
  }, [safeRecognitions]);

  const visibleGalleryImages = showAllGallery
    ? galleryImages
    : galleryImages.slice(0, 5);

  const filteredSent = useMemo(() => {
    const query = profileSearch.trim().toLowerCase();
    if (!query) return recognitionsSent;

    return recognitionsSent.filter(
      (rec) =>
        rec.receiver_name?.toLowerCase().includes(query) ||
        rec.message?.toLowerCase().includes(query) ||
        rec.category?.toLowerCase().includes(query)
    );
  }, [recognitionsSent, profileSearch]);

  const filteredReceived = useMemo(() => {
    const query = profileSearch.trim().toLowerCase();
    if (!query) return recognitionsReceived;

    return recognitionsReceived.filter(
      (rec) =>
        rec.sender_name?.toLowerCase().includes(query) ||
        rec.message?.toLowerCase().includes(query) ||
        rec.category?.toLowerCase().includes(query)
    );
  }, [recognitionsReceived, profileSearch]);

  const initials = (displayName || user.fullname || 'TSJ')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`profile-page-shell ${darkMode ? 'dark-profile-page' : ''}`}>
      <div className="profile-twitter-layout">
        <main className="profile-twitter-main">
          <div className="profile-twitter-topbar">
            <button type="button" className="profile-twitter-back" onClick={onBack}>
              ←
            </button>

            <div className="profile-twitter-topmeta">
              <strong>{displayName || user.fullname}</strong>
              <span>{recognitionsSent.length + recognitionsReceived.length} publicaciones</span>
            </div>

            <button
              type="button"
              className="profile-twitter-search"
              onClick={() => {
                const input = document.getElementById('profileSearchInput');
                if (input) input.focus();
              }}
            >
              ⌕
            </button>
          </div>

          <div className="profile-twitter-cover">
            {coverImage ? (
              <img src={coverImage} alt="Portada" className="profile-twitter-cover-image" />
            ) : null}
          </div>

          <div className="profile-twitter-header">
            <div className="profile-twitter-avatar-wrap">
              {profileImage ? (
                <img src={profileImage} alt="Perfil" className="profile-twitter-avatar" />
              ) : (
                <div className="profile-twitter-avatar-fallback">{initials}</div>
              )}
            </div>

            <div className="profile-twitter-header-actions">
              <button
                type="button"
                className="profile-twitter-edit-btn"
                onClick={onOpenEditProfile}
              >
                Editar perfil
              </button>
            </div>
          </div>

          <div className="profile-twitter-info">
            <div className="profile-twitter-name-row">
              <h1>{displayName || user.fullname}</h1>
              <span className="profile-twitter-verified-pill">✔ Get verified</span>
            </div>

            <p className="profile-twitter-handle">@{user.email?.split('@')[0] || 'usuario'}</p>
            <p className="profile-twitter-bio">{profileBio}</p>

            <div className="profile-twitter-tags">
              {profileTags.map((tag) => (
                <span key={tag} className="profile-twitter-tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="profile-twitter-follow-stats">
              <span><strong>{followingCount}</strong> Siguiendo</span>
              <span><strong>{followersCount}</strong> Seguidores</span>
              <span><strong>{recognitionsSent.length}</strong> Enviados</span>
              <span><strong>{recognitionsReceived.length}</strong> Recibidos</span>
            </div>
          </div>

          <div className="profile-twitter-tabs">
            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              Media
            </button>
            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'received' ? 'active' : ''}`}
              onClick={() => setActiveTab('received')}
            >
              Recibidos
            </button>
            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'sent' ? 'active' : ''}`}
              onClick={() => setActiveTab('sent')}
            >
              Enviados
            </button>
            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              Perfil
            </button>
          </div>

          <div className="profile-twitter-content">
            {(activeTab === 'received' || activeTab === 'sent') && (
              <div className="profile-twitter-inline-search">
                <input
                  id="profileSearchInput"
                  type="text"
                  className="profile-twitter-inline-search-input"
                  placeholder="Buscar por nombre, categoría o mensaje..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                />
              </div>
            )}

            {activeTab === 'media' && (
              <section className="profile-twitter-section">
                <div className="profile-twitter-section-head">
                  <h2>Galería reciente</h2>
                  {galleryImages.length > 5 && (
                    <button
                      type="button"
                      className="profile-twitter-more-btn"
                      onClick={() => setShowAllGallery((prev) => !prev)}
                    >
                      {showAllGallery ? 'Ver menos' : `Ver más (${galleryImages.length})`}
                    </button>
                  )}
                </div>

                {galleryImages.length === 0 ? (
                  <p className="profile-twitter-empty">Aún no hay imágenes publicadas.</p>
                ) : (
                  <div className="profile-twitter-gallery">
                    {visibleGalleryImages.map((img, index) => {
                      const realIndex = showAllGallery
                        ? index
                        : galleryImages.findIndex((g) => g.fullUrl === img.fullUrl);

                      return (
                        <button
                          key={img.id || index}
                          type="button"
                          className="profile-twitter-gallery-button"
                          onClick={() => onOpenImageViewer(galleryImages, realIndex)}
                        >
                          <img
                            src={img.fullUrl}
                            alt={`Galería ${index + 1}`}
                            className="profile-twitter-gallery-image"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'received' && (
              <section className="profile-twitter-section">
                <h2>Reconocimientos recibidos</h2>
                <div className="profile-twitter-rec-list">
                  {filteredReceived.length === 0 ? (
                    <p className="profile-twitter-empty">Sin resultados en recibidos.</p>
                  ) : (
                    filteredReceived.map((rec) => (
                      <div key={rec.id} className="profile-twitter-rec-card">
                        <strong>{rec.sender_name}</strong>
                        <span>
                          {rec.category} ·{' '}
                          {new Date(rec.created_at).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <p>“{rec.message}”</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeTab === 'sent' && (
              <section className="profile-twitter-section">
                <h2>Reconocimientos enviados</h2>
                <div className="profile-twitter-rec-list">
                  {filteredSent.length === 0 ? (
                    <p className="profile-twitter-empty">Sin resultados en enviados.</p>
                  ) : (
                    filteredSent.map((rec) => (
                      <div key={rec.id} className="profile-twitter-rec-card">
                        <strong>{rec.receiver_name}</strong>
                        <span>
                          {rec.category} ·{' '}
                          {new Date(rec.created_at).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <p>“{rec.message}”</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeTab === 'about' && (
              <section className="profile-twitter-section">
                <div className="profile-twitter-about-grid">
                  <div className="profile-twitter-about-card">
                    <strong>{recognitionsSent.length}</strong>
                    <span>Reconocimientos enviados</span>
                  </div>
                  <div className="profile-twitter-about-card">
                    <strong>{recognitionsReceived.length}</strong>
                    <span>Reconocimientos recibidos</span>
                  </div>
                  <div className="profile-twitter-about-card">
                    <strong>{galleryImages.length}</strong>
                    <span>Imágenes compartidas</span>
                  </div>
                  <div className="profile-twitter-about-card">
                    <strong>{followersCount}</strong>
                    <span>Seguidores</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>

        <aside className="profile-twitter-sidebar">
          <div className="profile-twitter-sidebox">
            <input
              type="text"
              className="profile-twitter-search-input"
              placeholder="Buscar"
              value={profileSearch}
              onChange={(e) => setProfileSearch(e.target.value)}
            />
          </div>

          <div className="profile-twitter-sidebox">
            <h3>Resumen</h3>
            <div className="profile-twitter-side-stat">
              <span>Nombre visible</span>
              <strong>{displayName || user.fullname}</strong>
            </div>
            <div className="profile-twitter-side-stat">
              <span>Correo</span>
              <strong>{user.email}</strong>
            </div>
            <div className="profile-twitter-side-stat">
              <span>Modo</span>
              <strong>{darkMode ? 'Oscuro' : 'Claro'}</strong>
            </div>
          </div>

          <div className="profile-twitter-sidebox">
            <h3>Actividad</h3>
            <p className="profile-twitter-side-text">
              Aquí luego puedes mostrar actividad reciente, seguidores nuevos, comentarios o reacciones.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ProfilePage;
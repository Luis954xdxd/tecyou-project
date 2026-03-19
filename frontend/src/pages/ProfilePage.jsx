import React, { useMemo, useState } from 'react';

const API_BASE = 'http://localhost:5000';

function ProfilePage({
  user,
  profileImage,
  displayName,
  profileBio,
  profileTags,
  recognitions,
  onBack,
  onOpenImageViewer,
  darkMode,
}) {
  const [showAllGallery, setShowAllGallery] = useState(false);

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

  const initials = (displayName || user.fullname || 'TSJ')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`profile-page-shell ${darkMode ? 'dark-profile-page' : ''}`}>
      <div className="profile-page-cover">
        <button type="button" className="profile-page-close" onClick={onBack}>
          ✕
        </button>
      </div>

      <div className="profile-page-container">
        <div className="profile-page-top">
          <div className="profile-page-avatar-wrap">
            {profileImage ? (
              <img src={profileImage} alt="Perfil" className="profile-page-avatar" />
            ) : (
              <div className="profile-page-avatar-fallback">{initials}</div>
            )}
          </div>

          <div className="profile-page-main">
            <h1>{displayName || user.fullname}</h1>
            <p className="profile-page-email">{user.email}</p>
            <p className="profile-page-bio">{profileBio}</p>

            <div className="profile-page-tags">
              {profileTags.map((tag) => (
                <span key={tag} className="profile-page-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-page-stats">
          <div className="profile-page-stat">
            <strong>{recognitionsSent.length}</strong>
            <span>Enviados</span>
          </div>

          <div className="profile-page-stat">
            <strong>{recognitionsReceived.length}</strong>
            <span>Recibidos</span>
          </div>

          <div className="profile-page-stat">
            <strong>{galleryImages.length}</strong>
            <span>Imágenes</span>
          </div>
        </div>

        <section className="profile-page-panel">
          <div className="profile-page-section-head">
            <h2>Galería reciente</h2>

            {galleryImages.length > 5 && (
              <button
                type="button"
                className="profile-page-more-btn"
                onClick={() => setShowAllGallery((prev) => !prev)}
              >
                {showAllGallery ? 'Ver menos' : `Ver más (${galleryImages.length})`}
              </button>
            )}
          </div>

          <div className="profile-page-gallery">
            {galleryImages.length === 0 ? (
              <p className="profile-page-empty">Aún no hay imágenes publicadas.</p>
            ) : (
              visibleGalleryImages.map((img, index) => {
                const realIndex = showAllGallery
                  ? index
                  : galleryImages.findIndex((g) => g.fullUrl === img.fullUrl);

                return (
                  <button
                    key={img.id || index}
                    type="button"
                    className="profile-page-gallery-button"
                    onClick={() => onOpenImageViewer(galleryImages, realIndex)}
                  >
                    <img
                      src={img.fullUrl}
                      alt={`Galería ${index + 1}`}
                      className="profile-page-gallery-item"
                    />
                  </button>
                );
              })
            )}
          </div>
        </section>

        <div className="profile-page-two-columns">
          <section className="profile-page-panel">
            <h2>Reconocimientos recibidos</h2>

            <div className="profile-page-list">
              {recognitionsReceived.length === 0 ? (
                <p className="profile-page-empty">Sin reconocimientos recibidos.</p>
              ) : (
                recognitionsReceived.slice(0, 6).map((rec) => (
                  <div key={rec.id} className="profile-page-rec-card">
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

          <section className="profile-page-panel">
            <h2>Reconocimientos enviados</h2>

            <div className="profile-page-list">
              {recognitionsSent.length === 0 ? (
                <p className="profile-page-empty">Sin reconocimientos enviados.</p>
              ) : (
                recognitionsSent.slice(0, 6).map((rec) => (
                  <div key={rec.id} className="profile-page-rec-card">
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
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
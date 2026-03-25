import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import RecognitionVideoPlayer from '../components/RecognitionVideoPlayer';

const API_BASE = 'http://localhost:5000';

function ProfilePage({
  currentUser,
  loggedInUserId,
  recognitions,
  onBack,
  onOpenImageViewer,
  darkMode,
  onOpenEditProfile,
  isOwnProfile,
}) {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [activeTab, setActiveTab] = useState('media');
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);

  const [viewedProfile, setViewedProfile] = useState(
    isOwnProfile
      ? {
          ...currentUser,
          display_name: currentUser?.display_name || currentUser?.fullname || '',
          bio:
            currentUser?.bio ||
            'Usuario participante en la comunidad ¡Tec! ¡you!, enfocado en reconocer logros, fortalecer vínculos y visibilizar el impacto positivo dentro del TSJ.',
          tags:
            Array.isArray(currentUser?.tags) && currentUser.tags.length > 0
              ? currentUser.tags
              : ['Comunidad TSJ', 'Reconocimiento positivo'],
          birth_date: currentUser?.birth_date || '',
          location: currentUser?.location || '',
          followers_count: Number(currentUser?.followers_count || 0),
          following_count: Number(currentUser?.following_count || 0),
        }
      : null
  );

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    if (isOwnProfile) {
      setViewedProfile({
        ...currentUser,
        display_name: currentUser?.display_name || currentUser?.fullname || '',
        bio:
          currentUser?.bio ||
          'Usuario participante en la comunidad ¡Tec! ¡you!, enfocado en reconocer logros, fortalecer vínculos y visibilizar el impacto positivo dentro del TSJ.',
        tags:
          Array.isArray(currentUser?.tags) && currentUser.tags.length > 0
            ? currentUser.tags
            : ['Comunidad TSJ', 'Reconocimiento positivo'],
        birth_date: currentUser?.birth_date || '',
        location: currentUser?.location || '',
        followers_count: Number(currentUser?.followers_count || 0),
        following_count: Number(currentUser?.following_count || 0),
      });
      return;
    }

    const fetchViewedProfile = async () => {
      if (!userId) return;

      if (Number(userId) === Number(loggedInUserId)) {
        navigate('/perfil', { replace: true });
        return;
      }

      try {
        setLoadingViewedProfile(true);
        const response = await axios.get(`${API_BASE}/api/users/profile/${userId}`);
        const profile = response.data;

        setViewedProfile({
          ...profile,
          display_name: profile.display_name || profile.fullname || '',
          bio:
            profile.bio ||
            'Usuario participante en la comunidad ¡Tec! ¡you!, enfocado en reconocer logros, fortalecer vínculos y visibilizar el impacto positivo dentro del TSJ.',
          tags:
            Array.isArray(profile.tags) && profile.tags.length > 0
              ? profile.tags
              : ['Comunidad TSJ', 'Reconocimiento positivo'],
          birth_date: profile.birth_date || '',
          location: profile.location || '',
          followers_count: Number(profile.followers_count || 0),
          following_count: Number(profile.following_count || 0),
          profile_image_url: resolveImageUrl(profile.profile_image_url),
          cover_image_url: resolveImageUrl(profile.cover_image_url),
        });
      } catch (err) {
        console.error('Error al cargar perfil público:', err);
      } finally {
        setLoadingViewedProfile(false);
      }
    };

    fetchViewedProfile();
  }, [isOwnProfile, currentUser, userId, loggedInUserId, navigate]);

  const safeRecognitions = Array.isArray(recognitions) ? recognitions : [];
  const profileUserId = viewedProfile?.id;

  const recognitionsSent = useMemo(
    () =>
      safeRecognitions.filter(
        (rec) => Number(rec.sender_id) === Number(profileUserId)
      ),
    [safeRecognitions, profileUserId]
  );

  const recognitionsReceived = useMemo(
    () =>
      safeRecognitions.filter(
        (rec) => Number(rec.receiver_id) === Number(profileUserId)
      ),
    [safeRecognitions, profileUserId]
  );

  const galleryMedia = useMemo(() => {
    const allMedia = [];

    safeRecognitions.forEach((rec) => {
      const isRelatedToProfile =
        Number(rec.sender_id) === Number(profileUserId) ||
        Number(rec.receiver_id) === Number(profileUserId);

      if (!isRelatedToProfile) return;

      if (Array.isArray(rec.media)) {
        rec.media.forEach((item) => {
          if (item?.media_url) {
            allMedia.push({
              ...item,
              fullUrl: resolveImageUrl(item.media_url),
            });
          }
        });
      }
    });

    return allMedia;
  }, [safeRecognitions, profileUserId]);

  const visibleGalleryMedia = showAllGallery
    ? galleryMedia
    : galleryMedia.slice(0, 6);

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

  const displayName = viewedProfile?.display_name || viewedProfile?.fullname || 'Usuario';
  const profileBio =
    viewedProfile?.bio ||
    'Usuario participante en la comunidad ¡Tec! ¡you!, enfocado en reconocer logros, fortalecer vínculos y visibilizar el impacto positivo dentro del TSJ.';
  const profileTags =
    Array.isArray(viewedProfile?.tags) && viewedProfile.tags.length > 0
      ? viewedProfile.tags
      : ['Comunidad TSJ', 'Reconocimiento positivo'];

  const profileImage = resolveImageUrl(viewedProfile?.profile_image_url);
  const coverImage = resolveImageUrl(viewedProfile?.cover_image_url);
  const birthDate = viewedProfile?.birth_date || '';
  const locationText = viewedProfile?.location || '';
  const followingCount = Number(viewedProfile?.following_count || 0);
  const followersCount = Number(viewedProfile?.followers_count || 0);

  const initials = (displayName || 'TSJ')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (!viewedProfile && !isOwnProfile) {
    return (
      <div className={`profile-page-shell ${darkMode ? 'dark-profile-page' : ''}`}>
        <div className="profile-twitter-layout">
          <main className="profile-twitter-main">
            <div className="profile-twitter-topbar">
              <button type="button" className="profile-twitter-back" onClick={onBack}>
                ←
              </button>

              <div className="profile-twitter-topmeta">
                <strong>Perfil</strong>
                <span>Cargando...</span>
              </div>
            </div>

            <div className="profile-twitter-content">
              <section className="profile-twitter-section">
                <p className="profile-twitter-empty">
                  {loadingViewedProfile ? 'Cargando perfil...' : 'No se pudo cargar el perfil.'}
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-page-shell ${darkMode ? 'dark-profile-page' : ''}`}>
      <div className="profile-twitter-layout">
        <main className="profile-twitter-main">
          <div className="profile-twitter-topbar">
            <button type="button" className="profile-twitter-back" onClick={onBack}>
              ←
            </button>

            <div className="profile-twitter-topmeta">
              <strong>{displayName}</strong>
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
              {isOwnProfile ? (
                <button
                  type="button"
                  className="profile-twitter-edit-btn"
                  onClick={onOpenEditProfile}
                >
                  Editar perfil
                </button>
              ) : (
                <button
                  type="button"
                  className="profile-twitter-edit-btn"
                  onClick={() => navigate('/')}
                >
                  Volver al inicio
                </button>
              )}
            </div>
          </div>

          <div className="profile-twitter-info">
            <div className="profile-twitter-name-row">
              <h1>{displayName}</h1>
              <span className="profile-twitter-verified-pill">✔ Get verified</span>
            </div>

            <p className="profile-twitter-handle">
              @{viewedProfile?.email?.split('@')[0] || 'usuario'}
            </p>
            <p className="profile-twitter-bio">{profileBio}</p>

            <div className="profile-twitter-tags">
              {profileTags.map((tag) => (
                <span key={tag} className="profile-twitter-tag">
                  {tag}
                </span>
              ))}
            </div>

            <div className="profile-twitter-meta-extra">
              {locationText && (
                <span className="profile-twitter-meta-pill">📍 {locationText}</span>
              )}

              {birthDate && (
                <span className="profile-twitter-meta-pill">
                  🎂{' '}
                  {new Date(birthDate).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
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
                  {galleryMedia.length > 6 && (
                    <button
                      type="button"
                      className="profile-twitter-more-btn"
                      onClick={() => setShowAllGallery((prev) => !prev)}
                    >
                      {showAllGallery ? 'Ver menos' : `Ver más (${galleryMedia.length})`}
                    </button>
                  )}
                </div>

                {galleryMedia.length === 0 ? (
                  <p className="profile-twitter-empty">Aún no hay archivos publicados.</p>
                ) : (
                  <div className="profile-twitter-gallery media-gallery-grid">
  {visibleGalleryMedia.map((item, index) => {
    const isVideo = item.media_type === 'video';
    const imageOnlyGallery = galleryMedia.filter(
      (mediaItem) => mediaItem.media_type === 'image'
    );

    const realImageIndex = imageOnlyGallery.findIndex(
      (mediaItem) => mediaItem.id === item.id
    );

    return (
      <div
        key={item.id || index}
        className={`profile-twitter-gallery-item media-gallery-item ${
          isVideo ? 'is-video' : 'is-image'
        } ${visibleGalleryMedia.length === 1 ? 'single-item' : ''}`}
      >
        {isVideo ? (
          <RecognitionVideoPlayer
            src={item.fullUrl}
            className="profile-twitter-gallery-video"
            autoPlayWhenVisible={true}
            showDurationBadge={true}
            compact={true}
          />
        ) : (
          <button
            type="button"
            className="profile-twitter-gallery-button profile-gallery-image-btn"
            onClick={() => onOpenImageViewer(imageOnlyGallery, realImageIndex)}
          >
            <img
              src={item.fullUrl}
              alt={`Galería ${index + 1}`}
              className="profile-twitter-gallery-image profile-gallery-image"
            />
          </button>
        )}
      </div>
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
                    <strong>{galleryMedia.length}</strong>
                    <span>Archivos compartidos</span>
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
              <strong>{displayName}</strong>
            </div>
            <div className="profile-twitter-side-stat">
              <span>Correo</span>
              <strong>{viewedProfile?.email}</strong>
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
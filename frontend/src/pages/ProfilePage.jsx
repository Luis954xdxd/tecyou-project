import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import RecognitionVideoPlayer from '../components/RecognitionVideoPlayer';
import { renderTextWithHashtags } from '../textFormatters';
import ProgressPanel from '../components/ProgressPanel';
import copperFrame from '../assets/frames/copper-frame.png';
import silverFrame from '../assets/frames/silver-frame.png';
import goldFrame from '../assets/frames/gold-frame.png';
import crimsonRubyFrame from '../assets/frames/crimson-ruby-frame.png';
import diamondFrame from '../assets/frames/diamond-frame.png';

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
  onFavoritesChanged,
  onOpenRecognition,
  onBadgeAssigned,

  // Controla si se muestran u ocultan los marcos
  hideAvatarFrames,
})  {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [activeTab, setActiveTab] = useState('media');
  const [showAllGallery, setShowAllGallery] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const [loadingViewedProfile, setLoadingViewedProfile] = useState(false);
  const [equippedFrame, setEquippedFrame] = useState(null);
  
  const [favoriteRecognitions, setFavoriteRecognitions] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [savedReactionTotals, setSavedReactionTotals] = useState({});
  const [savedReactionUsersMap, setSavedReactionUsersMap] = useState({});
  const [profileActivity, setProfileActivity] = useState([]);
const [loadingProfileActivity, setLoadingProfileActivity] = useState(false);

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
  const fetchSavedRecognitionReactions = async (recognitionId) => {
   try {
    const response = await axios.get(
      `${API_BASE}/api/recognitions/${recognitionId}/reactions`
    );

    console.log('Reactions response', recognitionId, response.data);

    const totals = Array.isArray(response.data?.totals) ? response.data.totals : [];
    const users = Array.isArray(response.data?.users) ? response.data.users : [];

    const totalsMap = {
      like: 0,
      celebrate: 0,
      inspire: 0,
      love: 0,
    };

    totals.forEach((item) => {
      totalsMap[item.reaction_type] = Number(item.total) || 0;
    });

    console.log('Totals map for', recognitionId, totalsMap);

    setSavedReactionTotals((prev) => ({
      ...prev,
      [recognitionId]: totalsMap,
    }));

    setSavedReactionUsersMap((prev) => ({
      ...prev,
      [recognitionId]: users,
    }));
  } catch (error) {
    console.error(`Error cargando reacciones de guardado ${recognitionId}:`, error);
  }
};

const fetchAllSavedReactions = async (savedRecognitions) => {
  try {
    if (!Array.isArray(savedRecognitions) || savedRecognitions.length === 0) {
      setSavedReactionTotals({});
      setSavedReactionUsersMap({});
      return;
    }

    await Promise.all(
      savedRecognitions.map((rec) => fetchSavedRecognitionReactions(rec.id))
    );
  } catch (error) {
    console.error('Error cargando reacciones de guardados:', error);
  }
};
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const getFrameAsset = (frameCode) => {
    switch (frameCode) {
      case 'copper_frame':
        return copperFrame;
      case 'silver_frame':
        return silverFrame;
      case 'gold_frame':
        return goldFrame;
      case 'crimson_ruby_frame':
        return crimsonRubyFrame;
      case 'diamond_frame':
        return diamondFrame;
      default:
        return null;
    }
  };

  const reactionMeta = {
  like: { icon: '👍', label: 'Me gusta' },
  celebrate: { icon: '🎉', label: 'Celebrar' },
  inspire: { icon: '💡', label: 'Inspirar' },
  love: { icon: '❤️', label: 'Encanta' },
  };
   
  const fetchFavorites = async () => {
  try {
    console.log('fetchFavorites -> loggedInUserId:', loggedInUserId);
    console.log('fetchFavorites -> isOwnProfile:', isOwnProfile);

    if (!loggedInUserId || !isOwnProfile) {
      setFavoriteRecognitions([]);
      setSavedReactionTotals({});
      setSavedReactionUsersMap({});
      return;
    }

    setLoadingFavorites(true);

    const response = await axios.get(
      `${API_BASE}/api/recognitions/favorites/${loggedInUserId}`
    );

    console.log('fetchFavorites -> response.data:', response.data);

    const favorites = Array.isArray(response.data) ? response.data : [];
    setFavoriteRecognitions(favorites);

    await fetchAllSavedReactions(favorites);
  } catch (error) {
    console.error('Error cargando favoritos del perfil:', error);
  } finally {
    setLoadingFavorites(false);
  }
  };

  

  const handleRemoveFavoriteFromProfile = async (recognitionId) => {
  try {
    if (!loggedInUserId) return;

    await axios.delete(
      `${API_BASE}/api/recognitions/${recognitionId}/favorite`,
      {
        data: { user_id: loggedInUserId },
      }
    );

    setFavoriteRecognitions((prev) =>
      prev.filter((item) => Number(item.id) !== Number(recognitionId))
    );

    if (onFavoritesChanged) {
      await onFavoritesChanged();
    }
  } catch (error) {
    console.error('Error quitando guardado desde perfil:', error);
  }
  };

  const fetchEquippedFrame = async (targetUserId) => {
    try {
      if (!targetUserId) return;

      const response = await axios.get(
        `${API_BASE}/api/progress/${targetUserId}/summary`
      );

      setEquippedFrame(response.data?.summary?.equipped_frame || null);
    } catch (error) {
      console.error('Error al obtener marco equipado:', error);
      setEquippedFrame(null);
    }
  };
  

  useEffect(() => {
  if (activeTab === 'saved' && isOwnProfile) {
    fetchFavorites();
  }
    }, [activeTab, isOwnProfile, loggedInUserId]);

    useEffect(() => {
  if (activeTab === 'saved' && favoriteRecognitions.length > 0) {
    fetchAllSavedReactions(favoriteRecognitions);
  }
}, [favoriteRecognitions, activeTab]);

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
      fetchEquippedFrame(currentUser?.id);
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
        await fetchEquippedFrame(profile.id);
      } catch (err) {
        console.error('Error al cargar perfil público:', err);
      } finally {
        setLoadingViewedProfile(false);
      }
    };

    fetchViewedProfile();
  }, [isOwnProfile, currentUser, userId, loggedInUserId, navigate]);

  useEffect(() => {
  const fetchProfileActivity = async () => {
    if (!viewedProfile?.id) return;

    try {
      setLoadingProfileActivity(true);
      const response = await axios.get(
        `${API_BASE}/api/users/${viewedProfile.id}/activity`
      );
      setProfileActivity(Array.isArray(response.data) ? response.data.slice(0, 5) : []);
    } catch (error) {
      console.error('Error cargando actividad del perfil:', error);
      setProfileActivity([]);
    } finally {
      setLoadingProfileActivity(false);
    }
  };

  fetchProfileActivity();
}, [viewedProfile?.id]);

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
  const equippedFrameAsset = getFrameAsset(equippedFrame?.code);
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
            <div className="profile-twitter-avatar-wrap stylized-frame-wrap">
  <div className="profile-twitter-avatar-base">
    {profileImage ? (
      <img src={profileImage} alt="Perfil" className="profile-twitter-avatar" />
    ) : (
      <div className="profile-twitter-avatar-fallback">{initials}</div>
    )}
  </div>

  {/* ARREGLO AQUÍ: oculta el marco del perfil estilo Twitter */}
{/* ARREGLO AQUÍ: si el usuario ocultó marcos, este marco del perfil NO se pinta */}
{/* ARREGLO AQUÍ:
   Agregamos frame-${equippedFrame?.code} para poder acomodar cada marco por separado.
   Ejemplo:
   - cobre: frame-copper_frame
   - plata: frame-silver_frame
   - oro: frame-gold_frame
   - rubí carmesí: frame-crimson_ruby_frame
   - diamante: frame-diamond_frame
*/}
{!hideAvatarFrames && equippedFrameAsset && (
  <img
    src={equippedFrameAsset}
    alt={equippedFrame?.name || 'Marco de avatar'}
    className={`profile-twitter-avatar-frame-image frame-${equippedFrame?.code}`}
  />
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
            {/* ARREGLO AQUÍ:
   Si los marcos están ocultos, también ocultamos el texto de marco equipado.
            */}
              {!hideAvatarFrames && equippedFrame && (
              <div className="profile-equipped-frame-chip">
               Marco equipado: {equippedFrame.name}
            </div>
            )}


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
            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              Logros
            </button>

            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'badges' ? 'active' : ''}`}
              onClick={() => setActiveTab('badges')}
            >
              Insignias
            </button>

            <button
              type="button"
              className={`profile-twitter-tab ${activeTab === 'frames' ? 'active' : ''}`}
              onClick={() => setActiveTab('frames')}
            >
              Marcos
            </button>
            {isOwnProfile && (
                   <button
                    type="button"
                    className={`profile-twitter-tab ${activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('saved')}
                >
                 Guardados
                </button>
)}

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
                            <p className="message-with-hashtags">
                                {renderTextWithHashtags(rec.message, (tag) => {
                                   console.log('Hashtag clicado:', tag);
                                      })}
                                    </p>
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
                       <p className="message-with-hashtags">
                        {renderTextWithHashtags(rec.message, (tag) => {
                         console.log('Hashtag clicado:', tag);
                            })}
                      </p>
                      
                      
                      
                      
                      
                      
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
            {(activeTab === 'achievements' ||
              activeTab === 'badges' ||
              activeTab === 'frames') && (
              <ProgressPanel
                profileUserId={profileUserId}
                currentUser={currentUser}
                isOwnProfile={isOwnProfile}
                onBadgeAssigned={onBadgeAssigned}
              />
            )}

            {activeTab === 'saved' && isOwnProfile && (
              <section className="profile-twitter-section">
                <div className="profile-twitter-section-head">
                  <h2>Reconocimientos guardados</h2>
                </div>

                {loadingFavorites ? (
                  <p className="profile-twitter-empty">Cargando guardados...</p>
                ) : favoriteRecognitions.length === 0 ? (
                  <p className="profile-twitter-empty">
                  Aún no has guardado reconocimientos.
                </p>
                ) : (
               <div className="profile-twitter-rec-list">
                  {favoriteRecognitions.map((rec) => (
                  <div key={rec.id} className="saved-recognition-feed-card">
                <div className="saved-recognition-top">
                  <div className="saved-recognition-badge">
                  {rec.category}
                  </div>

                  <span className="saved-recognition-date">
                  {new Date(rec.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })}
               </span>



    <div className="saved-reactions-row">
  {['like', 'celebrate', 'inspire', 'love'].map((type) => (
    <div key={type} className="saved-reaction-pill">
      <span className="saved-reaction-icon">
        {reactionMeta[type].icon}
      </span>
      <span className="saved-reaction-count">
        {savedReactionTotals[Number(rec.id)]?.[type] || 0}
      </span>
    </div>
  ))}
</div>
  </div>

  <div className="saved-recognition-header">
    <strong>{rec.sender_name}</strong>
    <span className="saved-recognition-arrow">reconoció a</span>
    <strong>{rec.receiver_name}</strong>
  </div>

  <div className="saved-recognition-message-box">
    <p className="message-with-hashtags">
  {renderTextWithHashtags(rec.message, (tag) => {
    console.log('Hashtag clicado:', tag);
  })}
</p>
  </div>

  {Array.isArray(rec.media) && rec.media.length > 0 && (
    <div className={`saved-media-grid media-count-${rec.media.length}`}>
      {rec.media.map((item) =>
        item.media_type === 'video' ? (
          <video
            key={item.id}
            className="saved-media-item clickable"
            src={`${API_BASE}${item.media_url}`}
            autoPlay
            muted
            loop
            playsInline
            controls
            
          />
        ) : (
          <img
            key={item.id}
            className="saved-media-item clickable"
            src={`${API_BASE}${item.media_url}`}
            alt="Media del reconocimiento guardado"
            onClick={() => {
              const imageItems = rec.media
                .filter((m) => m.media_type === 'image')
                .map((m) => ({
                  ...m,
                  fullUrl: resolveImageUrl(m.media_url),
                }));

              const clickedIndex = imageItems.findIndex((m) => m.id === item.id);

              if (onOpenImageViewer && clickedIndex >= 0) {
                onOpenImageViewer(imageItems, clickedIndex);
              }
            }}
          />
        )
      )}
    </div>
  )}
     


{savedReactionUsersMap[Number(rec.id)]?.length > 0 && (
  <div className="saved-reaction-users">
    {savedReactionUsersMap[Number(rec.id)].slice(0, 3).map((user) => (
      <span key={user.user_id} className="saved-reaction-user">
        {user.display_name || user.user_name || user.fullname || 'Usuario'}
      </span>
    ))}
  </div>
)}


  <div className="saved-recognition-actions">
    <button
      type="button"
      className="saved-open-btn"
      onClick={() => onOpenRecognition?.(rec.id)}
    >
      Ver publicación
    </button>

    <button
      type="button"
      className="saved-remove-btn"
      onClick={() => handleRemoveFavoriteFromProfile(rec.id)}
    >
      ★ Quitar de guardados
    </button>
    </div>

  
  </div>
   
   
   
    


               ))}
          </div>
         )}
      </section>
      )}
          </div>
        </main>

        <aside className="profile-twitter-sidebar">
          <div className="profile-twitter-sidebox">
           <input
            type="text"
            id="profileSearchInput"
            className="profile-twitter-search-input"
            placeholder="Buscar reconocimientos..."
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

  {loadingProfileActivity ? (
    <p className="profile-twitter-side-text">Cargando actividad...</p>
  ) : profileActivity.length === 0 ? (
    <p className="profile-twitter-side-text">Aún no hay actividad reciente.</p>
  ) : (
    <div className="profile-twitter-side-activity-list">
      {profileActivity.map((item, index) => (
        <div
          key={`${item.type}-${index}-${item.created_at}`}
          className="profile-twitter-side-activity-item"
        >
          <strong>
            {item.actor_name || 'Usuario'}{' '}
            {item.type === 'new_follower'
              ? 'comenzó a seguir este perfil'
              : item.type === 'reaction_received'
              ? 'reaccionó a un reconocimiento'
              : 'envió un reconocimiento'}
          </strong>

          {item.extra && <span>Categoría: {item.extra}</span>}
        </div>
      ))}
    </div>
  )}
</div>
        </aside>
      </div>
    </div>
  );
}

export default ProfilePage;
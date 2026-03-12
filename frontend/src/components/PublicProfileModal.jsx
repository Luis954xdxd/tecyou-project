import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function PublicProfileModal({ userId, currentUserId, isOpen, onClose, onFollowChanged }) {
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [processingFollow, setProcessingFollow] = useState(false);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchProfile = async () => {
    if (!userId || !isOpen) return;

    try {
      setLoadingProfile(true);
      const response = await axios.get(
        `${API_BASE}/api/users/${userId}/public?viewerId=${currentUserId}`
      );
      setProfileData(response.data);
    } catch (error) {
      console.error('Error al obtener perfil público:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId, isOpen]);

  const handleFollowToggle = async () => {
    if (!profileData?.user || Number(profileData.user.id) === Number(currentUserId)) return;

    try {
      setProcessingFollow(true);

      if (profileData.user.is_following) {
        await axios.delete(`${API_BASE}/api/users/${profileData.user.id}/follow`, {
          data: { follower_id: currentUserId },
        });
      } else {
        await axios.post(`${API_BASE}/api/users/${profileData.user.id}/follow`, {
          follower_id: currentUserId,
        });
      }

      await fetchProfile();
      if (onFollowChanged) onFollowChanged();
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      alert(error.response?.data?.error || 'No se pudo actualizar el seguimiento.');
    } finally {
      setProcessingFollow(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="public-profile-overlay" onClick={onClose}>
      <div className="public-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="public-profile-topbar">
          <div>
            <p className="section-label">Perfil público</p>
            <h2>Comunidad ¡Tec! ¡you!</h2>
          </div>
          <button type="button" className="profile-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {loadingProfile ? (
          <div className="public-profile-loading">
            <p>Cargando perfil...</p>
          </div>
        ) : !profileData ? (
          <div className="public-profile-loading">
            <p>No se pudo cargar el perfil.</p>
          </div>
        ) : (
          <>
            <div className="public-profile-hero">
              <div className="public-profile-avatar-wrap">
                {profileData.user.profile_image_url ? (
                  <img
                    src={resolveImageUrl(profileData.user.profile_image_url)}
                    alt={profileData.user.display_name}
                    className="public-profile-avatar"
                  />
                ) : (
                  <div className="public-profile-avatar-fallback">
                    {(profileData.user.display_name || profileData.user.fullname || 'TSJ')
                      .split(' ')
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="public-profile-main">
                <h3>{profileData.user.display_name}</h3>
                <p className="public-profile-email">{profileData.user.email}</p>
                <p className="public-profile-bio">
                  {profileData.user.bio || 'Este usuario aún no ha agregado una biografía.'}
                </p>

                <div className="public-profile-tags">
                  {(profileData.user.tags || []).map((tag) => (
                    <span key={tag} className="profile-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                {Number(profileData.user.id) !== Number(currentUserId) && (
                  <button
                    type="button"
                    className={`follow-btn ${profileData.user.is_following ? 'following' : ''}`}
                    onClick={handleFollowToggle}
                    disabled={processingFollow}
                  >
                    {processingFollow
                      ? 'Procesando...'
                      : profileData.user.is_following
                      ? 'Siguiendo'
                      : 'Seguir'}
                  </button>
                )}
              </div>
            </div>

            <div className="public-profile-stats">
              <div className="profile-mini-stat">
                <span>Seguidores</span>
                <strong>{profileData.user.followers_count}</strong>
              </div>
              <div className="profile-mini-stat">
                <span>Siguiendo</span>
                <strong>{profileData.user.following_count}</strong>
              </div>
              <div className="profile-mini-stat">
                <span>Enviados</span>
                <strong>{profileData.user.recognitions_sent}</strong>
              </div>
              <div className="profile-mini-stat">
                <span>Recibidos</span>
                <strong>{profileData.user.recognitions_received}</strong>
              </div>
            </div>

            <div className="public-profile-columns">
              <div className="public-profile-column">
                <h4>Reconocimientos recibidos</h4>
                <div className="public-profile-rec-list">
                  {profileData.recognitions_received.length === 0 ? (
                    <p className="public-profile-empty">Aún no hay reconocimientos recibidos.</p>
                  ) : (
                    profileData.recognitions_received.map((item) => (
                      <div key={item.id} className="public-profile-rec-card">
                        <strong>{item.sender_name}</strong>
                        <span>{item.category} · {formatDate(item.created_at)}</span>
                        <p>“{item.message}”</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="public-profile-column">
                <h4>Reconocimientos enviados</h4>
                <div className="public-profile-rec-list">
                  {profileData.recognitions_sent.length === 0 ? (
                    <p className="public-profile-empty">Aún no hay reconocimientos enviados.</p>
                  ) : (
                    profileData.recognitions_sent.map((item) => (
                      <div key={item.id} className="public-profile-rec-card">
                        <strong>{item.receiver_name}</strong>
                        <span>{item.category} · {formatDate(item.created_at)}</span>
                        <p>“{item.message}”</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PublicProfileModal;
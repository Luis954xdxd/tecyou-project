import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FramedAvatar from './FramedAvatar';

const API_BASE = 'http://localhost:5000';
const CONTACTS_LIMIT = 14;

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Sin actividad reciente';
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  return 'Hace mas de 1 dia';
};

function UsersDirectory({ currentUserId, onUserSelected, onOpenProfile, onOpenChat, onlineUsers = {} }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [processingFollowId, setProcessingFollowId] = useState(null);
  const navigate = useNavigate();

  const resolveImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(
        `${API_BASE}/api/users/all?currentUserId=${currentUserId}`
      );
      const filtered = (response.data || [])
        .filter((u) => Number(u.id) !== Number(currentUserId))
        .slice(0, CONTACTS_LIMIT);
      setUsers(filtered);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchUsers();
  }, [currentUserId]);

  const contacts = useMemo(
    () =>
      users.map((user) => {
        const presence = onlineUsers[user.id];
        const active = Boolean(presence?.online);
        return {
          ...user,
          active,
          activityLabel: active ? 'Activo ahora' : formatLastSeen(presence?.lastSeen),
        };
      }),
    [users, onlineUsers]
  );

  const handleFollowToggle = async (targetUser, e) => {
    e.stopPropagation();
    try {
      setProcessingFollowId(targetUser.id);

      if (targetUser.is_following) {
        await axios.delete(`${API_BASE}/api/users/${targetUser.id}/follow`, {
          data: { follower_id: currentUserId },
        });
      } else {
        await axios.post(`${API_BASE}/api/users/${targetUser.id}/follow`, {
          follower_id: currentUserId,
        });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_following: !u.is_following } : u
        )
      );
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      alert(error.response?.data?.error || 'No se pudo actualizar el seguimiento.');
    } finally {
      setProcessingFollowId(null);
    }
  };

  return (
    <section id="users-directory-section" className="users-carousel-section contacts-panel-section">
      <div className="contacts-panel-header">
        <div>
          <p className="section-label">Comunidad</p>
          <h2>Contactos</h2>
        </div>

        <button
          type="button"
          className="contacts-see-all-btn"
          onClick={() => navigate('/usuarios')}
        >
          Ver todos
        </button>
      </div>

      {loadingUsers ? (
        <div className="users-carousel-loading compact">
          <div className="loading-spinner" />
          <span>Cargando usuarios...</span>
        </div>
      ) : (
        <div className="contacts-list">
          {contacts.map((user) => (
            <article key={user.id} className="contact-row">
              <button
                type="button"
                className="contact-main-btn"
                onClick={() => onOpenProfile(user.id)}
                aria-label={`Ver perfil de ${user.display_name || user.fullname}`}
              >
                <span className="contact-avatar-wrap">
                  <FramedAvatar
                    imageUrl={resolveImageUrl(user.profile_image_url)}
                    name={user.display_name || user.fullname}
                    frameCode={user.equipped_frame_code}
                    sizeClass="size-nav"
                  />
                  <span className={`contact-status-dot ${user.active ? 'online' : 'away'}`}></span>
                </span>
                <span className="contact-meta">
                  <strong>{user.display_name || user.fullname}</strong>
                  <small>{user.activityLabel}</small>
                </span>
              </button>

              <div className="contact-actions">
                <button
                  type="button"
                  className="contact-message-btn"
                  onClick={() => onOpenChat?.(user)}
                  title="Mensaje"
                  aria-label={`Enviar mensaje a ${user.display_name || user.fullname}`}
                >
                  {'\u2709'}
                </button>
                <button
                  type="button"
                  className="contact-message-btn recognize"
                  onClick={() => onUserSelected(user)}
                  title="Reconocer"
                  aria-label={`Reconocer a ${user.display_name || user.fullname}`}
                >
                  {'\u2728'}
                </button>
                <button
                  type="button"
                  className={`contact-follow-btn ${user.is_following ? 'following' : ''}`}
                  onClick={(e) => handleFollowToggle(user, e)}
                  disabled={processingFollowId === user.id}
                >
                  {processingFollowId === user.id ? '...' : user.is_following ? 'Siguiendo' : 'Seguir'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default UsersDirectory;

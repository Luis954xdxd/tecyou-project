import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function NotificationsBell({ userId, onOpenProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getNotificationText = (item) => {
    if (item.type === 'new_follower') {
      return `${item.actor_name} comenzó a seguirte`;
    }

    if (item.type === 'recognition_received') {
      return `${item.actor_name} te envió un reconocimiento`;
    }

    if (item.type === 'reaction_received') {
      const reactionMap = {
        like: '👍 reaccionó a tu reconocimiento',
        celebrate: '🎉 celebró tu reconocimiento',
        inspire: '💡 encontró inspirador tu reconocimiento',
        love: '❤️ reaccionó con aprecio a tu reconocimiento',
      };

      return `${item.actor_name} ${reactionMap[item.content] || 'reaccionó a tu reconocimiento'}`;
    }

    if (item.type === 'comment_received') {
      return `${item.actor_name} comentó tu reconocimiento`;
    }
    if (item.type === 'comment_reply_received') {
      return `${item.actor_name} respondió tu comentario`;
    }

    return item.title || 'Nueva notificación';
  };

  const fetchNotifications = async () => {
  if (!userId) return;

  try {
    setLoadingNotifications(true);

    const notificationsRes = await axios.get(
      `${API_BASE}/api/users/${userId}/notifications`
    );

    setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data.slice(0, 6) : []);
  } catch (error) {
    console.error('Error al obtener notificaciones para campanita:', error);
    setNotifications([]);
  }

  try {
    const unreadRes = await axios.get(
      `${API_BASE}/api/users/${userId}/notifications/unread-count`
    );

    setUnreadCount(unreadRes.data?.total || 0);
  } catch (error) {
    console.error('Error al obtener contador de no leídas para campanita:', error);
    setUnreadCount(0);
  } finally {
    setLoadingNotifications(false);
  }
};

  useEffect(() => {
  if (!userId) return;

  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 10000);

  return () => clearInterval(interval);
}, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = async () => {
    const nextState = !openDropdown;
    setOpenDropdown(nextState);

    if (nextState) {
      await fetchNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_BASE}/api/users/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error al marcar notificación como leída desde campanita:', error);
    }
  };

  const handleReadAll = async () => {
    try {
      await axios.patch(`${API_BASE}/api/users/${userId}/notifications/read-all`);
      fetchNotifications();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  return (
    <div className="notifications-bell-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="notifications-bell-btn"
        onClick={handleToggleDropdown}
        aria-label="Abrir notificaciones"
        title="Notificaciones"
      >
        <span className="notifications-bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notifications-bell-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {openDropdown && (
        <div className="notifications-bell-dropdown">
          <div className="notifications-bell-header">
            <div>
              <strong>Notificaciones</strong>
              <span>{unreadCount} sin leer</span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-bell-read-all"
                onClick={handleReadAll}
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="notifications-bell-list">
            {loadingNotifications ? (
              <div className="notifications-bell-empty">
                <p>Cargando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notifications-bell-empty">
                <p>No tienes notificaciones recientes.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`notifications-bell-item ${item.is_read ? 'read' : 'unread'}`}
                >
                  <div className="notifications-bell-avatar">
                    {item.actor_profile_image ? (
                      <img
                        src={resolveImageUrl(item.actor_profile_image)}
                        alt={item.actor_name}
                        className="notifications-bell-avatar-image"
                      />
                    ) : (
                      <div className="notifications-bell-avatar-fallback">
                        {(item.actor_name || 'TSJ')
                          .split(' ')
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="notifications-bell-content">
                    <button
                      type="button"
                      className="inline-user-link notification-main-link"
                      onClick={() => {
                        if (item.actor_id) onOpenProfile(item.actor_id);
                        setOpenDropdown(false);
                      }}
                    >
                      {getNotificationText(item)}
                    </button>

                    {item.content &&
                      (item.type === 'recognition_received' || item.type === 'comment_received') && (
                        <small>“{item.content}”</small>
                      )}

                    <span>{formatDate(item.created_at)}</span>
                  </div>

                  {!item.is_read && (
                    <button
                      type="button"
                      className="notifications-bell-mark-btn"
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsBell;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function NotificationsPanel({ userId, onOpenProfile }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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

    return item.title || 'Nueva notificación';
  };

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoadingNotifications(true);

      const [notificationsRes, unreadRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users/${userId}/notifications`),
        axios.get(`${API_BASE}/api/users/${userId}/notifications/unread-count`),
      ]);

      setNotifications(notificationsRes.data);
      setUnreadCount(unreadRes.data.total || 0);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API_BASE}/api/users/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
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
    <section className="notifications-section">
      <div className="notifications-card">
        <div className="notifications-header">
          <div>
            <p className="section-label">Notificaciones</p>
            <h2>Centro de notificaciones</h2>
          </div>

          <div className="notifications-header-actions">
            <span className="notifications-badge">{unreadCount} sin leer</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-read-all-btn"
                onClick={handleReadAll}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        <div className="notifications-list">
          {loadingNotifications ? (
            <div className="notifications-empty-state">
              <p>Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty-state">
              <p>No tienes notificaciones todavía.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`notification-item ${item.is_read ? 'read' : 'unread'}`}
              >
                <div className="notification-avatar">
                  {item.actor_profile_image ? (
                    <img
                      src={resolveImageUrl(item.actor_profile_image)}
                      alt={item.actor_name}
                      className="notification-avatar-image"
                    />
                  ) : (
                    <div className="notification-avatar-fallback">
                      {(item.actor_name || 'TSJ')
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="notification-content">
                  <button
                    type="button"
                    className="inline-user-link notification-main-link"
                    onClick={() => item.actor_id && onOpenProfile(item.actor_id)}
                  >
                    {getNotificationText(item)}
                  </button>

                  {item.type === 'recognition_received' && item.content && (
                    <small>“{item.content}”</small>
                  )}

                  <span>{formatDate(item.created_at)}</span>
                </div>

                {!item.is_read && (
                  <button
                    type="button"
                    className="notification-read-btn"
                    onClick={() => handleMarkAsRead(item.id)}
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default NotificationsPanel;
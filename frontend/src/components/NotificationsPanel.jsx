import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function NotificationsPanel({ userId, onOpenProfile, onOpenStory }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Controla si ya se hizo la primera carga.
  // En los polls posteriores NO se muestra el spinner para evitar
  // que el componente se encoja y cause el espasmo visual.
  const hasLoadedOnce = useRef(false);

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

    if (item.type === 'comment_received') {
      return `${item.actor_name} comentó tu reconocimiento`;
    }
    if (item.type === 'comment_reply_received') {
      return `${item.actor_name} respondió tu comentario`;
    }
    if (item.type === 'story_mention') {
      return `${item.actor_name} te etiquetó en una historia`;
    }
    if (item.type === 'report_updated') {
      return item.title || 'Tu reporte fue actualizado por moderacion';
    }

    return item.title || 'Nueva notificación';
  };

  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      // Solo muestra el spinner en la PRIMERA carga.
      // En los polls del intervalo actualiza los datos en silencio,
      // sin cambiar la altura del componente ni causar parpadeo.
      if (!hasLoadedOnce.current) {
        setLoadingNotifications(true);
      }

      const notificationsRes = await axios.get(
        `${API_BASE}/api/users/${userId}/notifications`
      );

      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      if (!hasLoadedOnce.current) setNotifications([]);
    }

    try {
      const unreadRes = await axios.get(
        `${API_BASE}/api/users/${userId}/notifications/unread-count`
      );

      setUnreadCount(unreadRes.data?.total || 0);
    } catch (error) {
      console.error('Error al obtener contador de no leídas:', error);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // Intervalo cambiado de 10s a 30s:
    // - 10s era demasiado agresivo y los 3 componentes (ActivityPanel,
    //   NotificationsPanel, NotificationsBell) se disparaban al mismo tiempo
    //   causando múltiples re-renders y el espasmo visual cada 10 segundos.
    // - 30s es suficiente para mantener los datos frescos sin afectar la UI.
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
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
    <section id="notifications-section" className="notifications-section">
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
                  <div className="notification-avatar-fallback">
                    {(item.actor_name || 'U').trim().charAt(0).toUpperCase()}
                  </div>
                  {item.actor_profile_image && (
                    <img
                      src={resolveImageUrl(item.actor_profile_image)}
                      alt={item.actor_name}
                      className="notification-avatar-image"
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    />
                  )}
                </div>

                <div className="notification-content">
                  <button
                    type="button"
                    className="inline-user-link notification-main-link"
                    onClick={async () => {
                      await handleMarkAsRead(item.id);
                      if (item.type === 'story_mention' && item.reference_id && onOpenStory) {
                        onOpenStory(item.reference_id);
                      } else if (item.actor_id) {
                        onOpenProfile(item.actor_id);
                      }
                    }}
                  >
                    {getNotificationText(item)}
                  </button>

                  {(item.type === 'recognition_received' || item.type === 'comment_received') &&
                    item.content && <small>"{item.content}"</small>}

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

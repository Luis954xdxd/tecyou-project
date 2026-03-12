import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function ActivityPanel({ userId }) {
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!userId) return;

      try {
        setLoadingActivity(true);
        const response = await axios.get(`${API_BASE}/api/users/${userId}/activity`);
        setActivities(response.data);
      } catch (error) {
        console.error('Error al obtener actividad reciente:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, [userId]);

  const getActivityText = (item) => {
    if (item.type === 'recognition_received') {
      return `${item.actor_name} te envió un reconocimiento`;
    }

    if (item.type === 'new_follower') {
      return `${item.actor_name} comenzó a seguirte`;
    }

    if (item.type === 'reaction_received') {
      const reactionMap = {
        like: '👍 reaccionó a uno de tus reconocimientos',
        celebrate: '🎉 celebró uno de tus reconocimientos',
        inspire: '💡 encontró inspirador uno de tus reconocimientos',
        love: '❤️ reaccionó con aprecio a uno de tus reconocimientos',
      };

      return `${item.actor_name} ${reactionMap[item.content] || 'reaccionó a uno de tus reconocimientos'}`;
    }

    return 'Nueva actividad';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="activity-panel-section">
      <div className="activity-panel-card">
        <div className="activity-panel-header">
          <div>
            <p className="section-label">Actividad</p>
            <h2>Actividad reciente</h2>
          </div>
          <p className="activity-panel-subtext">
            Revisa interacciones recientes dentro de tu red en la comunidad.
          </p>
        </div>

        <div className="activity-panel-list">
          {loadingActivity ? (
            <div className="activity-empty-state">
              <p>Cargando actividad...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="activity-empty-state">
              <p>Aún no hay actividad reciente.</p>
            </div>
          ) : (
            activities.map((item, index) => (
              <div key={`${item.type}-${index}-${item.created_at}`} className="activity-item">
                <div className="activity-avatar">
                  {item.actor_profile_image ? (
                    <img
                      src={resolveImageUrl(item.actor_profile_image)}
                      alt={item.actor_name}
                      className="activity-avatar-image"
                    />
                  ) : (
                    <div className="activity-avatar-fallback">
                      {(item.actor_name || 'TSJ')
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="activity-meta">
                  <strong>{getActivityText(item)}</strong>
                  {item.extra && <span>Categoría: {item.extra}</span>}
                  {item.type === 'recognition_received' && item.content && (
                    <small>“{item.content}”</small>
                  )}
                </div>

                <div className="activity-date">{formatDate(item.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default ActivityPanel;
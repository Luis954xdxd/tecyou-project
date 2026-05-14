import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import FramedAvatar from './FramedAvatar';

const API_BASE = 'http://localhost:5000';

function ActivityPanel({ userId }) {
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Controla si ya se hizo la primera carga.
  // En los polls posteriores NO se muestra el spinner para evitar
  // que el componente se encoja y cause el espasmo visual.
  const hasLoadedOnce = useRef(false);

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

      return `${item.actor_name} ${
        reactionMap[item.content] || 'reaccionó a uno de tus reconocimientos'
      }`;
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

  const fetchActivity = async () => {
    if (!userId) return;

    try {
      // Solo muestra el spinner en la PRIMERA carga.
      // En los polls del intervalo actualiza los datos en silencio,
      // sin cambiar la altura del componente ni causar parpadeo.
      if (!hasLoadedOnce.current) {
        setLoadingActivity(true);
      }

      const response = await axios.get(`${API_BASE}/api/users/${userId}/activity`);
      setActivities(Array.isArray(response.data) ? response.data : []);
      hasLoadedOnce.current = true;
    } catch (error) {
      console.error('Error al obtener actividad reciente:', error);
      if (!hasLoadedOnce.current) setActivities([]);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchActivity();

    // Intervalo cambiado de 10s a 30s:
    // - 10s era demasiado agresivo y los 3 componentes (ActivityPanel,
    //   NotificationsPanel, NotificationsBell) se disparaban al mismo tiempo
    //   causando múltiples re-renders y el espasmo visual cada 10 segundos.
    // - 30s es suficiente para mantener los datos frescos sin afectar la UI.
    const interval = setInterval(() => {
      fetchActivity();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <section id="activity-section" className="activity-panel-section">
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
                  <FramedAvatar
                    imageUrl={item.actor_profile_image}
                    name={item.actor_name}
                    frameCode={item.actor_frame_code}
                    sizeClass="size-activity"
                  />
                </div>

                <div className="activity-meta">
                  <strong>{getActivityText(item)}</strong>
                  {item.extra && <span>Categoría: {item.extra}</span>}
                  {item.type === 'recognition_received' && item.content && (
                    <small>"{item.content}"</small>
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
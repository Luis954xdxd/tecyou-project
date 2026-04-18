import React from 'react';

function AchievementUnlockToast({ item, onClose }) {
  if (!item) return null;

  const isAchievement = item.type === 'achievement';
  const isFrame = item.type === 'frame';
  const isBadge = item.type === 'badge';

  const titleText = isAchievement
    ? 'LOGRO DESBLOQUEADO'
    : isFrame
    ? 'MARCO DESBLOQUEADO'
    : isBadge
    ? 'INSIGNIA OBTENIDA'
    : 'DESBLOQUEO';

  const icon = isAchievement
    ? item.icon || '🏆'
    : isFrame
    ? '🖼️'
    : isBadge
    ? '🎖️'
    : '✨';

  const subtitle = isAchievement
    ? item.description
    : isFrame
    ? item.description || 'Has desbloqueado un nuevo marco de avatar.'
    : isBadge
    ? item.description || 'Has recibido una nueva insignia.'
    : '';

  return (
    <div className="achievement-unlock-overlay">
      <div className="achievement-unlock-toast">
        <div className="achievement-unlock-glow"></div>

        <div className="achievement-unlock-topbar">
          <span className="achievement-unlock-label">{titleText}</span>

          <button
            type="button"
            className="achievement-unlock-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="achievement-unlock-content">
          <div className="achievement-unlock-icon-wrap">
            <div className="achievement-unlock-icon-ring"></div>
            <div className="achievement-unlock-icon">{icon}</div>
          </div>

          <div className="achievement-unlock-body">
            <h3>{item.title || item.name || 'Nuevo desbloqueo'}</h3>
            <p>{subtitle}</p>

            {item.rarity && (
              <span className="achievement-unlock-rarity">
                Rareza: {item.rarity}
              </span>
            )}
          </div>
        </div>

        <div className="achievement-unlock-footer">
          <span className="achievement-unlock-footer-text">
            ¡Sigue avanzando en ¡Tec! ¡you!!
          </span>
        </div>
      </div>
    </div>
  );
}

export default AchievementUnlockToast;
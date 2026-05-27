import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};

function ProgressPanel({
  profileUserId,
  currentUser,
  isOwnProfile,
  onBadgeAssigned,
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [frames, setFrames] = useState([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [badgeReason, setBadgeReason] = useState('');
  const [assigningBadge, setAssigningBadge] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const isTeacher = currentUser?.role === 'teacher';
  const canAssignBadges =
    Boolean(isTeacher) &&
    Boolean(currentUser?.id) &&
    Number(currentUser.id) !== Number(profileUserId);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setFeedback({ type: '', message: '' });

      const [
        summaryResponse,
        achievementsResponse,
        badgesResponse,
        framesResponse,
      ] = await Promise.all([
        axios.get(`${API_BASE}/api/progress/${profileUserId}/summary`),
        axios.get(`${API_BASE}/api/progress/${profileUserId}/achievements`),
        axios.get(`${API_BASE}/api/progress/${profileUserId}/badges`),
        axios.get(`${API_BASE}/api/progress/${profileUserId}/frames`),
      ]);

      setSummary(summaryResponse.data?.summary || null);
      setAchievements(achievementsResponse.data?.achievements || []);
      setBadges(badgesResponse.data?.badges || []);
      setFrames(framesResponse.data?.frames || []);
    } catch (error) {
      console.error('Error cargando progreso del usuario:', error);
      setFeedback({
        type: 'error',
        message: 'No se pudo cargar la información de progreso.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeDefinitions = async () => {
    try {
      if (!canAssignBadges) return;

      const response = await axios.get(
        `${API_BASE}/api/progress/definitions/badges/all`
      );

      setBadgeDefinitions(response.data?.badges || []);
    } catch (error) {
      console.error('Error cargando definiciones de insignias:', error);
    }
  };

  useEffect(() => {
    if (!profileUserId) return;
    fetchProgressData();
  }, [profileUserId]);

  useEffect(() => {
    fetchBadgeDefinitions();
  }, [canAssignBadges]);

  const unlockedAchievements = useMemo(
    () => achievements.filter((item) => item.is_unlocked),
    [achievements]
  );

  const lockedAchievements = useMemo(
    () => achievements.filter((item) => !item.is_unlocked),
    [achievements]
  );

  const equippedFrame = useMemo(
    () => frames.find((frame) => frame.is_equipped),
    [frames]
  );

  const unlockedFrames = useMemo(
    () => frames.filter((frame) => frame.is_unlocked),
    [frames]
  );

  const handleAssignBadge = async () => {
    try {
      setFeedback({ type: '', message: '' });

      if (!selectedBadgeId) {
        setFeedback({
          type: 'error',
          message: 'Selecciona una insignia antes de asignarla.',
        });
        return;
      }

      setAssigningBadge(true);

      const response = await axios.post(`${API_BASE}/api/progress/badges/assign`, {
        target_user_id: profileUserId,
        badge_id: Number(selectedBadgeId),
        assigned_by_user_id: Number(currentUser.id),
        reason: badgeReason.trim() || null,
      });

      setFeedback({
        type: 'success',
        message:
          response.data?.message || 'La insignia se asignó correctamente.',
      });

      setSelectedBadgeId('');
      setBadgeReason('');
      if (onBadgeAssigned && response.data?.result?.badge) {
        onBadgeAssigned({
          type: 'badge',
          title: response.data.result.badge.name,
          description: response.data.result.badge.description,
          rarity: response.data.result.badge.rarity,
        });

        const newFrames = response.data?.result?.newlyUnlockedFrames || [];

        if (Array.isArray(newFrames) && newFrames.length > 0) {
          newFrames.forEach((frame) => {
            onBadgeAssigned({
              type: 'frame',
              title: frame.name,
              name: frame.name,
              description: frame.description,
              rarity: frame.rarity,
            });
          });
        }
      }

      await fetchProgressData();
    } catch (error) {
      console.error('Error asignando insignia:', error);

      setFeedback({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'No se pudo asignar la insignia.',
      });
    } finally {
      setAssigningBadge(false);
    }
  };

  if (loading) {
    return (
      <section className="progress-panel-wrapper">
        <div className="progress-loading-box">
          <p>Cargando progreso...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="progress-panel-wrapper">
      {feedback.message && (
        <div className={`progress-feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      )}

      <div className="progress-summary-grid">
        <div className="progress-summary-card">
          <span>Logros desbloqueados</span>
          <strong>{summary?.counts?.achievements_unlocked || 0}</strong>
        </div>

        <div className="progress-summary-card">
          <span>Insignias obtenidas</span>
          <strong>{summary?.counts?.badges_count || 0}</strong>
        </div>

        <div className="progress-summary-card">
          <span>Recompensa actual</span>
          <strong>
            {summary?.reward_status?.current_reward_tier || 'Sin nivel'}
          </strong>
        </div>

        <div className="progress-summary-card">
          <span>Elegible para premio</span>
          <strong>
            {summary?.reward_status?.is_reward_eligible ? 'Sí' : 'Aún no'}
          </strong>
        </div>
      </div>

      <div className="progress-section-card">
        <div className="progress-section-head">
          <h3>Resumen general</h3>
          <p>Vista rápida del avance del usuario dentro de ¡Tec! ¡you!</p>
        </div>

        <div className="progress-metrics-grid">
          <div className="progress-metric-item">
            <span>Reconocimientos enviados</span>
            <strong>{summary?.counts?.recognitions_sent || 0}</strong>
          </div>

          <div className="progress-metric-item">
            <span>Reconocimientos recibidos</span>
            <strong>{summary?.counts?.recognitions_received || 0}</strong>
          </div>

          <div className="progress-metric-item">
            <span>Reacciones recibidas</span>
            <strong>{summary?.counts?.reactions_received || 0}</strong>
          </div>

          <div className="progress-metric-item">
            <span>Comentarios recibidos</span>
            <strong>{summary?.counts?.comments_received || 0}</strong>
          </div>
        </div>

        <div className="progress-category-box">
          <h4>Logros por categoría</h4>

          <div className="progress-category-grid">
            <div className="progress-category-pill">🤝 Colaboración: {summary?.counts?.category_received?.Colaboración || 0}</div>
            <div className="progress-category-pill">📚 Académico: {summary?.counts?.category_received?.Académico || 0}</div>
            <div className="progress-category-pill">⭐ Liderazgo: {summary?.counts?.category_received?.Liderazgo || 0}</div>
            <div className="progress-category-pill">💡 Creatividad: {summary?.counts?.category_received?.Creatividad || 0}</div>
          </div>
        </div>

        {equippedFrame && (
          <div className="equipped-frame-box">
            <h4>Marco equipado actualmente</h4>
            <div className="equipped-frame-pill">
              {equippedFrame.name} · {equippedFrame.rarity}
            </div>
          </div>
        )}
      </div>

      <div className="progress-section-card">
        <div className="progress-section-head">
          <h3>Logros desbloqueados</h3>
          <p>Estos logros se obtienen automáticamente por actividad real en la app.</p>
        </div>

        {unlockedAchievements.length === 0 ? (
          <p className="progress-empty-state">Aún no hay logros desbloqueados.</p>
        ) : (
          <div className="achievement-grid">
            {unlockedAchievements.map((achievement) => (
              <div key={achievement.id} className="achievement-card unlocked">
                <div className="achievement-icon">{achievement.icon || '🏆'}</div>
                <div className="achievement-body">
                  <strong>{achievement.title}</strong>
                  <p>{achievement.description}</p>
                  <span className="achievement-meta">
                    {achievement.category} · {achievement.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-section-card">
        <div className="progress-section-head">
          <h3>Logros disponibles</h3>
          <p>Aquí puedes ver qué logros existen aunque todavía no se hayan desbloqueado.</p>
        </div>

        {lockedAchievements.length === 0 ? (
          <p className="progress-empty-state">Ya no tienes logros pendientes en esta lista.</p>
        ) : (
          <div className="achievement-grid">
            {lockedAchievements.map((achievement) => (
              <div key={achievement.id} className="achievement-card locked">
                <div className="achievement-icon">{achievement.icon || '🔒'}</div>
                <div className="achievement-body">
                  <strong>{achievement.title}</strong>
                  <p>{achievement.description}</p>
                  <span className="achievement-meta">
                    {achievement.category} · {achievement.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-section-card">
        <div className="progress-section-head">
          <h3>Insignias recibidas</h3>
          <p>Estas insignias son otorgadas por maestros o personal autorizado.</p>
        </div>

        {badges.length === 0 ? (
          <p className="progress-empty-state">Aún no hay insignias asignadas.</p>
        ) : (
          <div className="badge-grid">
            {badges.map((badge) => (
              <div key={badge.id} className="badge-card">
                <div className="badge-logo-wrap">
                  {badge.image_url ? (
                    <img
                      src={resolveImageUrl(badge.image_url)}
                      alt={badge.name}
                      className="badge-logo-image"
                    />
                  ) : (
                    <div className="badge-logo-fallback">
                      <span>🏅</span>
                    </div>
                  )}
                </div>

                <div className="badge-card-content">
                <div className="badge-card-top">
                  <span className="badge-rarity-chip">{badge.rarity}</span>
                  <span className="badge-category-chip">{badge.category || 'general'}</span>
                </div>

                <strong>{badge.name}</strong>
                <p>{badge.description}</p>

                {badge.reason && (
                  <div className="badge-reason-box">
                    <span>Motivo:</span>
                    <p>{badge.reason}</p>
                  </div>
                )}

                <small>
                  Otorgada por {badge.assigned_by_name} ·{' '}
                  {new Date(badge.assigned_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-section-card">
        <div className="progress-section-head">
          <h3>Marcos de avatar</h3>
          <p>Se desbloquean al combinar logros e insignias dentro de la app.</p>
        </div>

        {frames.length === 0 ? (
          <p className="progress-empty-state">Aún no hay marcos disponibles.</p>
        ) : (
          <div className="frame-grid">
            {frames.map((frame) => (
              <div
                key={frame.id}
                className={`frame-card ${frame.is_unlocked ? 'unlocked' : 'locked'} ${
                  frame.is_equipped ? 'equipped' : ''
                }`}
              >
                <strong>{frame.name}</strong>
                <p>{frame.description}</p>
                <span className="frame-rarity-chip">{frame.rarity}</span>

                <div className="frame-requirements">
                  <small>Logros requeridos: {frame.required_achievements_count}</small>
                  <small>Insignias requeridas: {frame.required_badges_count}</small>
                </div>

                <div className="frame-status-line">
                  {frame.is_equipped
                    ? 'Equipado actualmente'
                    : frame.is_unlocked
                    ? 'Desbloqueado'
                    : 'Bloqueado'}
                </div>
              </div>
            ))}
          </div>
        )}

        {unlockedFrames.length > 0 && (
          <div className="frame-unlocked-summary">
            <strong>Marcos desbloqueados:</strong> {unlockedFrames.length}
          </div>
        )}
      </div>

      {canAssignBadges && (
        <div className="progress-section-card teacher-badge-panel">
          <div className="progress-section-head">
            <h3>Asignar insignia</h3>
            <p>Como maestro, puedes otorgar una insignia especial a este estudiante.</p>
          </div>

          <div className="badge-assignment-form">
            <div className="input-group-custom">
              <label>Selecciona una insignia</label>
              <select
                className="form-control"
                value={selectedBadgeId}
                onChange={(e) => setSelectedBadgeId(e.target.value)}
              >
                <option value="">Selecciona una insignia...</option>
                {badgeDefinitions.map((badge) => (
                  <option key={badge.id} value={badge.id}>
                    {badge.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group-custom">
              <label>Motivo de la asignación</label>
              <textarea
                className="form-control form-textarea"
                value={badgeReason}
                onChange={(e) => setBadgeReason(e.target.value)}
                placeholder="Describe por qué el estudiante merece esta insignia..."
              />
            </div>

            <button
              type="button"
              className="btn-submit"
              onClick={handleAssignBadge}
              disabled={assigningBadge}
            >
              {assigningBadge ? 'Asignando...' : 'Asignar insignia'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProgressPanel;

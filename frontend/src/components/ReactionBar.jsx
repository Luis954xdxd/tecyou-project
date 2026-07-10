import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const reactionOptions = [
  { key: 'like', label: 'Me gusta', emoji: '\u{1F44D}' },
  { key: 'celebrate', label: 'Excelente', emoji: '\u{1F389}' },
  { key: 'inspire', label: 'Inspirador', emoji: '\u{1F4A1}' },
  { key: 'love', label: 'Agradezco', emoji: '\u2764\uFE0F' },
];

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 2.3 1.5 4 3 5.5l7 7z" />
    </svg>
  );
}

export default function ReactionBar({
  recId,
  userId,
  initialTotals,
  initialUserReaction,
  initialUsers,
  onReactionChange,
  resolveImageUrl,
  openUserProfile,
  openSignal = 0,
  openPanelSignal = 0,
  closeSignal = '',
  hideMainButton = false,
}) {
  const [totals, setTotals] = useState(initialTotals || { like: 0, celebrate: 0, inspire: 0, love: 0 });
  const [userReaction, setUserReaction] = useState(initialUserReaction || null);
  const [usersList, setUsersList] = useState(initialUsers || []);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [reacting, setReacting] = useState(false);

  const selectedMeta = reactionOptions.find((reaction) => reaction.key === userReaction) || null;

  useEffect(() => {
    if (openSignal) setPickerOpen(true);
  }, [openSignal]);

  useEffect(() => {
    setTotals(initialTotals || { like: 0, celebrate: 0, inspire: 0, love: 0 });
    setUsersList(initialUsers || []);
    setUserReaction(initialUserReaction || null);
  }, [initialTotals, initialUsers, initialUserReaction]);

  useEffect(() => {
    if (openPanelSignal) setPanelOpen(true);
  }, [openPanelSignal]);

  useEffect(() => {
    setPickerOpen(false);
    setPanelOpen(false);
  }, [closeSignal]);

  const handleReact = async (reactionKey) => {
    if (!userId) return;
    try {
      setReacting(true);
      await axios.post(`${API_BASE}/api/recognitions/${recId}/react`, {
        user_id: userId,
        reaction_type: reactionKey,
      });

      const res = await axios.get(`${API_BASE}/api/recognitions/${recId}/reactions`, { params: { userId } });
      const newTotals = { like: 0, celebrate: 0, inspire: 0, love: 0 };
      (res.data?.totals || []).forEach((item) => {
        if (newTotals[item.reaction_type] !== undefined) {
          newTotals[item.reaction_type] = Number(item.total) || 0;
        }
      });

      const newUsers = res.data?.users || [];
      const newUserReaction =
        newUsers.find((item) => Number(item.user_id) === Number(userId))?.reaction_type || null;

      setTotals(newTotals);
      setUsersList(newUsers);
      setUserReaction(newUserReaction);
      if (onReactionChange) onReactionChange(recId, newTotals, newUsers, newUserReaction);
    } catch (err) {
      console.error('Error al reaccionar:', err);
    } finally {
      setReacting(false);
      setPickerOpen(false);
    }
  };

  return (
    <div className="reaction-block">
      <div className="reaction-picker-stable">
        {!hideMainButton && (
          <button
            type="button"
            className={`reaction-main-btn ${selectedMeta ? 'active' : ''}`}
            disabled={reacting}
            onClick={() => setPickerOpen((prev) => !prev)}
          >
            <span className="reaction-main-icon">
              <HeartIcon filled={Boolean(selectedMeta)} />
            </span>
            <span>{reacting ? 'Guardando...' : selectedMeta ? selectedMeta.label : 'Reaccionar'}</span>
          </button>
        )}

        {pickerOpen && !reacting && (
          <div className="reaction-picker-panel">
            <div className="reaction-picker-panel-header">
              <strong>Selecciona una reaccion</strong>
              <button type="button" className="reaction-picker-close" onClick={() => setPickerOpen(false)}>
                {'\u00D7'}
              </button>
            </div>
            <div className="reaction-picker-options">
              {reactionOptions.map((reaction) => (
                <button
                  key={reaction.key}
                  type="button"
                  className={`reaction-option-stable ${userReaction === reaction.key ? 'selected' : ''}`}
                  onClick={() => handleReact(reaction.key)}
                >
                  <span className="reaction-option-stable-emoji">{reaction.emoji}</span>
                  <span className="reaction-option-stable-label">{reaction.label}</span>
                </button>
              ))}
            </div>
            <small className="reaction-picker-hint">Toca la misma reaccion otra vez para quitarla.</small>
          </div>
        )}
      </div>

      <div className="reaction-meta-row">
        <button type="button" className="reaction-summary-btn" onClick={() => setPanelOpen((prev) => !prev)}>
          <span className="reaction-summary-stack">
            {reactionOptions
              .filter((reaction) => Number(totals[reaction.key] || 0) > 0)
              .slice(0, 3)
              .map((reaction) => (
                <span key={reaction.key}>{reaction.emoji}</span>
              ))}
          </span>
          <strong>{Object.values(totals).reduce((sum, total) => sum + Number(total || 0), 0)}</strong>
        </button>
      </div>

      {panelOpen && (
        <div className="reaction-users-panel">
          {usersList.length === 0 ? (
            <p className="reaction-users-empty">Aun no hay reacciones.</p>
          ) : (
            <div className="reaction-users-list">
              {usersList.map((person, index) => (
                <div key={`${person.user_id}-${index}`} className="reaction-user-item">
                  {person.profile_image_url ? (
                    <img
                      src={resolveImageUrl(person.profile_image_url)}
                      alt={person.user_name}
                      className="reaction-user-avatar"
                    />
                  ) : (
                    <div className="reaction-user-avatar-fallback">
                      {(person.user_name || 'TSJ')
                        .split(' ')
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="reaction-user-meta">
                    <button
                      type="button"
                      className="inline-user-link reaction-user-link"
                      onClick={() => openUserProfile(person.user_id)}
                    >
                      {person.user_name}
                    </button>
                    <span>
                      {reactionOptions.find((reaction) => reaction.key === person.reaction_type)?.emoji}{' '}
                      {reactionOptions.find((reaction) => reaction.key === person.reaction_type)?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const reactionOptions = [
  { key: 'like',      label: 'Me gusta',  emoji: '👍' },
  { key: 'celebrate', label: 'Excelente', emoji: '🎉' },
  { key: 'inspire',   label: 'Inspirador',emoji: '💡' },
  { key: 'love',      label: 'Agradezco', emoji: '❤️' },
];

export default function ReactionBar({ recId, userId, initialTotals, initialUserReaction, initialUsers, onReactionChange, resolveImageUrl, openUserProfile }) {
  const [totals, setTotals]               = useState(initialTotals   || { like:0, celebrate:0, inspire:0, love:0 });
  const [userReaction, setUserReaction]   = useState(initialUserReaction || null);
  const [usersList, setUsersList]         = useState(initialUsers    || []);
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [panelOpen, setPanelOpen]         = useState(false);
  const [reacting, setReacting]           = useState(false);

  const selectedMeta = reactionOptions.find(r => r.key === userReaction) || null;

  const handleReact = async (reactionKey) => {
    if (!userId) return;
    try {
      setReacting(true);
      await axios.post(`${API_BASE}/api/recognitions/${recId}/react`, {
        user_id: userId,
        reaction_type: reactionKey,
      });
      // Refrescar reacciones solo de esta tarjeta
      const res = await axios.get(`${API_BASE}/api/recognitions/${recId}/reactions`);
      const newTotals = { like:0, celebrate:0, inspire:0, love:0 };
      (res.data?.totals || []).forEach(item => {
        if (newTotals[item.reaction_type] !== undefined)
          newTotals[item.reaction_type] = Number(item.total) || 0;
      });
      const newUsers = res.data?.users || [];
      setTotals(newTotals);
      setUsersList(newUsers);
      setUserReaction(
        newUsers.find(u => Number(u.user_id) === Number(userId))?.reaction_type || null
      );
      if (onReactionChange) onReactionChange(recId, newTotals, newUsers);
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
        <button
          type="button"
          className={`reaction-main-btn ${selectedMeta ? 'active' : ''}`}
          disabled={reacting}
          onClick={() => setPickerOpen(prev => !prev)}
        >
          <span className="reaction-main-icon">{selectedMeta ? selectedMeta.emoji : '✨'}</span>
          <span>{reacting ? 'Guardando...' : selectedMeta ? selectedMeta.label : 'Reaccionar'}</span>
        </button>

        {pickerOpen && !reacting && (
          <div className="reaction-picker-panel">
            <div className="reaction-picker-panel-header">
              <strong>Selecciona una reacción</strong>
              <button type="button" className="reaction-picker-close" onClick={() => setPickerOpen(false)}>✕</button>
            </div>
            <div className="reaction-picker-options">
              {reactionOptions.map(reaction => (
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
            <small className="reaction-picker-hint">Toca la misma reacción otra vez para quitarla.</small>
          </div>
        )}
      </div>

      <div className="reaction-meta-row">
        <div className="reaction-counts">
          {reactionOptions.map(reaction => (
            <div key={reaction.key} className={`reaction-chip ${userReaction === reaction.key ? 'selected' : ''}`}>
              <span>{reaction.emoji}</span>
              <strong>{totals[reaction.key] || 0}</strong>
            </div>
          ))}
        </div>
        <button type="button" className="reaction-details-btn" onClick={() => setPanelOpen(prev => !prev)}>
          {panelOpen ? 'Ocultar reacciones' : 'Ver quién reaccionó'}
        </button>
      </div>

      {panelOpen && (
        <div className="reaction-users-panel">
          {usersList.length === 0 ? (
            <p className="reaction-users-empty">Aún no hay reacciones.</p>
          ) : (
            <div className="reaction-users-list">
              {usersList.map((person, i) => (
                <div key={`${person.user_id}-${i}`} className="reaction-user-item">
                  {person.profile_image_url ? (
                    <img src={resolveImageUrl(person.profile_image_url)} alt={person.user_name} className="reaction-user-avatar" />
                  ) : (
                    <div className="reaction-user-avatar-fallback">
                      {(person.user_name || 'TSJ').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                    </div>
                  )}
                  <div className="reaction-user-meta">
                    <button type="button" className="inline-user-link reaction-user-link" onClick={() => openUserProfile(person.user_id)}>
                      {person.user_name}
                    </button>
                    <span>
                      {reactionOptions.find(r => r.key === person.reaction_type)?.emoji}{' '}
                      {reactionOptions.find(r => r.key === person.reaction_type)?.label}
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
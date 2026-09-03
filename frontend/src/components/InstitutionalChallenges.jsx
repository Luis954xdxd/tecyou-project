import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Upload, Award } from 'lucide-react';

const API_BASE = 'http://localhost:5000';
const mediaUrl = (value) => value?.startsWith('http') ? value : `${API_BASE}${value || ''}`;

function InstitutionalChallenges({ onCompleted }) {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/challenges`);
      setItems(response.data.challenges || []);
    } catch (error) {
      console.error('No se pudieron cargar los retos institucionales:', error);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let clearHashTimer;
    const focusChallengeFromHash = () => {
      if (!window.location.hash.startsWith('#institutional-challenge-')) return;
      const target = document.getElementById(window.location.hash.slice(1));
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('is-notification-target');
      clearHashTimer = window.setTimeout(() => {
        target.classList.remove('is-notification-target');
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}${window.location.search}`
        );
      }, 1600);
    };

    focusChallengeFromHash();
    window.addEventListener('hashchange', focusChallengeFromHash);
    return () => {
      window.removeEventListener('hashchange', focusChallengeFromHash);
      window.clearTimeout(clearHashTimer);
    };
  }, [items]);

  const selectEvidence = (id) => {
    setActiveId(id);
    setMessage('');
    setTimeout(() => inputRef.current?.click(), 0);
  };

  const complete = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !activeId) return;
    const data = new FormData();
    data.append('evidence', file);
    setSavingId(activeId);
    try {
      const response = await axios.post(`${API_BASE}/api/challenges/${activeId}/complete`, data);
      setMessage(`¡Reto completado! Ganaste ${response.data.points_awarded} puntos.`);
      await load();
      await onCompleted?.();
    } catch (error) {
      setMessage(error.response?.data?.error || 'No se pudo subir la evidencia.');
    } finally {
      setSavingId(null);
      event.target.value = '';
    }
  };

  if (!items.length) return null;
  return (
    <section className="institutional-challenges">
      <div className="institutional-challenges-title">
        <div><span>Publicaciones institucionales</span><small>Completa actividades y acumula puntos.</small></div>
        <strong><Award size={17} /> {items[0]?.user_total_points || 0} puntos</strong>
      </div>
      {message && <div className="institutional-challenge-message">{message}</div>}
      <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" onChange={complete} />
      {items.map((item) => (
        <article
          id={`institutional-challenge-${item.id}`}
          className="institutional-challenge-card"
          key={item.id}
        >
          <div className="institutional-challenge-meta">
            <span>Institucional</span><strong>+{item.points} puntos</strong>
          </div>
          <h3>{item.creator_name}</h3>
          <p>{item.content}</p>
          {item.media_url && (item.media_type === 'video'
            ? <video src={mediaUrl(item.media_url)} controls preload="metadata" />
            : <img src={mediaUrl(item.media_url)} alt="Contenido de la publicación institucional" />)}
          <div className="institutional-challenge-action">
            {item.completed ? (
              <span className="institutional-completed"><CheckCircle2 size={18} /> Completado</span>
            ) : (
              <button type="button" onClick={() => selectEvidence(item.id)} disabled={savingId === item.id}>
                <Upload size={18} /> {savingId === item.id ? 'Subiendo evidencia...' : 'Lo completé'}
              </button>
            )}
            <small>Se requiere una imagen o video como evidencia.</small>
          </div>
        </article>
      ))}
    </section>
  );
}

export default InstitutionalChallenges;

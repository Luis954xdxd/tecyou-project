import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FramedAvatar from './FramedAvatar';

const API_BASE = 'http://localhost:5000';

// Máximo de usuarios visibles en el carrusel del feed.
// El resto se ven en la página completa /usuarios.
const CAROUSEL_LIMIT = 20;

function UsersDirectory({ currentUserId, onUserSelected, onOpenProfile }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [processingFollowId, setProcessingFollowId] = useState(null);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // ── Datos ──────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(
        `${API_BASE}/api/users/all?currentUserId=${currentUserId}`
      );
      const filtered = (response.data || [])
        .filter((u) => Number(u.id) !== Number(currentUserId))
        .slice(0, CAROUSEL_LIMIT);
      setUsers(filtered);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchUsers();
  }, [currentUserId]);

  // ── Seguir / dejar de seguir ───────────────────────────────────────────────

  const handleFollowToggle = async (targetUser, e) => {
    e.stopPropagation();
    try {
      setProcessingFollowId(targetUser.id);

      if (targetUser.is_following) {
        await axios.delete(`${API_BASE}/api/users/${targetUser.id}/follow`, {
          data: { follower_id: currentUserId },
        });
      } else {
        await axios.post(`${API_BASE}/api/users/${targetUser.id}/follow`, {
          follower_id: currentUserId,
        });
      }

      // Actualizar solo el usuario tocado sin re-fetch completo.
      // Así la tarjeta no parpadea ni se reordena.
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, is_following: !u.is_following } : u
        )
      );
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      alert(error.response?.data?.error || 'No se pudo actualizar el seguimiento.');
    } finally {
      setProcessingFollowId(null);
    }
  };

  // ── Scroll con flechas ─────────────────────────────────────────────────────

  const scrollBy = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section id="users-directory-section" className="users-carousel-section">

      {/* ── Encabezado ── */}
      <div className="users-carousel-header">
        <div>
          <p className="section-label">Comunidad</p>
          <h2>Usuarios en la plataforma</h2>
        </div>

        <div className="users-carousel-header-actions">
          {/* Flechas de desplazamiento */}
          <button
            type="button"
            className="carousel-arrow-btn"
            onClick={() => scrollBy('left')}
            aria-label="Desplazar izquierda"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow-btn"
            onClick={() => scrollBy('right')}
            aria-label="Desplazar derecha"
          >
            ›
          </button>

          {/* Atajo a la página completa */}
          <button
            type="button"
            className="users-carousel-see-all-btn"
            onClick={() => navigate('/usuarios')}
          >
            Ver todos →
          </button>
        </div>
      </div>

      {/* ── Carrusel ── */}
      <div className="users-carousel-track-wrapper">
        {loadingUsers ? (
          <div className="users-carousel-loading">
            <div className="loading-spinner" />
            <span>Cargando usuarios...</span>
          </div>
        ) : (
          <div className="users-carousel-track" ref={scrollRef}>

            {users.map((user) => (
              <div key={user.id} className="users-carousel-card">
                {/* Avatar → abre perfil */}
                <button
                  type="button"
                  className="carousel-card-avatar-btn"
                  onClick={() => onOpenProfile(user.id)}
                  aria-label={`Ver perfil de ${user.display_name || user.fullname}`}
                >
                  <FramedAvatar
                    imageUrl={user.profile_image_url}
                    name={user.display_name || user.fullname}
                    frameCode={user.equipped_frame_code}
                    sizeClass="size-carousel"
                  />
                </button>

                {/* Nombre */}
                <button
                  type="button"
                  className="carousel-card-name"
                  onClick={() => onOpenProfile(user.id)}
                >
                  {user.display_name || user.fullname}
                </button>

                {/* Identificador corto */}
                <span className="carousel-card-email">
                  @{user.email?.split('@')[0]}
                </span>

                {/* Seguir / Siguiendo */}
                <button
                  type="button"
                  className={`carousel-follow-btn ${user.is_following ? 'following' : ''}`}
                  onClick={(e) => handleFollowToggle(user, e)}
                  disabled={processingFollowId === user.id}
                >
                  {processingFollowId === user.id
                    ? '...'
                    : user.is_following
                    ? '✓ Siguiendo'
                    : 'Seguir'}
                </button>
              </div>
            ))}

            {/* Tarjeta final: explorar todos */}
            <div className="users-carousel-card carousel-end-card">
              <div className="carousel-end-icon">👥</div>
              <p className="carousel-end-text">Conoce a toda la comunidad TSJ</p>
              <button
                type="button"
                className="carousel-follow-btn"
                onClick={() => navigate('/usuarios')}
              >
                Explorar comunidad
              </button>
            </div>

          </div>
        )}
      </div>
    </section>
  );
}

export default UsersDirectory;
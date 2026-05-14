import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FramedAvatar from '../components/FramedAvatar';

const API_BASE = 'http://localhost:5000';

/**
 * UsersPage — Página completa de la comunidad.
 *
 * Accesible desde:
 *  - El ícono de persona en el navbar
 *  - El botón "Ver todos" / "Explorar comunidad" del carrusel UsersDirectory
 *
 * Props:
 *  - currentUserId : id del usuario logueado
 *  - onOpenProfile : función que abre el modal de perfil público
 *  - onUserSelected: función que preselecciona un usuario en el formulario
 *                    de reconocimiento (opcional, si se llama desde el feed)
 */
function UsersPage({ currentUserId, onOpenProfile, onUserSelected }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingFollowId, setProcessingFollowId] = useState(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  // ── Datos ──────────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(
        `${API_BASE}/api/users/all?currentUserId=${currentUserId}`
      );
      const filtered = (response.data || []).filter(
        (u) => Number(u.id) !== Number(currentUserId)
      );
      setUsers(filtered);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
      // Enfocar el buscador al entrar
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [currentUserId]);

  // ── Filtrado local por nombre / correo / número de control ────────────────

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.display_name || u.fullname || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      // El número de control es la parte del correo antes del @
      const control = email.split('@')[0];
      return name.includes(q) || email.includes(q) || control.includes(q);
    });
  }, [users, searchTerm]);

  // ── Seguir / dejar de seguir ───────────────────────────────────────────────

  const handleFollowToggle = async (targetUser) => {
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

      // Actualizar localmente sin re-fetch
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

  // ── Estadísticas rápidas ───────────────────────────────────────────────────

  const followingCount = users.filter((u) => u.is_following).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="users-page-shell">

      {/* ── Barra superior ── */}
      <header className="users-page-topbar">
        <button
          type="button"
          className="users-page-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </button>

        <div className="users-page-topbar-title">
          <span className="section-label">Comunidad TSJ</span>
          <h1>Directorio de usuarios</h1>
        </div>

        <div className="users-page-topbar-stats">
          <div className="users-page-stat">
            <strong>{users.length}</strong>
            <span>usuarios</span>
          </div>
          <div className="users-page-stat">
            <strong>{followingCount}</strong>
            <span>siguiendo</span>
          </div>
        </div>
      </header>

      {/* ── Buscador ── */}
      <div className="users-page-search-wrapper">
        <div className="users-page-search-box">
          <span className="users-page-search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            className="users-page-search-input"
            placeholder="Buscar por nombre o número de control..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="users-page-search-clear"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>

        {searchTerm && (
          <p className="users-page-search-result-count">
            {filteredUsers.length === 0
              ? 'Sin resultados para esa búsqueda'
              : `${filteredUsers.length} resultado${filteredUsers.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {/* ── Grid de usuarios ── */}
      <div className="users-page-content">
        {loadingUsers ? (
          <div className="users-page-loading">
            <div className="loading-spinner" />
            <p>Cargando comunidad...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-page-empty">
            <div className="empty-icon">👤</div>
            <h3>No se encontraron usuarios</h3>
            <p>Intenta con otro nombre o número de control.</p>
          </div>
        ) : (
          <div className="users-page-grid">
            {filteredUsers.map((user) => (
              <div key={user.id} className="users-page-card">

                {/* Portada decorativa */}
                <div className="users-page-card-cover" />

                {/* Avatar */}
                <div className="users-page-card-avatar">
                  <button
                    type="button"
                    className="users-page-avatar-btn"
                    onClick={() => onOpenProfile(user.id)}
                    aria-label={`Ver perfil de ${user.display_name || user.fullname}`}
                  >
                    <FramedAvatar
                      imageUrl={user.profile_image_url}
                      name={user.display_name || user.fullname}
                      frameCode={user.equipped_frame_code}
                      sizeClass="size-users-page"
                    />
                  </button>
                </div>

                {/* Info */}
                <div className="users-page-card-body">
                  <button
                    type="button"
                    className="users-page-card-name"
                    onClick={() => onOpenProfile(user.id)}
                  >
                    {user.display_name || user.fullname}
                    {user.is_verified && (
                      <span className="users-page-verified" title="Verificado">✔</span>
                    )}
                  </button>

                  <span className="users-page-card-handle">
                    @{user.email?.split('@')[0]}
                  </span>

                  {user.bio && (
                    <p className="users-page-card-bio">{user.bio}</p>
                  )}

                  {Array.isArray(user.tags) && user.tags.length > 0 && (
                    <div className="users-page-card-tags">
                      {user.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="users-page-card-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="users-page-card-actions">
                  <button
                    type="button"
                    className={`users-page-follow-btn ${user.is_following ? 'following' : ''}`}
                    onClick={() => handleFollowToggle(user)}
                    disabled={processingFollowId === user.id}
                  >
                    {processingFollowId === user.id
                      ? 'Procesando...'
                      : user.is_following
                      ? '✓ Siguiendo'
                      : 'Seguir'}
                  </button>

                  {onUserSelected && (
                    <button
                      type="button"
                      className="users-page-recognize-btn"
                      onClick={() => {
                        onUserSelected(user);
                        navigate(-1);
                      }}
                    >
                      Reconocer
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UsersPage;
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import FramedAvatar from './FramedAvatar';

const API_BASE = 'http://localhost:5000';

function UsersDirectory({ currentUserId, onUserSelected, onOpenProfile }) {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [processingFollowId, setProcessingFollowId] = useState(null);

 

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(
        `${API_BASE}/api/users/all?currentUserId=${currentUserId}`
      );

      const filtered = response.data.filter(
        (user) => Number(user.id) !== Number(currentUserId)
      );

      setUsers(filtered);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFollowing = async () => {
    try {
      setLoadingFollowing(true);
      const response = await axios.get(
        `${API_BASE}/api/users/${currentUserId}/following`
      );
      setFollowing(response.data);
    } catch (error) {
      console.error('Error al obtener seguidos:', error);
    } finally {
      setLoadingFollowing(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
      fetchFollowing();
    }
  }, [currentUserId]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      return (
        user.display_name?.toLowerCase().includes(query) ||
        user.fullname?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    });
  }, [users, searchTerm]);

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

      await fetchUsers();
      await fetchFollowing();
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      alert(error.response?.data?.error || 'No se pudo actualizar el seguimiento.');
    } finally {
      setProcessingFollowId(null);
    }
  };

  return (
    <section id="users-directory-section" className="users-directory-section">
      <div className="users-directory-card">
        <div className="users-directory-header">
          <div>
            <p className="section-label">Comunidad</p>
            <h2>Usuarios de la plataforma</h2>
          </div>
          <p className="users-directory-subtext">
            Busca personas, síguelas y selecciónalas más rápido para futuros reconocimientos.
          </p>
        </div>

        <div className="users-directory-search">
          <input
            type="text"
            placeholder="Buscar usuarios por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="users-directory-layout">
          <div className="users-directory-list-box">
            <div className="users-directory-box-header">
              <h3>Todos los usuarios</h3>
              <span>{loadingUsers ? 'Cargando...' : filteredUsers.length}</span>
            </div>

            <div className="users-directory-list">
              {filteredUsers.length === 0 ? (
                <div className="users-empty-state">
                  <p>No se encontraron usuarios.</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="directory-user-card">
                    <div className="directory-user-main">
                      <FramedAvatar
                      imageUrl={user.profile_image_url}
                      name={user.display_name || user.fullname}
                      frameCode={user.equipped_frame_code}
                      sizeClass="size-directory"
                      />

                      <div className="directory-user-meta">
                        <button
                          type="button"
                          className="inline-user-link reaction-user-link"
                          onClick={() => onOpenProfile(user.id)}
                        >
                          {user.display_name || user.fullname}
                        </button>
                        <span>{user.email}</span>
                        {user.bio && <small>{user.bio}</small>}
                      </div>
                    </div>

                    <div className="directory-user-actions">
                      <button
                        type="button"
                        className={`follow-btn ${user.is_following ? 'following' : ''}`}
                        onClick={() => handleFollowToggle(user)}
                        disabled={processingFollowId === user.id}
                      >
                        {processingFollowId === user.id
                          ? 'Procesando...'
                          : user.is_following
                          ? 'Siguiendo'
                          : 'Seguir'}
                      </button>

                      <button
                        type="button"
                        className="recognize-quick-btn"
                        onClick={() => onUserSelected(user)}
                      >
                        Reconocer
                      </button>

                      <button
                        type="button"
                        className="recognize-quick-btn"
                        onClick={() => onOpenProfile(user.id)}
                      >
                        Ver perfil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="users-directory-list-box">
            <div className="users-directory-box-header">
              <h3>Usuarios seguidos</h3>
              <span>{loadingFollowing ? 'Cargando...' : following.length}</span>
            </div>

            <div className="users-directory-list">
              {following.length === 0 ? (
                <div className="users-empty-state">
                  <p>Aún no sigues a nadie.</p>
                </div>
              ) : (
                following.map((user) => (
                  <div key={user.id} className="directory-user-card compact">
                    <div className="directory-user-main">
                      <FramedAvatar
                      imageUrl={user.profile_image_url}
                      name={user.display_name || user.fullname}
                      frameCode={user.equipped_frame_code}
                      sizeClass="size-directory"
                      />

                      <div className="directory-user-meta">
                        <button
                          type="button"
                          className="inline-user-link reaction-user-link"
                          onClick={() => onOpenProfile(user.id)}
                        >
                          {user.display_name || user.fullname}
                        </button>
                        <span>{user.email}</span>
                      </div>
                    </div>

                    <div className="directory-user-actions">
                      <button
                        type="button"
                        className="recognize-quick-btn"
                        onClick={() => onUserSelected(user)}
                      >
                        Reconocer
                      </button>

                      <button
                        type="button"
                        className="recognize-quick-btn"
                        onClick={() => onOpenProfile(user.id)}
                      >
                        Ver perfil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UsersDirectory;
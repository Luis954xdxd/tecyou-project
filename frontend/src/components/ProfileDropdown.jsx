import React, { useState, useRef } from 'react';
import FramedAvatar from './FramedAvatar';

function ProfileDropdown({
  user,
  displayName,
  profileImage,
  getInitials,
  openEditProfileModal,
  fileInputRef,
  onLogout,
  onGoToProfile,
  darkMode,
  onToggleDark,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300);
  };

  return (
    <div
      className="nav-profile-menu-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="nav-profile-trigger" type="button">
        <FramedAvatar
          imageUrl={profileImage || user?.profile_image_url}
          name={displayName || user?.display_name || user?.fullname}
          frameCode={user?.equipped_frame_code}
          sizeClass="size-nav"
        />
      </button>

      {isOpen && (
        <div className="nav-profile-dropdown">
          <div className="nav-profile-dropdown-header">
            <FramedAvatar
              imageUrl={profileImage || user?.profile_image_url}
              name={displayName || user?.display_name || user?.fullname}
              frameCode={user?.equipped_frame_code}
              sizeClass="size-activity"
              className="nav-dropdown-framed-avatar"
            />

            <div className="nav-dropdown-userinfo">
              <strong>{displayName || user?.display_name || user?.fullname}</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="nav-dropdown-status">
            ● Activo en la plataforma
          </div>

          <div className="nav-dropdown-actions">
            <button
              className="nav-dropdown-btn"
              onClick={() => {
                setIsOpen(false);
                openEditProfileModal();
              }}
            >
              Editar perfil
            </button>

            <button
              className="nav-dropdown-btn"
              onClick={() => {
                setIsOpen(false);
                fileInputRef.current?.click();
              }}
            >
              Cambiar foto
            </button>

            <button
              className="nav-dropdown-btn"
              onClick={() => {
                onToggleDark();
                setIsOpen(false);
              }}
            >
              {darkMode ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>

            <button
              className="nav-dropdown-btn"
              onClick={() => {
                setIsOpen(false);
                onGoToProfile();
              }}
            >
              Ir al perfil
            </button>

            <button
              className="nav-dropdown-btn danger"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
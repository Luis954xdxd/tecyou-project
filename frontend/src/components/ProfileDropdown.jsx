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
  onGoToAdmin,
  darkMode,
  onToggleDark,
  hideAvatarFrames,
  onToggleAvatarFrames,
  hasStory = false,
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
          frameCode={hideAvatarFrames ? null : user?.equipped_frame_code}
          sizeClass="size-nav"
          hasStory={hasStory}
        />
      </button>

      {isOpen && (
        <div className="nav-profile-dropdown">
          <div className="nav-profile-dropdown-header">
            <FramedAvatar
              imageUrl={profileImage || user?.profile_image_url}
              name={displayName || user?.display_name || user?.fullname}
              frameCode={hideAvatarFrames ? null : user?.equipped_frame_code}
              sizeClass="size-activity"
              className="nav-dropdown-framed-avatar"
              hasStory={hasStory}
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
            {user?.system_role === 'super_admin' && (
              <button
                className="nav-dropdown-btn"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onGoToAdmin();
                }}
              >
                Panel institucional
              </button>
            )}

            <button
              className="nav-dropdown-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                openEditProfileModal();
              }}
            >
              Editar perfil
            </button>

            <button
              className="nav-dropdown-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                fileInputRef.current?.click();
              }}
            >
              Cambiar foto
            </button>

            <button
              className="nav-dropdown-btn"
              type="button"
              onClick={() => {
                onToggleDark();
                setIsOpen(false);
              }}
            >
              {darkMode ? '☀️ Modo claro' : '🌙 Modo oscuro'}
            </button>

            <button
              className="nav-dropdown-btn"
              type="button"
              onClick={() => {
                onToggleAvatarFrames();
                setIsOpen(false);
              }}
            >
              {hideAvatarFrames ? '🖼️ Mostrar marcos' : '🚫 Ocultar marcos'}
            </button>

            <button
              className="nav-dropdown-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onGoToProfile();
              }}
            >
              Ir al perfil
            </button>

            <button
              className="nav-dropdown-btn danger"
              type="button"
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

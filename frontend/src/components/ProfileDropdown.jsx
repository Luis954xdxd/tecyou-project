import React, { useState, useRef } from 'react';

function ProfileDropdown({ user, displayName, profileImage, getInitials, openEditProfileModal, fileInputRef, onLogout, onGoToProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // 300ms de gracia antes de cerrar
  };

  return (
    <div
      className="nav-profile-menu-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="nav-profile-trigger">
        {profileImage ? (
          <img src={profileImage} alt={displayName} className="nav-profile-image" />
        ) : (
          <div className="nav-profile-image nav-dropdown-avatar-fallback">
            {getInitials(displayName || user?.fullname)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="nav-profile-dropdown">
          <div className="nav-profile-dropdown-header">
            {profileImage ? (
              <img src={profileImage} alt={displayName} className="nav-dropdown-avatar" />
            ) : (
              <div className="nav-dropdown-avatar-fallback">
                {getInitials(displayName || user?.fullname)}
              </div>
            )}
            <div className="nav-dropdown-userinfo">
              <strong>{displayName || user?.fullname}</strong>
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="nav-dropdown-status">
            ● Activo en la plataforma
          </div>

          <div className="nav-dropdown-actions">
            <button className="nav-dropdown-btn" onClick={() => {
              setIsOpen(false);
              openEditProfileModal();
            }}>
              Editar perfil
            </button>

            <button className="nav-dropdown-btn" onClick={() => {
              setIsOpen(false);
              fileInputRef.current?.click();
            }}>
              Cambiar foto
            </button>

            <button className="nav-dropdown-btn" onClick={() => {
              setIsOpen(false);
              onGoToProfile();
            }}>
              Ir al perfil
            </button>

            <button className="nav-dropdown-btn danger" onClick={() => {
              setIsOpen(false);
              onLogout();
            }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
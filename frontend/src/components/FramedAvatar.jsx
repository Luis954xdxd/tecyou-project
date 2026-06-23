import React from 'react';

import copperFrame from '../assets/frames/copper-frame.png';
import silverFrame from '../assets/frames/silver-frame.png';
import goldFrame from '../assets/frames/gold-frame.png';
import crimsonRubyFrame from '../assets/frames/crimson-ruby-frame.png';
import diamondFrame from '../assets/frames/diamond-frame.png';

const API_BASE = 'http://localhost:5000';

function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

function getFrameAsset(frameCode) {
  switch (frameCode) {
    case 'copper_frame':
      return copperFrame;
    case 'silver_frame':
      return silverFrame;
    case 'gold_frame':
      return goldFrame;
    case 'crimson_ruby_frame':
      return crimsonRubyFrame;
    case 'diamond_frame':
      return diamondFrame;
    default:
      return null;
  }
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function FramedAvatar({
  imageUrl,
  name,
  frameCode,
  sizeClass = 'size-directory',
  className = '',
  hasStory = false,
  showPreview = false,
}) {
  const finalImage = resolveImageUrl(imageUrl);

  // ARREGLO AQUÍ:
  // Primero obtenemos el marco.
  const frameAsset = getFrameAsset(frameCode);

  // ARREGLO AQUÍ:
  // Después revisamos si existe marco.
  const hasFrame = Boolean(frameAsset);

  return (
    <div
      className={`framed-avatar ${sizeClass} ${className} ${
        !hasFrame ? 'avatar-no-frame' : ''
      } ${hasStory ? 'has-story-ring' : ''} ${showPreview ? 'has-profile-preview' : ''}`.trim()}
    >
      <div
        className={`framed-avatar-circle ${
          !hasFrame ? 'framed-avatar-circle-no-frame' : ''
        }`}
      >
        {finalImage ? (
          <img
            src={finalImage}
            alt={name || 'Avatar'}
            className="framed-avatar-image"
          />
        ) : (
          <div className="framed-avatar-fallback">
            {getInitials(name || 'TSJ')}
          </div>
        )}
      </div>

      {frameAsset && (
        <img
          src={frameAsset}
          alt="Marco"
          className={`framed-avatar-frame frame-${frameCode || 'default'}`}
        />
      )}

      {showPreview && (
        <div className="avatar-hover-card">
          <div className="avatar-hover-card-top">
            {finalImage ? (
              <img src={finalImage} alt={name || 'Avatar'} />
            ) : (
              <span>{getInitials(name || 'TSJ')}</span>
            )}
            <div>
              <strong>{name || 'Usuario Tec You'}</strong>
              <small>{hasStory ? 'Historia activa' : 'Ver perfil'}</small>
            </div>
          </div>
          <p>Reconoce, comparte y conecta con la comunidad TSJ.</p>
        </div>
      )}
    </div>
  );
}

export default FramedAvatar;

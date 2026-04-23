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
}) {
  const finalImage = resolveImageUrl(imageUrl);
  const frameAsset = getFrameAsset(frameCode);

  return (
    <div className={`framed-avatar ${sizeClass} ${className}`.trim()}>
      <div className="framed-avatar-circle">
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
    </div>
  );
}

export default FramedAvatar;
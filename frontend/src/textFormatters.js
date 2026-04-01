import React from 'react';

export function renderTextWithHashtags(text, onHashtagClick) {
  if (!text) return null;

  const parts = text.split(/(#[a-zA-Z0-9_]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('#')) {
      return (
        <span
          key={index}
          className="hashtag-link"
          onClick={() => onHashtagClick(part.replace('#', ''))}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}
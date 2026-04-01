import React, { useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

function StoryViewer({ storyViewer, onClose, onNext }) {
  const currentStory = storyViewer?.stories?.[storyViewer.currentIndex];

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  useEffect(() => {
    if (!currentStory) return;

    const timer = setTimeout(() => {
      onNext();
    }, currentStory.media_type === 'video' ? 10000 : 5000);

    return () => clearTimeout(timer);
  }, [currentStory, onNext]);

  if (!storyViewer?.isOpen || !currentStory) return null;

  const mediaSrc = resolveUrl(currentStory.media_url);

  console.log('Story actual:', currentStory);
  console.log('Story media_url:', currentStory.media_url);
  console.log('Story mediaSrc final:', mediaSrc);

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="story-viewer-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="story-viewer-header">
          <strong>
            {currentStory.display_name || currentStory.fullname || 'Historia'}
          </strong>
        </div>

        <div className="story-viewer-media-wrap">
          {currentStory.media_type === 'video' ? (
            <video
              src={mediaSrc}
              className="story-viewer-media"
              autoPlay
              muted
              playsInline
              controls
            />
          ) : (
            <img
              src={mediaSrc}
              alt="Historia"
              className="story-viewer-media"
              onError={(e) => {
                console.error('Error cargando historia:', mediaSrc);
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        {currentStory.text_content ? (
          <div className="story-viewer-text">
            {currentStory.text_content}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StoryViewer;
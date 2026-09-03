import React, { useEffect, useRef, useState } from 'react';

const API_BASE = 'http://localhost:5000';

function StoryAvatar({ src, name, hasUnseen }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const initial = String(name || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="story-avatar-ring" aria-label={hasUnseen ? 'Historia nueva' : 'Historia vista'}>
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name || 'Usuario'}
          className="story-avatar-image"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="story-avatar-fallback">{initial}</span>
      )}
    </div>
  );
}

function StoriesBar({
  groupedStories = [],
  currentUser,
  onOpenStory,
  onCreateStory,
  hideAvatarFrames,
}) {
  // Controla la diferencia entre click simple y doble click
  const clickTimeout = useRef(null);

  // Limpiar timeout si el componente se desmonta
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current);
      }
    };
  }, []);

  // Resolver URL de imagen
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  // Buscar historias del usuario actual
  const myStoriesGroup = groupedStories.find(
    (group) => Number(group.user_id) === Number(currentUser?.id)
  );

  // 1 CLICK → CREAR HISTORIA
  const handleOwnStoryClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
    }

    clickTimeout.current = setTimeout(() => {
      onCreateStory();
      clickTimeout.current = null;
    }, 250);
  };

  // 2 CLICK → VER HISTORIA
  const handleOwnStoryDoubleClick = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }

    if (myStoriesGroup?.stories?.length > 0) {
      onOpenStory(myStoriesGroup.stories, 0);
    }
  };

  return (
    <div className="stories-bar">
      {/* TU HISTORIA
          1 clic: crear historia
          2 clics: ver historia
      */}
      <button
        type="button"
        className="story-bubble story-card own-story-bubble"
        onClick={handleOwnStoryClick}
        onDoubleClick={handleOwnStoryDoubleClick}
        title="1 clic: crear historia | 2 clics: ver historia"
      >
        <div className="story-card-media own">
          <span className="story-card-media-fallback">
            {(currentUser?.display_name || currentUser?.fullname || 'U').trim().charAt(0).toUpperCase()}
          </span>
          {currentUser?.profile_image_url ? (
            <img
              src={resolveImageUrl(currentUser.profile_image_url)}
              alt="Tu foto de perfil"
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <span className="own-story-avatar-fallback">
              {(currentUser?.display_name || currentUser?.fullname || 'U').trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="story-add-plus">+</div>
        <span className="story-name">Crear historia</span>
      </button>

      {/* HISTORIAS ORDENADAS POR LA PUBLICACION MAS RECIENTE */}
      {groupedStories
        .map((group) => {
          const isOwnGroup = Number(group.user_id) === Number(currentUser?.id);
          const displayName =
            (isOwnGroup && 'Tu historia') ||
            group.display_name ||
            group.fullname ||
            'Usuario';
          const coverStory = group.stories?.at(-1);
          const avatar = resolveImageUrl(
            coverStory?.profile_image_url ||
            group.profile_image_url ||
            (isOwnGroup ? currentUser?.profile_image_url : null)
          );
          const firstUnseenIndex = group.stories.findIndex((story) => !story.has_viewed);
          const startIndex = firstUnseenIndex >= 0 ? firstUnseenIndex : 0;
          const hasUnseen = !isOwnGroup && firstUnseenIndex >= 0;

          return (
            <button
              key={group.user_id}
              type="button"
              className={`story-bubble story-card ${hasUnseen ? 'has-unseen' : 'is-seen'}`}
              onClick={() => onOpenStory(group.stories, startIndex)}
            >
              <div className="story-card-media">
                <span className="story-card-media-fallback">{displayName.charAt(0).toUpperCase()}</span>
                {coverStory?.media_type === 'video' ? (
                  <video src={resolveImageUrl(coverStory.media_url)} muted onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                ) : coverStory?.media_url ? (
                  <img src={resolveImageUrl(coverStory.media_url)} alt={displayName} onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                ) : null}
              </div>
              <StoryAvatar src={avatar} name={displayName} hasUnseen={hasUnseen} />

              <span className="story-name">{displayName}</span>
            </button>
          );
        })}
    </div>
  );
}

export default StoriesBar;

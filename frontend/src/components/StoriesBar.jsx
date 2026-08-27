import React, { useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5000';

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
          {myStoriesGroup?.stories?.at(-1)?.media_url ? (
            myStoriesGroup.stories.at(-1).media_type === 'video' ? (
              <video src={resolveImageUrl(myStoriesGroup.stories.at(-1).media_url)} muted />
            ) : (
              <img src={resolveImageUrl(myStoriesGroup.stories.at(-1).media_url)} alt="Tu historia" />
            )
          ) : currentUser?.profile_image_url ? (
            <img src={resolveImageUrl(currentUser.profile_image_url)} alt="Tu historia" />
          ) : null}
        </div>
        <div className="story-add-plus">+</div>
        <span className="story-name">Crear historia</span>
      </button>

      {/* HISTORIAS ORDENADAS POR LA PUBLICACION MAS RECIENTE */}
      {groupedStories
        .map((group) => {
          const avatar = resolveImageUrl(group.profile_image_url);
          const isOwnGroup = Number(group.user_id) === Number(currentUser?.id);
          const displayName =
            (isOwnGroup && 'Tu historia') ||
            group.display_name ||
            group.fullname ||
            'Usuario';
          const coverStory = group.stories?.at(-1);
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
                {coverStory?.media_type === 'video' ? (
                  <video src={resolveImageUrl(coverStory.media_url)} muted />
                ) : coverStory?.media_url ? (
                  <img src={resolveImageUrl(coverStory.media_url)} alt={displayName} />
                ) : null}
              </div>
              <div className="story-avatar-ring" aria-label={hasUnseen ? 'Historia nueva' : 'Historia vista'}>
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="story-avatar-image"
                  />
                ) : (
                  <div className="story-avatar-fallback">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <span className="story-name">{displayName}</span>
            </button>
          );
        })}
    </div>
  );
}

export default StoriesBar;

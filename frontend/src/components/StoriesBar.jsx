import React, { useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:5000';

function StoriesBar({
  groupedStories = [],
  currentUser,
  onOpenStory,
  onCreateStory,
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
        className="story-bubble own-story-bubble"
        onClick={handleOwnStoryClick}
        onDoubleClick={handleOwnStoryDoubleClick}
        title="1 clic: crear historia | 2 clics: ver historia"
      >
        <div className="story-avatar add-story-avatar">
          {myStoriesGroup?.profile_image_url ? (
            <img
              src={resolveImageUrl(myStoriesGroup.profile_image_url)}
              alt="Tu historia"
              className="story-avatar-image"
            />
          ) : (
            '+'
          )}
        </div>

        <span className="story-name">Tu historia</span>
      </button>

      {/* HISTORIAS DE OTROS USUARIOS */}
      {groupedStories
        .filter((group) => Number(group.user_id) !== Number(currentUser?.id))
        .map((group) => {
          const avatar = resolveImageUrl(group.profile_image_url);
          const displayName =
            group.display_name ||
            group.fullname ||
            'Usuario';

          return (
            <button
              key={group.user_id}
              type="button"
              className="story-bubble"
              onClick={() => onOpenStory(group.stories, 0)}
            >
              <div className="story-avatar-ring">
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
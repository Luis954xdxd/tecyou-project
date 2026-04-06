import React from 'react';

const API_BASE = 'http://localhost:5000';

function StoriesBar({
  groupedStories = [],
  currentUser,
  onOpenStory,
  onCreateStory,
}) {
  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const safeStories = Array.isArray(groupedStories) ? groupedStories : [];

  const otherUsersStories = safeStories.filter(
    (group) => Number(group.user_id) !== Number(currentUser?.id)
  );

  return (
    <div className="stories-bar">
      <button
        type="button"
        className="story-bubble own-story-bubble"
        onClick={onCreateStory}
      >
        <div className="story-avatar add-story-avatar">+</div>
        <span className="story-name">Tu historia</span>
      </button>

      {otherUsersStories.map((group) => {
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
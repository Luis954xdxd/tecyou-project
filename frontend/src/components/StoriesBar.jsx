import React from 'react';

const API_BASE = 'http://localhost:5000';

function StoriesBar({ stories, onOpenStoryViewer }) {
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const groupedStories = (Array.isArray(stories) ? stories : []).reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = {
        user_id: story.user_id,
        user_name: story.display_name || story.fullname || 'Usuario',
        profile_image_url: story.profile_image_url,
        items: [],
      };
    }

    acc[story.user_id].items.push(story);
    return acc;
  }, {});

  const storyGroups = Object.values(groupedStories);

  if (storyGroups.length === 0) {
    return (
      <div className="stories-empty">
        <p>Aún no hay historias activas.</p>
      </div>
    );
  }

  return (
    <div className="stories-bar">
      {storyGroups.map((group) => (
        <button
          key={group.user_id}
          type="button"
          className="story-bubble"
          onClick={() => onOpenStoryViewer(group.items, 0)}
        >
          <div className="story-avatar-ring">
            {group.profile_image_url ? (
              <img
                src={resolveUrl(group.profile_image_url)}
                alt={group.user_name}
                className="story-avatar"
              />
            ) : (
              <div className="story-avatar story-avatar-fallback">
                {group.user_name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <span className="story-user-name">{group.user_name}</span>
        </button>
      ))}
    </div>
  );
}

export default StoriesBar;
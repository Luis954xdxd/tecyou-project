import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_BASE = 'http://localhost:5000';

function StoryViewer({
  storyViewer,
  onClose,
  onNext,
  onPrev,
  onReact,
  onComment,
  comments,
  reactions,
  views,
}) {
  const [commentText, setCommentText] = useState('');
  const audioRef = useRef(null);

  const currentStory = storyViewer?.stories?.[storyViewer.currentIndex];

  const reactionMeta = useMemo(
    () => ({
      like: { emoji: '👍', label: 'Me gusta' },
      love: { emoji: '❤️', label: 'Me encanta' },
      laugh: { emoji: '😂', label: 'Me divierte' },
      wow: { emoji: '😮', label: 'Wow' },
      sad: { emoji: '😢', label: 'Triste' },
      fire: { emoji: '🔥', label: 'Top' },
    }),
    []
  );

  useEffect(() => {
    if (!currentStory) return;

    const durationMs = Number(currentStory.duration_seconds || 5) * 1000;

    const timer = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      onNext();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentStory, onNext]);

  useEffect(() => {
    if (!currentStory || !audioRef.current || !currentStory.music_url) return;

    const audio = audioRef.current;
    const startAt = Number(currentStory.music_start_seconds || 0);

    const handleLoadedMetadata = async () => {
      try {
        audio.currentTime = startAt;
        await audio.play();
      } catch (error) {
        console.log('No se pudo reproducir el audio automáticamente:', error);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentStory]);

  if (!storyViewer?.isOpen || !currentStory) return null;

  const mediaSrc = currentStory.media_url?.startsWith('http')
    ? currentStory.media_url
    : `${API_BASE}${currentStory.media_url}`;

  const audioSrc = currentStory.music_url
    ? currentStory.music_url.startsWith('http')
      ? currentStory.music_url
      : `${API_BASE}${currentStory.music_url}`
    : null;

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onComment(currentStory.id, commentText);
    setCommentText('');
  };

  const storyComments = comments?.[currentStory.id] || [];
  const storyReactionUsers = reactions?.[currentStory.id]?.users || [];
  const storyViews = views?.[currentStory.id] || [];

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'hace unos segundos';
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours} h`;
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const formatRemainingTime = (expiresAt) => {
    if (!expiresAt) return 'sin dato';

    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires - now;

    if (diffMs <= 0) return 'expirada';

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) return `${minutes} min`;
    return `${hours}h ${minutes}m`;
  };

  const uploadedText = formatTimeAgo(currentStory.created_at);
  const remainingText = formatRemainingTime(currentStory.expires_at);

  return (
    <div className="story-viewer-overlay">
      <div className="story-viewer">
        <div className="story-progress-bar">
          {storyViewer.stories.map((_, index) => (
            <div key={index} className="story-progress-segment">
              <div
                className={`story-progress-fill ${
                  index < storyViewer.currentIndex
                    ? 'filled'
                    : index === storyViewer.currentIndex
                    ? 'active'
                    : ''
                }`}
              />
            </div>
          ))}
        </div>

        <div className="story-viewer-top">
          <button
            type="button"
            className="story-close-btn"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              onClose();
            }}
          >
            ✕
          </button>

          <div className="story-user-meta">
            <div className="story-time-info">
              <span className="story-upload-time">Subida: {uploadedText}</span>
              <span
                className={`story-expire-time ${
                  remainingText.includes('min') ? 'story-expire-warning' : ''
                }`}
              >
                Expira en: {remainingText}
              </span>
            </div>
          </div>
        </div>

        <div className="story-viewer-main-content">
          <div className="story-viewer-media">
            <div
              className="story-click-left"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                onPrev();
              }}
              aria-label="Historia anterior"
              title="Historia anterior"
            />

            <div
              className="story-click-right"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                onNext();
              }}
              aria-label="Siguiente historia"
              title="Siguiente historia"
            />

            {currentStory.media_type === 'video' ? (
              <video
                src={mediaSrc}
                controls
                autoPlay
                className="story-viewer-video"
              />
            ) : (
              <img
                src={mediaSrc}
                alt="Historia"
                className="story-viewer-image"
              />
            )}
          </div>

          {audioSrc ? (
            <audio ref={audioRef} src={audioSrc} preload="auto" />
          ) : null}

          {currentStory.caption ? (
            <div className="story-viewer-caption">{currentStory.caption}</div>
          ) : null}

          {currentStory.music_name ? (
            <div className="story-viewer-music">🎵 {currentStory.music_name}</div>
          ) : null}

          <div className="story-viewer-reactions">
            {Object.entries(reactionMeta).map(([type, meta]) => (
              <button
                key={type}
                type="button"
                className="story-reaction-btn"
                onClick={() => onReact(currentStory.id, type)}
                title={meta.label}
              >
                <span className="story-reaction-emoji">{meta.emoji}</span>
                <span className="story-reaction-label">{meta.label}</span>
              </button>
            ))}
          </div>

          <div className="story-viewer-bottom">
            <button
              type="button"
              className="story-nav-btn"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                onPrev();
              }}
            >
              ←
            </button>

            <button
              type="button"
              className="story-nav-btn"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                onNext();
              }}
            >
              →
            </button>
          </div>

          <form onSubmit={handleCommentSubmit} className="story-comment-form">
            <input
              type="text"
              placeholder="Comentar historia..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit">Enviar</button>
          </form>

          <div className="story-info-grid">
            <div className="story-comments-list">
              <h4>Comentarios</h4>
              {storyComments.length === 0 ? (
                <p>Sin comentarios.</p>
              ) : (
                storyComments.map((comment) => (
                  <div key={comment.id} className="story-comment-item">
                    <strong>{comment.display_name || comment.fullname}</strong>
                    <p>{comment.comment}</p>
                  </div>
                ))
              )}
            </div>

            <div className="story-reaction-users-list">
              <h4>Quién reaccionó</h4>
              {storyReactionUsers.length === 0 ? (
                <p>Sin reacciones.</p>
              ) : (
                storyReactionUsers.map((user) => {
                  const meta =
                    reactionMeta[user.reaction_type] || {
                      emoji: '✨',
                      label: user.reaction_type,
                    };

                  return (
                    <div
                      key={`${user.user_id}-${user.reaction_type}`}
                      className="story-reaction-user-item"
                    >
                      <strong>{user.display_name || user.fullname}</strong>
                      <span className="story-reaction-type">
                        {meta.emoji} {meta.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="story-views-list">
              <h4>Quién vio</h4>
              {storyViews.length === 0 ? (
                <p>Sin vistas registradas.</p>
              ) : (
                storyViews.map((viewer) => (
                  <div key={viewer.viewer_id} className="story-view-item">
                    <strong>{viewer.display_name || viewer.fullname}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StoryViewer;
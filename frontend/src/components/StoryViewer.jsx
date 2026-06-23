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
  const videoTimerRef = useRef(null);
  const currentStory = storyViewer?.stories?.[storyViewer.currentIndex];

  const reactionMeta = useMemo(
    () => ({
      like: { emoji: '\u{1F44D}', label: 'Me gusta' },
      love: { emoji: '\u2764\uFE0F', label: 'Me encanta' },
      laugh: { emoji: '\u{1F602}', label: 'Me divierte' },
      wow: { emoji: '\u{1F62E}', label: 'Wow' },
      sad: { emoji: '\u{1F622}', label: 'Triste' },
    }),
    []
  );

  useEffect(() => {
    if (!currentStory) return undefined;
    if (currentStory.media_type === 'video') return undefined;
    const durationMs = Number(currentStory.duration_seconds || 30) * 1000;
    const timer = setTimeout(() => {
      audioRef.current?.pause();
      onNext();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [currentStory, onNext]);

  useEffect(() => {
    if (!currentStory || !audioRef.current || !currentStory.music_url) return undefined;
    const audio = audioRef.current;
    const startAt = Number(currentStory.music_start_seconds || 0);

    const handleLoadedMetadata = async () => {
      try {
        audio.currentTime = startAt;
        await audio.play();
      } catch (error) {
        console.log('No se pudo reproducir el audio automaticamente:', error);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentStory]);

  useEffect(() => {
    return () => {
      if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    };
  }, [currentStory]);

  if (!storyViewer?.isOpen || !currentStory) return null;

  const resolveUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  };

  const mediaSrc = resolveUrl(currentStory.media_url);
  const audioSrc = resolveUrl(currentStory.music_url);
  const authorName = currentStory.display_name || currentStory.fullname || 'Usuario';
  const authorAvatar = resolveUrl(currentStory.profile_image_url);
  const storyComments = comments?.[currentStory.id] || [];
  const storyReactionUsers = reactions?.[currentStory.id]?.users || [];
  const storyViews = views?.[currentStory.id] || [];

  const formatTimeAgo = (dateString) => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} h`;
    return 'ayer';
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    await onComment(currentStory.id, commentText);
    setCommentText('');
  };

  const close = () => {
    audioRef.current?.pause();
    if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    onClose();
  };

  const handleVideoMetadata = (event) => {
    if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    const limitMs = Number(currentStory.duration_seconds || 60) * 1000;
    const realDurationMs = Number.isFinite(event.currentTarget.duration)
      ? event.currentTarget.duration * 1000
      : limitMs;
    const nextDelay = Math.min(realDurationMs || limitMs, limitMs);
    videoTimerRef.current = setTimeout(() => {
      audioRef.current?.pause();
      onNext();
    }, nextDelay);
  };

  const handleVideoEnded = () => {
    if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
    audioRef.current?.pause();
    onNext();
  };

  return (
    <div className="story-viewer-overlay fb-story-viewer-overlay">
      <aside className="fb-story-sidebar">
        <button type="button" className="fb-story-close" onClick={close}>
          {'\u00D7'}
        </button>
        <h2>Historias</h2>
        <p>Archivo · Configuracion</p>
        <div className="fb-story-sidebar-author">
          {authorAvatar ? <img src={authorAvatar} alt={authorName} /> : <span>{authorName[0]}</span>}
          <div>
            <strong>{authorName}</strong>
            <small>{formatTimeAgo(currentStory.created_at)}</small>
          </div>
        </div>

        <section className="fb-story-side-section">
          <h3>Quien vio</h3>
          {storyViews.slice(0, 12).map((viewer) => {
            const avatar = resolveUrl(viewer.profile_image_url);
            const name = viewer.display_name || viewer.fullname || 'Usuario';
            return (
              <div key={viewer.viewer_id} className="fb-story-person-row">
                {avatar ? <img src={avatar} alt={name} /> : <span>{name[0]}</span>}
                <strong>{name}</strong>
              </div>
            );
          })}
          {storyViews.length === 0 && <small>Sin vistas registradas.</small>}
        </section>

        <section className="fb-story-side-section">
          <h3>Reacciones</h3>
          {storyReactionUsers.slice(0, 12).map((item) => {
            const meta = reactionMeta[item.reaction_type] || { emoji: '\u2728', label: item.reaction_type };
            const name = item.display_name || item.fullname || 'Usuario';
            return (
              <div key={`${item.user_id}-${item.reaction_type}`} className="fb-story-person-row">
                <span>{meta.emoji}</span>
                <div>
                  <strong>{name}</strong>
                  <small>{meta.label}</small>
                </div>
              </div>
            );
          })}
          {storyReactionUsers.length === 0 && <small>Sin reacciones.</small>}
        </section>
      </aside>

      <main className="fb-story-stage">
        <div className="story-progress-bar fb-story-progress">
          {storyViewer.stories.map((_, index) => (
            <div key={index} className="story-progress-segment">
              <div
                className={`story-progress-fill ${
                  index < storyViewer.currentIndex ? 'filled' : index === storyViewer.currentIndex ? 'active' : ''
                }`}
              />
            </div>
          ))}
        </div>

        <div className="fb-story-top-meta">
          {authorAvatar ? <img src={authorAvatar} alt={authorName} /> : <span>{authorName[0]}</span>}
          <strong>{authorName}</strong>
          <small>{formatTimeAgo(currentStory.created_at)}</small>
          {currentStory.music_name && <em>{'\u266B'} {currentStory.music_name}</em>}
        </div>

        <button type="button" className="fb-story-nav prev" onClick={onPrev}>
          {'\u2039'}
        </button>
        <button type="button" className="fb-story-nav next" onClick={onNext}>
          {'\u203A'}
        </button>

        <div className="fb-story-card">
          {currentStory.media_type === 'video' ? (
            <video
              src={mediaSrc}
              autoPlay
              controls
              className="story-viewer-video"
              onLoadedMetadata={handleVideoMetadata}
              onEnded={handleVideoEnded}
            />
          ) : (
            <img src={mediaSrc} alt="Historia" className="story-viewer-image" />
          )}
          {currentStory.caption && <p className="fb-story-caption">{currentStory.caption}</p>}
        </div>

        {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" />}

        <div className="fb-story-bottom-actions">
          <form onSubmit={handleCommentSubmit} className="story-comment-form">
            <input
              type="text"
              placeholder="Enviar mensaje..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />
          </form>
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
              </button>
            ))}
          </div>
        </div>

        {storyComments.length > 0 && (
          <div className="fb-story-comments-pill">
            {storyComments.length} comentario(s)
          </div>
        )}
      </main>
    </div>
  );
}

export default StoryViewer;

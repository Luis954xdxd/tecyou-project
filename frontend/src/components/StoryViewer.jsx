import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Flag, Send, Trash2, X } from 'lucide-react';
import ReportDialog from './ReportDialog';

const API_BASE = 'http://localhost:5000';

function StoryPersonAvatar({ src, name }) {
  return (
    <i className="fb-story-person-avatar" aria-hidden="true">
      <span>{String(name || 'U').trim().charAt(0).toUpperCase()}</span>
      {src && <img src={src} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
    </i>
  );
}

function StoryViewer({
  storyViewer,
  onClose,
  onNext,
  onPrev,
  onReact,
  onComment,
  onDelete,
  comments,
  reactions,
  views,
  currentUser,
}) {
  const [commentText, setCommentText] = useState('');
  const [showStoryReport, setShowStoryReport] = useState(false);
  const [reportNotice, setReportNotice] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingStory, setDeletingStory] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const remainingTimeRef = useRef(0);
  const timerStartedAtRef = useRef(0);
  const timerStoryIdRef = useRef(null);
  const touchStartRef = useRef(null);
  const navigationLockRef = useRef(false);
  const navigationUnlockRef = useRef(null);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const currentStory = storyViewer?.stories?.[storyViewer.currentIndex];
  const currentStoryId = currentStory?.id;
  const currentStoryDuration = currentStory?.duration_seconds;
  const currentStoryMediaType = currentStory?.media_type;
  const playbackPaused = isHolding || showInsights || commentFocused || showDeleteConfirm || showStoryReport;
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
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  const navigateOnce = (direction) => {
    if (navigationLockRef.current) return;
    navigationLockRef.current = true;
    audioRef.current?.pause();
    const callback = direction === 'next' ? onNextRef.current : onPrevRef.current;
    callback?.();
    if (navigationUnlockRef.current) clearTimeout(navigationUnlockRef.current);
    navigationUnlockRef.current = setTimeout(() => {
      navigationLockRef.current = false;
    }, 350);
  };

  useEffect(() => {
    if (!currentStoryId || playbackPaused) return undefined;
    const fallbackDuration = currentStoryMediaType === 'video' ? 60 : 30;
    const fullDurationMs = Number(currentStoryDuration || fallbackDuration) * 1000;
    if (timerStoryIdRef.current !== currentStoryId) {
      timerStoryIdRef.current = currentStoryId;
      remainingTimeRef.current = fullDurationMs;
    }
    const durationMs = remainingTimeRef.current || fullDurationMs;
    timerStartedAtRef.current = Date.now();
    const timer = setTimeout(() => {
      navigateOnce('next');
    }, durationMs);
    return () => {
      clearTimeout(timer);
      const elapsed = Date.now() - timerStartedAtRef.current;
      remainingTimeRef.current = Math.max(durationMs - elapsed, 0);
    };
  }, [currentStoryId, currentStoryDuration, currentStoryMediaType, playbackPaused]);

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
    navigationLockRef.current = false;
    remainingTimeRef.current = Number(currentStoryDuration || (currentStoryMediaType === 'video' ? 60 : 30)) * 1000;
    if (navigationUnlockRef.current) clearTimeout(navigationUnlockRef.current);
    setShowInsights(false);
    setIsHolding(false);
    setCommentFocused(false);
    return () => {
      if (navigationUnlockRef.current) clearTimeout(navigationUnlockRef.current);
    };
  }, [currentStoryId, currentStoryDuration, currentStoryMediaType]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (playbackPaused) {
      video?.pause();
      audio?.pause();
      return;
    }
    video?.play().catch(() => {});
    audio?.play().catch(() => {});
  }, [playbackPaused, currentStoryId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
      if (event.key === 'ArrowLeft') navigateOnce('prev');
      if (event.key === 'ArrowRight') navigateOnce('next');
      if (event.key === 'Escape') close();
      if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        setIsHolding((paused) => !paused);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  if (!storyViewer?.isOpen || !currentStory) return null;

  const resolveUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  };

  const mediaSrc = resolveUrl(currentStory.media_url);
  const audioSrc = resolveUrl(currentStory.music_url);
  const mediaStyle = {
    '--story-media-fit': currentStory.media_fit || 'cover',
    '--story-media-position': `${Number(currentStory.media_position_x ?? 50)}% ${Number(currentStory.media_position_y ?? 50)}%`,
  };
  const authorName = currentStory.display_name || currentStory.fullname || 'Usuario';
  const authorAvatar = resolveUrl(currentStory.profile_image_url);
  const storyComments = comments?.[currentStory.id] || [];
  const storyReactionUsers = reactions?.[currentStory.id]?.users || [];
  const storyViews = views?.[currentStory.id] || [];
  const isOwner = Number(currentStory.user_id) === Number(currentUser?.id);

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
    onClose();
  };

  const handleVideoMetadata = (event) => {
    if (playbackPaused) event.currentTarget.pause();
  };

  const handleVideoEnded = () => {
    navigateOnce('next');
  };

  const handleZoneClick = (event, direction) => {
    event.stopPropagation();
    navigateOnce(direction);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches?.[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches?.[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaY) > 80 && Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
      close();
      return;
    }
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
      navigateOnce(deltaX > 0 ? 'prev' : 'next');
    }
  };

  const handleDelete = async () => {
    if (!onDelete || deletingStory) return;
    setDeletingStory(true);
    audioRef.current?.pause();
    try {
      await onDelete(currentStory.id);
      setShowDeleteConfirm(false);
    } finally {
      setDeletingStory(false);
    }
  };

  return (
    <div
      className={`story-viewer-overlay fb-story-viewer-overlay ${showInsights && isOwner ? 'has-insights' : ''} ${playbackPaused ? 'is-paused' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button type="button" className="fb-story-close fb-story-close-floating" onClick={close} aria-label="Cerrar historias">
        <X size={24} />
      </button>

      {showInsights && isOwner && (
      <aside className="fb-story-sidebar fb-story-insights">
        <div className="fb-story-insights-heading">
          <div>
            <h2>Actividad</h2>
            <p>Datos de esta historia</p>
          </div>
          <button type="button" onClick={() => setShowInsights(false)} aria-label="Ocultar actividad">
            <X size={20} />
          </button>
        </div>
        <div className="fb-story-sidebar-author">
          <StoryPersonAvatar src={authorAvatar} name={authorName} />
          <div>
            <strong>{authorName}</strong>
            <small>{formatTimeAgo(currentStory.created_at)}</small>
          </div>
        </div>

        <div className="fb-story-insights-summary">
          <div><strong>{storyViews.length}</strong><small>Vistas</small></div>
          <div><strong>{storyReactionUsers.length}</strong><small>Reacciones</small></div>
          <div><strong>{storyComments.length}</strong><small>Comentarios</small></div>
        </div>

        <section className="fb-story-side-section">
          <h3>Visualizaciones ({storyViews.length})</h3>
          {storyViews.slice(0, 12).map((viewer) => {
            const avatar = resolveUrl(viewer.profile_image_url);
            const name = viewer.display_name || viewer.fullname || 'Usuario';
            return (
              <div key={viewer.viewer_id} className="fb-story-person-row">
                <StoryPersonAvatar src={avatar} name={name} />
                <strong>{name}</strong>
              </div>
            );
          })}
          {storyViews.length === 0 && <small>Sin vistas registradas.</small>}
        </section>

        <section className="fb-story-side-section">
          <h3>Reacciones ({storyReactionUsers.length})</h3>
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

        <section className="fb-story-side-section">
          <h3>Comentarios ({storyComments.length})</h3>
          {storyComments.slice(0, 20).map((item) => {
            const avatar = resolveUrl(item.profile_image_url);
            const name = item.display_name || item.fullname || 'Usuario';
            return (
              <div key={item.id} className="fb-story-person-row fb-story-comment-row">
                <StoryPersonAvatar src={avatar} name={name} />
                <div>
                  <strong>{name}</strong>
                  <small>{item.comment}</small>
                </div>
              </div>
            );
          })}
          {storyComments.length === 0 && <small>Sin comentarios.</small>}
        </section>
      </aside>
      )}

      <main className="fb-story-stage">
        <div className="story-progress-bar fb-story-progress">
          {storyViewer.stories.map((story, index) => (
            <div key={story.id} className="story-progress-segment">
              <div
                key={`${story.id}-${currentStory.id}`}
                className={`story-progress-fill ${
                  index < storyViewer.currentIndex ? 'filled' : index === storyViewer.currentIndex ? 'active' : ''
                }`}
                style={index === storyViewer.currentIndex ? {
                  '--story-progress-duration': `${Number(currentStory.duration_seconds || (currentStory.media_type === 'video' ? 60 : 30))}s`,
                } : undefined}
              />
            </div>
          ))}
        </div>

        <div className="fb-story-top-meta">
          <StoryPersonAvatar src={authorAvatar} name={authorName} />
          <div className="fb-story-author-copy">
            <div className="fb-story-author-line">
              <strong>{authorName}</strong>
              <small>{formatTimeAgo(currentStory.created_at)}</small>
            </div>
            {currentStory.music_name && <em>{'\u266B'} {currentStory.music_name}</em>}
          </div>
          {Array.isArray(currentStory.mentioned_users) && currentStory.mentioned_users.length > 0 && (
            <small className="fb-story-mentions">
              con {currentStory.mentioned_users.map((item) => `@${item.display_name || item.fullname}`).join(', ')}
            </small>
          )}
          {!isOwner && (
            <button type="button" className="fb-story-report-btn" onClick={() => setShowStoryReport(true)} title="Reportar historia">
              <Flag size={18} />
            </button>
          )}
          {isOwner && (
            <div className="fb-story-owner-actions">
              <button
                type="button"
                className={`fb-story-report-btn is-insights ${showInsights ? 'active' : ''}`}
                onClick={() => setShowInsights((visible) => !visible)}
                title={showInsights ? 'Ocultar actividad' : 'Ver actividad'}
                aria-label={showInsights ? 'Ocultar actividad de la historia' : 'Ver actividad de la historia'}
                aria-expanded={showInsights}
              >
                <Eye size={19} />
              </button>
              <button
                type="button"
                className="fb-story-report-btn is-delete"
                onClick={() => setShowDeleteConfirm(true)}
                title="Eliminar historia"
                aria-label="Eliminar historia"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        <button type="button" className="fb-story-nav prev" onClick={() => navigateOnce('prev')} aria-label="Historia anterior">
          {'\u2039'}
        </button>
        <button type="button" className="fb-story-nav next" onClick={() => navigateOnce('next')} aria-label="Historia siguiente">
          {'\u203A'}
        </button>

        <div
          className="fb-story-card"
          onClick={() => setIsHolding((paused) => !paused)}
        >
          <button
            type="button"
            className="fb-story-tap-zone previous"
            aria-label="Historia anterior"
            onClick={(event) => handleZoneClick(event, 'prev')}
          />
          <button
            type="button"
            className="fb-story-tap-zone following"
            aria-label="Historia siguiente"
            onClick={(event) => handleZoneClick(event, 'next')}
          />
          {currentStory.media_type === 'video' ? (
            <video
              key={currentStory.id}
              ref={videoRef}
              src={mediaSrc}
              autoPlay
              controls
              className="story-viewer-video"
              style={mediaStyle}
              onLoadedMetadata={handleVideoMetadata}
              onEnded={handleVideoEnded}
            />
          ) : (
            <img key={currentStory.id} src={mediaSrc} alt="Historia" className="story-viewer-image" style={mediaStyle} />
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
              onFocus={() => setCommentFocused(true)}
              onBlur={() => setCommentFocused(false)}
            />
            <button
              type="submit"
              className="story-comment-send-btn"
              disabled={!commentText.trim()}
              title="Enviar mensaje"
              aria-label="Enviar mensaje"
            >
              <Send size={19} />
            </button>
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

        {isOwner && storyComments.length > 0 && (
          <div className="fb-story-comments-pill">
            {storyComments.length} comentario(s)
          </div>
        )}
      </main>
      {reportNotice && <div className="story-report-notice">{reportNotice}</div>}
      {showDeleteConfirm && (
        <div className="tec-confirm-overlay" role="dialog" aria-modal="true" onClick={() => !deletingStory && setShowDeleteConfirm(false)}>
          <div className="tec-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tec-confirm-icon">{'\u26A0'}</div>
            <h2>Eliminar historia</h2>
            <p>La historia, sus comentarios y reacciones se eliminaran definitivamente.</p>
            <div className="tec-confirm-actions">
              <button type="button" className="tec-confirm-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deletingStory}>
                Cancelar
              </button>
              <button type="button" className="tec-confirm-danger" onClick={handleDelete} disabled={deletingStory}>
                {deletingStory ? 'Eliminando...' : 'Si, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showStoryReport && (
        <ReportDialog
          targetType="story"
          targetId={currentStory.id}
          title="Reportar historia"
          author={authorName}
          preview={currentStory.caption || 'Historia con contenido multimedia'}
          onClose={() => setShowStoryReport(false)}
          onSuccess={(message) => {
            setReportNotice(message);
            setTimeout(() => setReportNotice(''), 3500);
          }}
        />
      )}
    </div>
  );
}

export default StoryViewer;

import React, { useEffect, useMemo, useRef, useState } from 'react';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function RecognitionVideoPlayer({
  src,
  poster = '',
  className = '',
  compact = false,
  autoPlayWhenVisible = false,
  showDurationBadge = true,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const observerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isInPictureInPicture, setIsInPictureInPicture] = useState(false);

  const [centerPulse, setCenterPulse] = useState('');
  const [seekFeedback, setSeekFeedback] = useState({
    visible: false,
    side: '',
    text: '',
  });

  const progressPercent = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) return 0;
    return Math.min((currentTime / duration) * 100, 100);
  }, [currentTime, duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsPiPSupported(
      typeof document !== 'undefined' &&
        'pictureInPictureEnabled' in document &&
        typeof video.requestPictureInPicture === 'function'
    );
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const onTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime || 0);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const onEnterPiP = async () => {
      setIsInPictureInPicture(true);

      try {
        if (video.paused) {
          await video.play();
        }
      } catch (error) {
        console.error('No se pudo continuar la reproducción al entrar en PiP:', error);
      }
    };

    const onLeavePiP = () => {
      setIsInPictureInPicture(false);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [isSeeking]);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!autoPlayWhenVisible) return;

    const video = videoRef.current;
    const container = containerRef.current;

    if (!video || !container) return;

    video.muted = true;
    setIsMuted(true);

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!video) return;

        try {
          if (document.pictureInPictureElement === video || isInPictureInPicture) {
            return;
          }

          if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
            await video.play();
          } else {
            video.pause();
          }
        } catch (error) {
          console.error('No se pudo reproducir automáticamente el video:', error);
        }
      },
      {
        threshold: [0.25, 0.5, 0.65, 0.85],
      }
    );

    observer.observe(container);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [autoPlayWhenVisible, isInPictureInPicture]);

  const restartHideTimer = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    setShowControls(true);

    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1800);
    }
  };

  const showPulse = (mode) => {
    setCenterPulse(mode);

    setTimeout(() => {
      setCenterPulse('');
    }, 320);
  };

  const showSeekFeedback = (side, text) => {
    setSeekFeedback({
      visible: true,
      side,
      text,
    });

    setTimeout(() => {
      setSeekFeedback({
        visible: false,
        side: '',
        text: '',
      });
    }, 650);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        showPulse('play');
      } else {
        video.pause();
        showPulse('pause');
      }

      restartHideTimer();
    } catch (error) {
      console.error('No se pudo cambiar play/pause:', error);
    }
  };

  const seekRelative = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + seconds)
    );

    video.currentTime = nextTime;
    setCurrentTime(nextTime);

    if (seconds > 0) {
      showSeekFeedback('right', '+10s');
    } else {
      showSeekFeedback('left', '-10s');
    }

    restartHideTimer();
  };

  const handleDoubleClickZone = (side) => {
    if (side === 'left') {
      seekRelative(-10);
    } else {
      seekRelative(10);
    }
  };

  const handleProgressChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    video.currentTime = nextTime;
    restartHideTimer();
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const nextVolume = Number(e.target.value);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
    restartHideTimer();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);

    if (!video.muted && video.volume === 0) {
      video.volume = 0.5;
      setVolume(0.5);
    }

    restartHideTimer();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }

      restartHideTimer();
    } catch (error) {
      console.error('No se pudo cambiar fullscreen:', error);
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video || !isPiPSupported) return;

    try {
      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
        setIsInPictureInPicture(false);
        return;
      }

      if (video.paused) {
        try {
          await video.play();
        } catch (err) {
          console.error('No se pudo reproducir antes de PiP:', err);
        }
      }

      await video.requestPictureInPicture();
      setIsInPictureInPicture(true);
    } catch (error) {
      console.error('Error PiP:', error);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`recognition-video-player ${compact ? 'compact' : ''} ${className}`}
      onMouseMove={restartHideTimer}
      onMouseEnter={restartHideTimer}
      onMouseLeave={() => {
        if (isPlaying && !isInPictureInPicture) setShowControls(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="recognition-video-element"
        playsInline
        preload="metadata"
        muted={autoPlayWhenVisible}
        onClick={togglePlay}
      />

      {!isInPictureInPicture && (
        <>
          <button
            type="button"
            className="recognition-video-zone left"
            onDoubleClick={() => handleDoubleClickZone('left')}
            aria-label="Retroceder 10 segundos"
          />

          <button
            type="button"
            className="recognition-video-zone right"
            onDoubleClick={() => handleDoubleClickZone('right')}
            aria-label="Adelantar 10 segundos"
          />
        </>
      )}

      {!isInPictureInPicture && showDurationBadge && (
        <div className="recognition-video-duration-badge">
          {formatTime(duration)}
        </div>
      )}

      {!isInPictureInPicture && centerPulse && (
        <div className={`recognition-video-center-pulse ${centerPulse}`}>
          <span>{centerPulse === 'play' ? '▶' : '❚❚'}</span>
        </div>
      )}

      {!isInPictureInPicture && seekFeedback.visible && (
        <div className={`recognition-video-seek-feedback ${seekFeedback.side}`}>
          <span>{seekFeedback.text}</span>
        </div>
      )}

      {!isInPictureInPicture && (
        <div className={`recognition-video-overlay ${showControls ? 'visible' : ''}`}>
          <div className="recognition-video-topbar">
            <span className="recognition-video-badge">Video</span>
          </div>

          <div className="recognition-video-center">
            <button
              type="button"
              className="recognition-video-play-toggle"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
          </div>

          <div className="recognition-video-controls">
            <div className="recognition-video-progress-wrap">
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={currentTime}
                onChange={handleProgressChange}
                onMouseDown={() => setIsSeeking(true)}
                onMouseUp={() => setIsSeeking(false)}
                onTouchStart={() => setIsSeeking(true)}
                onTouchEnd={() => setIsSeeking(false)}
                className="recognition-video-progress"
                style={{
                  background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${progressPercent}%, rgba(255,255,255,0.18) ${progressPercent}%, rgba(255,255,255,0.18) 100%)`,
                }}
              />
            </div>

            <div className="recognition-video-control-row">
              <div className="recognition-video-left-controls">
                <button
                  type="button"
                  className="recognition-video-icon-btn"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
                >
                  {isPlaying ? '❚❚' : '▶'}
                </button>

                <span className="recognition-video-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="recognition-video-right-controls">
                <button
                  type="button"
                  className="recognition-video-icon-btn"
                  onClick={toggleMute}
                  aria-label={isMuted || volume === 0 ? 'Activar sonido' : 'Silenciar'}
                >
                  {isMuted || volume === 0 ? '🔇' : '🔊'}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="recognition-video-volume"
                  aria-label="Volumen"
                />

                {isPiPSupported && (
                  <button
                    type="button"
                    className="recognition-video-icon-btn"
                    onClick={togglePictureInPicture}
                    aria-label="Picture in Picture"
                    title="Picture in Picture"
                  >
                    ⧉
                  </button>
                )}

                <button
                  type="button"
                  className="recognition-video-icon-btn"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                  title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {isFullscreen ? '🡼' : '⛶'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecognitionVideoPlayer;
import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RecognitionVideoPlayer from '../components/RecognitionVideoPlayer';
import RecognitionComments from '../components/RecognitionComments';
import { renderTextWithHashtags } from '../textFormatters';

const API_BASE = 'http://localhost:5000';

function RecognitionPage({
  recognitions,
  onBack,
  onOpenImageViewer,
  currentUserId,
  onOpenProfile,
  renderReactionBar,
  renderReactionSummary,
  renderFavoriteButton,
  onHashtagClick,
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const safeRecognitions = Array.isArray(recognitions) ? recognitions : [];

  const recognition = safeRecognitions.find(
    (rec) => Number(rec.id) === Number(id)
  );

  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const imageItems = useMemo(() => {
    if (!Array.isArray(recognition?.media)) return [];

    return recognition.media
      .filter((item) => item.media_type === 'image')
      .map((item) => ({
        ...item,
        fullUrl: resolveUrl(item.media_url),
      }));
  }, [recognition]);

  if (safeRecognitions.length === 0) {
    return (
      <div className="recognition-page-shell">
        <div className="recognition-page-card recognition-page-loading">
          <p>Cargando reconocimiento...</p>
        </div>
      </div>
    );
  }

  if (!recognition) {
    return (
      <div className="recognition-page-shell">
        <div className="recognition-page-card recognition-page-loading">
          <button
            type="button"
            className="recognition-page-back-btn"
            onClick={() => navigate('/')}
          >
            ← Volver al mural
          </button>

          <h2>Reconocimiento no encontrado</h2>
        </div>
      </div>
    );
  }

  const hasMedia = Array.isArray(recognition.media) && recognition.media.length > 0;

  return (
    <div className="recognition-page-shell">
      <div className="recognition-page-card">
        <button
          type="button"
          className="recognition-page-back-btn"
          onClick={() => navigate('/')}
        >
          ← Volver al mural
        </button>

        <div className="recognition-page-top">
          <div className="recognition-page-category">
            {recognition.category}
          </div>

          <span className="recognition-page-date">
            {new Date(recognition.created_at).toLocaleDateString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className="recognition-page-header">
          <strong>{recognition.sender_name}</strong>
          <span> reconoció a </span>
          <strong>{recognition.receiver_name}</strong>
        </div>

        <div className="recognition-page-message">
          <p className="message-with-hashtags">
            {renderTextWithHashtags(recognition.message, (tag) => {
              if (onHashtagClick) {
                onHashtagClick(tag);
              } else {
                console.log('Hashtag clicado:', tag);
              }
            })}
          </p>
        </div>

        {hasMedia && (
          <div className="recognition-page-media">
            {recognition.media.map((item) =>
              item.media_type === 'video' ? (
                <RecognitionVideoPlayer
                  key={item.id}
                  src={resolveUrl(item.media_url)}
                  autoPlayWhenVisible={true}
                  showDurationBadge={true}
                  compact={false}
                />
              ) : (
                <img
                  key={item.id}
                  src={resolveUrl(item.media_url)}
                  alt="Media reconocimiento"
                  className="recognition-page-image"
                  onClick={() => {
                    const clickedIndex = imageItems.findIndex(
                      (img) => img.id === item.id
                    );

                    if (onOpenImageViewer && clickedIndex >= 0) {
                      onOpenImageViewer(imageItems, clickedIndex);
                    }
                  }}
                />
              )
            )}
          </div>
        )}

        <div className="recognition-page-actions">
          {renderReactionBar ? renderReactionBar(recognition.id) : null}
          {renderFavoriteButton ? renderFavoriteButton(recognition.id) : null}
        </div>

        <div className="recognition-page-comments">
          <RecognitionComments
            recognitionId={recognition.id}
            currentUserId={currentUserId}
            onOpenProfile={onOpenProfile}
          />
        </div>
      </div>
    </div>
  );
}

export default RecognitionPage;
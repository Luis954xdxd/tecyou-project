import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function RecognitionComments({ recognitionId, currentUserId, onOpenProfile }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await axios.get(`${API_BASE}/api/recognitions/${recognitionId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, recognitionId]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentInput.trim()) return;

    try {
      setSendingComment(true);

      await axios.post(`${API_BASE}/api/recognitions/${recognitionId}/comments`, {
        user_id: currentUserId,
        comment: commentInput,
      });

      setCommentInput('');
      fetchComments();
    } catch (error) {
      console.error('Error al enviar comentario:', error);
      alert(error.response?.data?.error || 'No se pudo enviar el comentario.');
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <div className="comments-block">
      <div className="comments-topbar">
        <button
          type="button"
          className="comments-toggle-btn"
          onClick={() => setShowComments((prev) => !prev)}
        >
          {showComments ? 'Ocultar comentarios' : 'Ver comentarios'}
        </button>
      </div>

      {showComments && (
        <div className="comments-panel">
          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              className="comment-input"
              placeholder="Escribe un comentario positivo..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button type="submit" className="comment-submit-btn" disabled={sendingComment}>
              {sendingComment ? 'Comentando...' : 'Comentar'}
            </button>
          </form>

          <div className="comments-list">
            {loadingComments ? (
              <p className="comments-empty">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="comments-empty">Aún no hay comentarios.</p>
            ) : (
              comments.map((item) => (
                <div key={item.id} className="comment-item">
                  <div className="comment-avatar">
                    {item.profile_image_url ? (
                      <img
                        src={resolveImageUrl(item.profile_image_url)}
                        alt={item.user_name}
                        className="comment-avatar-image"
                      />
                    ) : (
                      <div className="comment-avatar-fallback">
                        {(item.user_name || 'TSJ')
                          .split(' ')
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="comment-body">
                    <div className="comment-meta">
                      <button
                        type="button"
                        className="inline-user-link reaction-user-link"
                        onClick={() => onOpenProfile(item.user_id)}
                      >
                        {item.user_name}
                      </button>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <p>{item.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecognitionComments;
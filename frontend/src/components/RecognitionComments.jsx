import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function RecognitionComments({ recognitionId, currentUserId, onOpenProfile }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [replyInputs, setReplyInputs] = useState({});
  const [replyOpenMap, setReplyOpenMap] = useState({});
  const [replyLoadingMap, setReplyLoadingMap] = useState({});
  const [repliesMap, setRepliesMap] = useState({});

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

  const getInitials = (name) => {
    if (!name) return 'TSJ';
    return name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await axios.get(`${API_BASE}/api/recognitions/${recognitionId}/comments`);
      setComments(response.data);

      if (Array.isArray(response.data) && response.data.length > 0) {
        response.data.forEach((comment) => {
          fetchReplies(comment.id);
        });
      }
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchReplies = async (commentId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/recognitions/comments/${commentId}/replies`);
      setRepliesMap((prev) => ({
        ...prev,
        [commentId]: response.data,
      }));
    } catch (error) {
      console.error('Error al obtener respuestas:', error);
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

  const handleSubmitReply = async (commentId) => {
    const replyText = replyInputs[commentId]?.trim();

    if (!replyText) return;

    try {
      setReplyLoadingMap((prev) => ({
        ...prev,
        [commentId]: true,
      }));

      await axios.post(`${API_BASE}/api/recognitions/comments/${commentId}/replies`, {
        user_id: currentUserId,
        reply: replyText,
      });

      setReplyInputs((prev) => ({
        ...prev,
        [commentId]: '',
      }));

      await fetchReplies(commentId);
      setReplyOpenMap((prev) => ({
        ...prev,
        [commentId]: false,
      }));
    } catch (error) {
      console.error('Error al responder comentario:', error);
      alert(error.response?.data?.error || 'No se pudo enviar la respuesta.');
    } finally {
      setReplyLoadingMap((prev) => ({
        ...prev,
        [commentId]: false,
      }));
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
          {showComments ? 'Ocultar comentarios' : `Ver comentarios (${comments.length})`}
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
                <div key={item.id} className="comment-thread">
                  <div className="comment-item">
                    <div className="comment-avatar">
                      {item.profile_image_url ? (
                        <img
                          src={resolveImageUrl(item.profile_image_url)}
                          alt={item.user_name}
                          className="comment-avatar-image"
                        />
                      ) : (
                        <div className="comment-avatar-fallback">
                          {getInitials(item.user_name)}
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

                      <div className="comment-actions-row">
                        <button
                          type="button"
                          className="comment-reply-toggle-btn"
                          onClick={() =>
                            setReplyOpenMap((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                        >
                          {replyOpenMap[item.id] ? 'Cancelar' : 'Responder'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {replyOpenMap[item.id] && (
                    <div className="reply-form-wrap">
                      <textarea
                        className="reply-input"
                        placeholder="Escribe una respuesta..."
                        value={replyInputs[item.id] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                      />

                      <button
                        type="button"
                        className="reply-submit-btn"
                        onClick={() => handleSubmitReply(item.id)}
                        disabled={replyLoadingMap[item.id]}
                      >
                        {replyLoadingMap[item.id] ? 'Respondiendo...' : 'Responder'}
                      </button>
                    </div>
                  )}

                  {Array.isArray(repliesMap[item.id]) && repliesMap[item.id].length > 0 && (
                    <div className="reply-list">
                      {repliesMap[item.id].map((reply) => (
                        <div key={reply.id} className="reply-item">
                          <div className="reply-avatar">
                            {reply.profile_image_url ? (
                              <img
                                src={resolveImageUrl(reply.profile_image_url)}
                                alt={reply.user_name}
                                className="reply-avatar-image"
                              />
                            ) : (
                              <div className="reply-avatar-fallback">
                                {getInitials(reply.user_name)}
                              </div>
                            )}
                          </div>

                          <div className="reply-body">
                            <div className="reply-meta">
                              <button
                                type="button"
                                className="inline-user-link reaction-user-link"
                                onClick={() => onOpenProfile(reply.user_id)}
                              >
                                {reply.user_name}
                              </button>
                              <span>{formatDate(reply.created_at)}</span>
                            </div>

                            <p>{reply.reply}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
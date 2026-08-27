import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Flag, Heart, Send, Trash2, X } from 'lucide-react';
import ReportDialog from './ReportDialog';

const API_BASE = 'http://localhost:5000';

function RecognitionComments({
  recognitionId,
  currentUserId,
  recognition,
  resolveImageUrl: resolveExternalImageUrl,
  onOpenProfile,
  onCommentAdded,
  onCommentDeleted,
  onCommentsSynced,
}) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('comments-modal-open', showComments);

    return () => {
      document.body.classList.remove('comments-modal-open');
    };
  }, [showComments]);

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [replyLoadingMap, setReplyLoadingMap] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [likingComments, setLikingComments] = useState({});
  const [deletingComments, setDeletingComments] = useState({});
  const [reportingComment, setReportingComment] = useState(null);
  const [reportNotice, setReportNotice] = useState('');
  const [commentNotice, setCommentNotice] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionTarget, setMentionTarget] = useState({
    type: 'comment',
    commentId: null,
  });
  const [, setMentionQuery] = useState('');

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} h`;
    if (days < 7) return `${days} d`;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
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
      const response = await axios.get(
        `${API_BASE}/api/recognitions/${recognitionId}/comments?userId=${currentUserId}`
      );
      const nextComments = Array.isArray(response.data) ? response.data : [];
      setComments(nextComments);
      onCommentsSynced?.(recognitionId, countCommentTree(nextComments));
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

  const recognitionMedia = useMemo(() => {
    if (!Array.isArray(recognition?.media)) return [];
    return recognition.media
      .filter((item) => item?.media_url)
      .map((item) => ({ ...item, fullUrl: resolveExternalImageUrl?.(item.media_url) || resolveImageUrl(item.media_url) }));
  }, [recognition?.media, resolveExternalImageUrl]);

  const activeMedia = recognitionMedia[Math.min(activeMediaIndex, Math.max(recognitionMedia.length - 1, 0))];

  useEffect(() => {
    setActiveMediaIndex(0);
  }, [recognitionId]);

  function countCommentTree(items = []) {
    return items.reduce((total, item) => total + 1 + countCommentTree(item.replies || []), 0);
  }

  const goToMedia = (nextIndex) => {
    if (recognitionMedia.length <= 1) return;
    setActiveMediaIndex((nextIndex + recognitionMedia.length) % recognitionMedia.length);
  };


  useEffect(() => {
    if (!showComments) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showComments]);

  const detectMentionQuery = (text) => {
    const match = text.match(/(?:^|\s)@([a-zA-Z0-9._]*)$/);
    return match ? match[1] : null;
  };

  const fetchMentionSuggestions = async (queryText) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/users/search?q=${encodeURIComponent(queryText)}&currentUserId=${currentUserId}`
      );

      const users = Array.isArray(response.data) ? response.data : [];
      setMentionSuggestions(users.slice(0, 6));
      setShowMentionSuggestions(users.length > 0);
    } catch (error) {
      console.error('Error obteniendo sugerencias de mención:', error);
      setMentionSuggestions([]);
      setShowMentionSuggestions(false);
    }
  };

  const handleCommentInputChange = async (value) => {
    setCommentInput(value);

    const detectedQuery = detectMentionQuery(value);

    if (detectedQuery !== null) {
      setMentionTarget({
        type: 'comment',
        commentId: null,
      });
      setMentionQuery(detectedQuery);
      await fetchMentionSuggestions(detectedQuery);
    } else {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
      setMentionQuery('');
    }
  };

  const handleReplyInputChange = async (commentId, value) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: value,
    }));

    const detectedQuery = detectMentionQuery(value);

    if (detectedQuery !== null) {
      setMentionTarget({
        type: 'reply',
        commentId,
      });
      setMentionQuery(detectedQuery);
      await fetchMentionSuggestions(detectedQuery);
    } else {
      setShowMentionSuggestions(false);
      setMentionSuggestions([]);
      setMentionQuery('');
    }
  };

  const insertMentionIntoText = (currentText, selectedUser) => {
    const handle = selectedUser.email?.split('@')[0] || '';
    if (!handle) return currentText;

    return currentText.replace(/@([a-zA-Z0-9._]*)$/, `@${handle} `);
  };

  const handleSelectMention = (user) => {
    if (mentionTarget.type === 'comment') {
      setCommentInput((prev) => insertMentionIntoText(prev, user));
    } else if (mentionTarget.type === 'reply' && mentionTarget.commentId) {
      setReplyInputs((prev) => ({
        ...prev,
        [mentionTarget.commentId]: insertMentionIntoText(
          prev[mentionTarget.commentId] || '',
          user
        ),
      }));
    }

    setShowMentionSuggestions(false);
    setMentionSuggestions([]);
    setMentionQuery('');
  };

  const renderCommentWithMentions = (text) => {
    const parts = text.split(/(@[a-zA-Z0-9._]+)/g);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const handle = part.slice(1);

        return (
          <button
            key={`${part}-${index}`}
            type="button"
            className="comment-mention"
            onClick={async () => {
              try {
                const response = await axios.get(
                  `${API_BASE}/api/users/search?q=${encodeURIComponent(handle)}&currentUserId=${currentUserId}`
                );

                const users = Array.isArray(response.data) ? response.data : [];
                const matchedUser = users.find(
                  (user) => user.email?.split('@')[0]?.toLowerCase() === handle.toLowerCase()
                );

                if (matchedUser) {
                  onOpenProfile(matchedUser.id);
                }
              } catch (error) {
                console.error('Error abriendo perfil desde mención:', error);
              }
            }}
          >
            {part}
          </button>
        );
      }

      return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
    });
  };

  const mentionDropdownVisible = useMemo(() => {
    return showMentionSuggestions && mentionSuggestions.length > 0;
  }, [showMentionSuggestions, mentionSuggestions]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentInput.trim()) return;

    try {
      setSendingComment(true);

      await axios.post(`${API_BASE}/api/recognitions/${recognitionId}/comments`, {
        user_id: currentUserId,
        comment: commentInput,
        parent_comment_id: null,
      });

      setCommentInput('');
      setMentionSuggestions([]);
      setShowMentionSuggestions(false);
      setMentionQuery('');
      fetchComments();
      onCommentAdded?.(recognitionId);
    } catch (error) {
      console.error('Error al enviar comentario:', error);
      setCommentNotice(error.response?.data?.error || 'No se pudo enviar el comentario.');
      setTimeout(() => setCommentNotice(''), 3500);
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

      await axios.post(`${API_BASE}/api/recognitions/${recognitionId}/comments`, {
        user_id: currentUserId,
        comment: replyText,
        parent_comment_id: commentId,
      });

      setReplyInputs((prev) => ({
        ...prev,
        [commentId]: '',
      }));

      setMentionSuggestions([]);
      setShowMentionSuggestions(false);
      setMentionQuery('');
      setReplyingToId(null);
      fetchComments();
      onCommentAdded?.(recognitionId);
    } catch (error) {
      console.error('Error al responder comentario:', error);
      setCommentNotice(error.response?.data?.error || 'No se pudo enviar la respuesta.');
      setTimeout(() => setCommentNotice(''), 3500);
    } finally {
      setReplyLoadingMap((prev) => ({
        ...prev,
        [commentId]: false,
      }));
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    if (!currentUserId) return;
    try {
      setLikingComments((prev) => ({ ...prev, [commentId]: true }));
      await axios.post(`${API_BASE}/api/recognitions/comments/${commentId}/like`, {
        user_id: currentUserId,
      });
      await fetchComments();
    } catch (error) {
      console.error('Error al dar like al comentario:', error);
      setCommentNotice(error.response?.data?.error || 'No se pudo actualizar el like.');
      setTimeout(() => setCommentNotice(''), 3500);
    } finally {
      setLikingComments((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUserId || !commentId) return;

    try {
      setDeletingComments((prev) => ({ ...prev, [commentId]: true }));
      const response = await axios.delete(`${API_BASE}/api/recognitions/comments/${commentId}`, {
        data: { user_id: currentUserId },
      });
      await fetchComments();
      onCommentDeleted?.(recognitionId, Number(response.data?.deleted_count || 1));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      setCommentNotice(error.response?.data?.error || 'No se pudo eliminar el comentario.');
      setTimeout(() => setCommentNotice(''), 3500);
    } finally {
      setDeletingComments((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const renderMentionDropdown = () => {
    if (!mentionDropdownVisible) return null;

    return (
      <div className="mention-suggestions-dropdown">
        {mentionSuggestions.map((user) => {
          const handle = user.email?.split('@')[0] || '';

          return (
            <button
              key={user.id}
              type="button"
              className="mention-suggestion-item"
              onClick={() => handleSelectMention(user)}
            >
              <div className="mention-suggestion-avatar">
                {user.profile_image_url ? (
                  <img
                    src={resolveImageUrl(user.profile_image_url)}
                    alt={user.display_name || user.fullname}
                    className="mention-suggestion-avatar-image"
                  />
                ) : (
                  <div className="mention-suggestion-avatar-fallback">
                    {getInitials(user.display_name || user.fullname)}
                  </div>
                )}
              </div>

              <div className="mention-suggestion-meta">
                <strong>{user.display_name || user.fullname}</strong>
                <span>@{handle}</span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderCommentTree = (item, level = 0) => {
    const replies = Array.isArray(item.replies) ? item.replies : [];
    const repliesOpen = Boolean(expandedReplies[item.id]);

    return (
      <div
        key={item.id}
        className={`comment-thread level-${level}`}
        style={{
          marginLeft: level > 0 ? `${Math.min(level * 18, 42)}px` : '0px',
        }}
      >
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
            <div className="comment-profile-card">
              {item.profile_image_url ? (
                <img src={resolveImageUrl(item.profile_image_url)} alt={item.user_name} />
              ) : (
                <span>{getInitials(item.user_name)}</span>
              )}
              <div>
                <strong>{item.user_name}</strong>
                <small>{item.email ? `@${item.email.split('@')[0]}` : 'Perfil Tec You'}</small>
              </div>
            </div>
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
              {item.is_author && <em>Autor</em>}
              {item.author_liked && <span className="comment-author-liked">❤</span>}
              <span>{formatDate(item.created_at)}</span>
            </div>

            <p>{renderCommentWithMentions(item.comment)}</p>

            <div className="comment-actions-row">
              <button
                type="button"
                className={`comment-like-action ${item.liked_by_current_user ? 'liked' : ''}`}
                onClick={() => handleToggleCommentLike(item.id)}
                disabled={Boolean(likingComments[item.id])}
              >
                Me gusta
              </button>
              <button
                type="button"
                className="comment-reply-toggle-btn"
                onClick={() =>
                  setReplyingToId((prev) => (prev === item.id ? null : item.id))
                }
              >
                {replyingToId === item.id ? 'Cancelar' : 'Responder'}
              </button>
              {Number(item.user_id) === Number(currentUserId) && (
                <button
                  type="button"
                  className="comment-delete-action"
                  onClick={() => handleDeleteComment(item.id)}
                  disabled={Boolean(deletingComments[item.id])}
                >
                  {deletingComments[item.id] ? 'Eliminando...' : <><Trash2 size={14} /> Eliminar</>}
                </button>
              )}
              {Number(item.user_id) !== Number(currentUserId) && (
                <button
                  type="button"
                  className="comment-report-action"
                  onClick={() => setReportingComment(item)}
                >
                  <Flag size={14} /> Reportar
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`comment-side-like ${item.liked_by_current_user ? 'liked' : ''}`}
            onClick={() => handleToggleCommentLike(item.id)}
            disabled={Boolean(likingComments[item.id])}
            title="Me gusta"
          >
            <span><Heart size={19} fill={item.liked_by_current_user ? 'currentColor' : 'none'} /></span>
            <strong>{Number(item.like_count || 0)}</strong>
          </button>
        </div>

        {replyingToId === item.id && (
          <div className="reply-form-wrap">
            <textarea
              className="reply-input"
              placeholder={`Responder a ${item.user_name}... Usa @ para mencionar`}
              value={replyInputs[item.id] || ''}
              onChange={(e) => handleReplyInputChange(item.id, e.target.value)}
            />

            {mentionTarget.type === 'reply' &&
              mentionTarget.commentId === item.id &&
              renderMentionDropdown()}

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

        {replies.length > 0 && (
          <>
            <button
              type="button"
              className="view-replies-btn"
              onClick={() =>
                setExpandedReplies((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
            >
              {repliesOpen ? 'Ocultar respuestas' : `Ver ${replies.length} respuesta${replies.length === 1 ? '' : 's'}`}
            </button>
            {repliesOpen && (
              <div className="reply-list">
                {replies.map((reply) => renderCommentTree(reply, level + 1))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="comments-block">
      <div className="comments-topbar">
          <button
            type="button"
            className="comments-toggle-btn"
            onClick={() => setShowComments((prev) => !prev)}
            aria-label="Abrir comentarios"
          >
          {showComments ? 'Ocultar comentarios' : `Ver comentarios (${Number(recognition?.comment_count || 0)})`}
        </button>
      </div>

      {showComments && createPortal(
        <div className="instagram-comments-overlay" onClick={() => setShowComments(false)}>
        <div className="comments-panel instagram-comments-panel" onClick={(event) => event.stopPropagation()}>
          <section className="instagram-comments-post-preview">
            {activeMedia ? (
              <div className="instagram-comments-media">
                {activeMedia.media_type === 'video' ? (
                  <video src={activeMedia.fullUrl} controls />
                ) : (
                  <img src={activeMedia.fullUrl} alt="Contenido de la publicacion" />
                )}
                {recognitionMedia.length > 1 && (
                  <>
                    <button type="button" className="instagram-comments-media-nav prev" onClick={() => goToMedia(activeMediaIndex - 1)} aria-label="Medio anterior">
                      {'\u2039'}
                    </button>
                    <button type="button" className="instagram-comments-media-nav next" onClick={() => goToMedia(activeMediaIndex + 1)} aria-label="Siguiente medio">
                      {'\u203A'}
                    </button>
                    <div className="instagram-comments-media-dots">
                      {recognitionMedia.map((item, index) => (
                        <button
                          key={item.id || index}
                          type="button"
                          className={index === activeMediaIndex ? 'active' : ''}
                          onClick={() => goToMedia(index)}
                          aria-label={`Ver medio ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="instagram-comments-text-preview">
                <strong>{recognition?.sender_name}</strong>
                <p>{recognition?.message}</p>
              </div>
            )}
          </section>
          <div className="instagram-comments-header">
            <span />
            <strong>Comentarios</strong>
            <button type="button" className="instagram-comments-close-header" onClick={() => setShowComments(false)} aria-label="Cerrar comentarios">
              <X size={20} />
            </button>
          </div>
          {commentNotice && <div className="comment-inline-notice">{commentNotice}</div>}
          <div className="instagram-comments-caption">
            <strong>{recognition?.sender_name}</strong>
            <span>{recognition?.message}</span>
          </div>
          <div className="comments-list">
            {loadingComments ? (
              <p className="comments-empty">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="comments-empty">Aún no hay comentarios.</p>
            ) : (
              comments.map((item) => renderCommentTree(item))
            )}
          </div>

          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              className="comment-input"
              placeholder="Escribe un comentario positivo... Usa @ para mencionar"
              value={commentInput}
              onChange={(e) => handleCommentInputChange(e.target.value)}
            />

            {mentionTarget.type === 'comment' && renderMentionDropdown()}

            <button type="submit" className="comment-submit-btn" disabled={sendingComment}>
              {sendingComment ? 'Comentando...' : <><Send size={17} /> Comentar</>}
            </button>
          </form>
        </div>
        </div>
        , document.body
      )}
      {reportNotice && <div className="comment-report-notice">{reportNotice}</div>}
      {reportingComment && (
        <ReportDialog
          targetType="comment"
          targetId={reportingComment.id}
          title="Reportar comentario"
          author={reportingComment.user_name}
          preview={reportingComment.comment}
          onClose={() => setReportingComment(null)}
          onSuccess={(message) => {
            setReportNotice(message);
            setTimeout(() => setReportNotice(''), 3500);
          }}
        />
      )}
    </div>
  );
}

export default RecognitionComments;

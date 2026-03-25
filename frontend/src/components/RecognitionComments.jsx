import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function RecognitionComments({ recognitionId, currentUserId, onOpenProfile }) {
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});
  const [replyLoadingMap, setReplyLoadingMap] = useState({});

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionTarget, setMentionTarget] = useState({
    type: 'comment',
    commentId: null,
  });
  const [mentionQuery, setMentionQuery] = useState('');

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

            <p>{renderCommentWithMentions(item.comment)}</p>

            <div className="comment-actions-row">
              <button
                type="button"
                className="comment-reply-toggle-btn"
                onClick={() =>
                  setReplyingToId((prev) => (prev === item.id ? null : item.id))
                }
              >
                {replyingToId === item.id ? 'Cancelar' : 'Responder'}
              </button>
            </div>
          </div>
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

        {Array.isArray(item.replies) && item.replies.length > 0 && (
          <div className="reply-list">
            {item.replies.map((reply) => renderCommentTree(reply, level + 1))}
          </div>
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
        >
          {showComments ? 'Ocultar comentarios' : `Ver comentarios (${comments.length})`}
        </button>
      </div>

      {showComments && (
        <div className="comments-panel">
          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              className="comment-input"
              placeholder="Escribe un comentario positivo... Usa @ para mencionar"
              value={commentInput}
              onChange={(e) => handleCommentInputChange(e.target.value)}
            />

            {mentionTarget.type === 'comment' && renderMentionDropdown()}

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
              comments.map((item) => renderCommentTree(item))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecognitionComments;
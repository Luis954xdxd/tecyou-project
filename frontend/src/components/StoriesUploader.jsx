import React, { useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function StoriesUploader({ currentUser, onStoryUploaded }) {
  const fileInputRef = useRef(null);
  const [storyText, setStoryText] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('storyMedia', file);
      formData.append('user_id', currentUser.id);
      formData.append('text_content', storyText);

      await axios.post(`${API_BASE}/api/stories/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStoryText('');
      e.target.value = '';

      if (onStoryUploaded) {
        await onStoryUploaded();
      }
    } catch (error) {
      console.error('Error subiendo historia:', error);
      alert(error.response?.data?.error || 'No se pudo subir la historia.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="stories-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <input
        type="text"
        className="stories-text-input"
        placeholder="Texto opcional para tu historia..."
        value={storyText}
        onChange={(e) => setStoryText(e.target.value)}
      />

      <button
        type="button"
        className="stories-upload-btn"
        onClick={handlePickFile}
        disabled={uploading}
      >
        {uploading ? 'Subiendo...' : '＋ Subir historia'}
      </button>
    </div>
  );
}

export default StoriesUploader;
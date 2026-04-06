import React, { useRef, useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';

function StoriesUploader({ currentUser, onStoryUploaded }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [storyText, setStoryText] = useState('');

  const openFilePicker = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser?.id) {
      alert('No se encontró el usuario actual.');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('storyMedia', file);
      formData.append('user_id', currentUser.id);
      formData.append('caption', storyText || '');
      formData.append('duration_seconds', 5);
      formData.append('visibility_type', 'public');
      formData.append('selected_users', JSON.stringify([]));
      formData.append('excluded_users', JSON.stringify([]));

      const response = await axios.post(
        `${API_BASE}/api/stories/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Historia subida correctamente:', response.data);

      setStoryText('');
      e.target.value = '';

      if (onStoryUploaded) {
        await onStoryUploaded();
      }
    } catch (error) {
      console.error('Error subiendo historia:', error);
      console.error('Respuesta backend:', error.response?.data);

      alert(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'No se pudo subir la historia.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="stories-uploader">
      <div className="stories-uploader-top">
        <button
          type="button"
          className="story-upload-circle"
          onClick={openFilePicker}
          disabled={uploading}
          title="Subir historia"
        >
          {uploading ? '...' : '+'}
        </button>

        <div className="stories-uploader-meta">
          <strong>Tu historia</strong>
          <input
            type="text"
            className="stories-text-input"
            placeholder="Texto opcional para tu historia..."
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default StoriesUploader;
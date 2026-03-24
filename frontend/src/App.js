import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import RecognitionForm from './components/RecognitionForm';
import UsersDirectory from './components/UsersDirectory';
import ActivityPanel from './components/ActivityPanel';
import NotificationsPanel from './components/NotificationsPanel';
import NotificationsBell from './components/NotificationsBell';
import RecognitionComments from './components/RecognitionComments';
import GlobalSectionSearch from './components/GlobalSectionSearch';
import ProfileDropdown from './components/ProfileDropdown';
import ProfilePage from './pages/ProfilePage';
import logoTSJ from './assets/logo-tsj.png';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './styles/auth.css';
import {clearUserSession,getUserSession,saveUserSession,} from './utils/authStorage';

const API_BASE = 'http://localhost:5000';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('tec_you_dark_mode');
    return saved === 'true';
  });

  const [user, setUser] = useState(() => getUserSession());
  const [recognitions, setRecognitions] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const [displayName, setDisplayName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileTags, setProfileTags] = useState(['Comunidad TSJ', 'Reconocimiento positivo']);
  const [birthDate, setBirthDate] = useState('');
  const [locationText, setLocationText] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [draftDisplayName, setDraftDisplayName] = useState('');
  const [draftProfileBio, setDraftProfileBio] = useState('');
  const [draftProfileTags, setDraftProfileTags] = useState('');
  const [draftBirthDate, setDraftBirthDate] = useState('');
  const [draftLocationText, setDraftLocationText] = useState('');

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const [reactionTotals, setReactionTotals] = useState({});
  const [reactionUsersMap, setReactionUsersMap] = useState({});
  const [userReactionMap, setUserReactionMap] = useState({});
  const [reactingIds, setReactingIds] = useState({});
  const [openReactionPanelId, setOpenReactionPanelId] = useState(null);
  const [openReactionPickerId, setOpenReactionPickerId] = useState(null);

  const [recognitionPrefillUser, setRecognitionPrefillUser] = useState(null);

  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const reactionOptions = [
    { key: 'like', label: 'Me gusta', emoji: '👍' },
    { key: 'celebrate', label: 'Excelente', emoji: '🎉' },
    { key: 'inspire', label: 'Inspirador', emoji: '💡' },
    { key: 'love', label: 'Agradezco', emoji: '❤️' },
  ];

  useEffect(() => {
    localStorage.setItem('tec_you_dark_mode', String(darkMode));
    if (darkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');

    return () => document.body.classList.remove('dark');
  }, [darkMode]);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const normalizeRecognitionImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images.filter((img) => img && img.image_url);
  };

  const openUserProfile = (targetUserId) => {
    if (!targetUserId) return;
    if (Number(targetUserId) === Number(user?.id)) {
      navigate('/perfil');
      return;
    }
    navigate(`/perfil/${targetUserId}`);
  };

  const openImageViewer = (images, startIndex = 0) => {
    setImageViewer({
      isOpen: true,
      images,
      currentIndex: startIndex,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      images: [],
      currentIndex: 0,
    });
  };

  const goToNextImage = () => {
    setImageViewer((prev) => {
      if (!prev.images.length) return prev;
      return {
        ...prev,
        currentIndex:
          prev.currentIndex === prev.images.length - 1 ? 0 : prev.currentIndex + 1,
      };
    });
  };

  const goToPrevImage = () => {
    setImageViewer((prev) => {
      if (!prev.images.length) return prev;
      return {
        ...prev,
        currentIndex:
          prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1,
      };
    });
  };

  const sectionSearchItems = [
    { id: 'hero-section', title: 'Inicio / Resumen', description: 'Vista general', keywords: ['inicio', 'resumen', 'principal'] },
    { id: 'featured-section', title: 'Destacados', description: 'Reconocimientos destacados', keywords: ['destacados', 'top'] },
    { id: 'analytics-section', title: 'Distribución', description: 'Métricas por categoría', keywords: ['estadisticas', 'analiticas', 'categorias'] },
    { id: 'users-directory-section', title: 'Usuarios / Comunidad', description: 'Directorio y seguidores', keywords: ['usuarios', 'seguir', 'directorio'] },
    { id: 'notifications-section', title: 'Notificaciones', description: 'Centro de notificaciones', keywords: ['notificaciones', 'avisos'] },
    { id: 'activity-section', title: 'Actividad reciente', description: 'Actividad comunitaria', keywords: ['actividad', 'reciente'] },
    { id: 'profile-section', title: 'Perfil', description: 'Bloque de perfil', keywords: ['perfil', 'foto', 'bio'] },
    { id: 'recognition-form-section', title: 'Formulario', description: 'Enviar reconocimiento', keywords: ['reconocer', 'formulario'] },
    { id: 'feed-section', title: 'Reconocimientos recientes', description: 'Muro principal', keywords: ['muro', 'feed'] },
  ];

  const normalizeReactionTotals = (totalsArray) => {
    const base = { like: 0, celebrate: 0, inspire: 0, love: 0 };
    if (!Array.isArray(totalsArray)) return base;

    totalsArray.forEach((item) => {
      if (item?.reaction_type && base[item.reaction_type] !== undefined) {
        base[item.reaction_type] = Number(item.total) || 0;
      }
    });

    return base;
  };

  const fetchRecognitionReactions = async (recognitionId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/recognitions/${recognitionId}/reactions`);
      const totals = normalizeReactionTotals(response.data?.totals || []);
      const usersList = response.data?.users || [];

      setReactionTotals((prev) => ({ ...prev, [recognitionId]: totals }));
      setReactionUsersMap((prev) => ({ ...prev, [recognitionId]: usersList }));

      const currentUserReaction =
        usersList.find((item) => Number(item.user_id) === Number(user?.id))?.reaction_type || null;

      setUserReactionMap((prev) => ({ ...prev, [recognitionId]: currentUserReaction }));
    } catch (err) {
      console.error(`Error al obtener reacciones del reconocimiento ${recognitionId}:`, err);
    }
  };

  const fetchAllReactionsForFeed = async (feedItems) => {
    if (!Array.isArray(feedItems) || feedItems.length === 0 || !user?.id) {
      setReactionTotals({});
      setReactionUsersMap({});
      setUserReactionMap({});
      return;
    }

    try {
      const results = await Promise.all(
        feedItems.map(async (rec) => {
          const response = await axios.get(`${API_BASE}/api/recognitions/${rec.id}/reactions`);
          return {
            recognitionId: rec.id,
            totals: normalizeReactionTotals(response.data?.totals || []),
            users: response.data?.users || [],
          };
        })
      );

      const totalsMap = {};
      const usersMap = {};
      const myReactionMap = {};

      results.forEach((item) => {
        totalsMap[item.recognitionId] = item.totals;
        usersMap[item.recognitionId] = item.users;
        myReactionMap[item.recognitionId] =
          item.users.find((u) => Number(u.user_id) === Number(user?.id))?.reaction_type || null;
      });

      setReactionTotals(totalsMap);
      setReactionUsersMap(usersMap);
      setUserReactionMap(myReactionMap);
    } catch (err) {
      console.error('Error al obtener las reacciones del feed:', err);
    }
  };

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const response = await axios.get(`${API_BASE}/api/recognitions/feed`);
      setRecognitions(response.data);
      await fetchAllReactionsForFeed(response.data);
    } catch (err) {
      console.error('Error al obtener el feed:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      setLoadingProfile(true);
      const response = await axios.get(`${API_BASE}/api/users/profile/${userId}`);
      const profile = response.data;

      setDisplayName(profile.display_name || profile.fullname || '');
      setProfileBio(
        profile.bio ||
          'Usuario participante en la comunidad ¡Tec! ¡you!, enfocado en reconocer logros, fortalecer vínculos y visibilizar el impacto positivo dentro del TSJ.'
      );
      setProfileTags(
        Array.isArray(profile.tags) && profile.tags.length > 0
          ? profile.tags
          : ['Comunidad TSJ', 'Reconocimiento positivo']
      );

      setBirthDate(profile.birth_date || '');
      setLocationText(profile.location || '');
      setIsVerified(Boolean(profile.is_verified));
      setFollowersCount(Number(profile.followers_count || 0));
      setFollowingCount(Number(profile.following_count || 0));

      setProfileImage(resolveImageUrl(profile.profile_image_url));
      setCoverImage(resolveImageUrl(profile.cover_image_url));

      setUser((prev) => ({ ...prev, ...profile }));
    } catch (err) {
      console.error('Error al obtener el perfil:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleRefreshAllProfileData = async () => {
    if (!user?.id) return;
    await fetchUserProfile(user.id);
    await fetchFeed();
  };

  const handleAuthSuccess = (loggedUser) => {
  setUser(loggedUser);
  saveUserSession(loggedUser);
};

const handleLogout = () => {
  setUser(null);
  clearUserSession();
  navigate('/login');
};

  useEffect(() => {
    if (user?.id) {
      handleRefreshAllProfileData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (location.pathname === '/perfil' && user?.id) {
      handleRefreshAllProfileData();
    }
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (location.pathname !== '/') return;
    const onScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!imageViewer.isOpen) return;
      if (e.key === 'Escape') closeImageViewer();
      if (e.key === 'ArrowRight') goToNextImage();
      if (e.key === 'ArrowLeft') goToPrevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageViewer.isOpen]);

  const getInitials = (name) => {
    if (!name) return 'TSJ';
    return name
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCategoryMeta = (category) => {
    const categories = {
      Colaboración: { icon: '🤝', className: 'category-colaboracion' },
      Académico: { icon: '📚', className: 'category-academico' },
      Liderazgo: { icon: '⭐', className: 'category-liderazgo' },
      Creatividad: { icon: '💡', className: 'category-creatividad' },
    };
    return categories[category] || { icon: '✨', className: 'category-default' };
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      Colaboración: 0,
      Académico: 0,
      Liderazgo: 0,
      Creatividad: 0,
    };

    recognitions.forEach((rec) => {
      if (counts[rec.category] !== undefined) counts[rec.category] += 1;
    });

    return counts;
  }, [recognitions]);

  const featuredCategory = useMemo(() => {
    const entries = Object.entries(categoryCounts);
    if (!entries.length) return 'Sin datos';
    const top = entries.reduce((max, current) => (current[1] > max[1] ? current : max));
    return top[1] === 0 ? 'Sin datos' : top[0];
  }, [categoryCounts]);

  const featuredRecognitions = useMemo(() => [...recognitions].slice(0, 3), [recognitions]);

  const maxCategoryCount = useMemo(() => {
    const values = Object.values(categoryCounts);
    return Math.max(...values, 1);
  }, [categoryCounts]);

  const categorySummary = useMemo(
    () => [
      { name: 'Colaboración', value: categoryCounts.Colaboración, icon: '🤝', className: 'category-colaboracion' },
      { name: 'Académico', value: categoryCounts.Académico, icon: '📚', className: 'category-academico' },
      { name: 'Liderazgo', value: categoryCounts.Liderazgo, icon: '⭐', className: 'category-liderazgo' },
      { name: 'Creatividad', value: categoryCounts.Creatividad, icon: '💡', className: 'category-creatividad' },
    ],
    [categoryCounts]
  );

  const filteredRecognitions = useMemo(() => {
    const filtered = recognitions.filter((rec) => {
      const matchesCategory =
        selectedCategory === 'Todas' || rec.category === selectedCategory;

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        rec.sender_name?.toLowerCase().includes(query) ||
        rec.receiver_name?.toLowerCase().includes(query) ||
        rec.message?.toLowerCase().includes(query) ||
        rec.category?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'az':
        sorted.sort((a, b) => (a.sender_name || '').localeCompare(b.sender_name || '', 'es'));
        break;
      case 'category':
        sorted.sort((a, b) => (a.category || '').localeCompare(b.category || '', 'es'));
        break;
      case 'recent':
      default:
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return sorted;
  }, [recognitions, selectedCategory, searchTerm, sortBy]);

  const activeFilterLabels = useMemo(() => {
    const labels = [];
    if (selectedCategory !== 'Todas') labels.push(`Categoría: ${selectedCategory}`);
    if (searchTerm.trim() !== '') labels.push(`Búsqueda: "${searchTerm.trim()}"`);
    if (sortBy !== 'recent') {
      const map = {
        oldest: 'Orden: más antiguas',
        az: 'Orden: A-Z',
        category: 'Orden: categoría',
      };
      labels.push(map[sortBy]);
    }
    return labels;
  }, [selectedCategory, searchTerm, sortBy]);

  const categoryOptions = ['Todas', 'Colaboración', 'Académico', 'Liderazgo', 'Creatividad'];

  const recognitionsSentByUser = useMemo(() => {
    if (!user) return 0;
    return recognitions.filter((rec) => Number(rec.sender_id) === Number(user.id)).length;
  }, [recognitions, user]);

  const recognitionsReceivedByUser = useMemo(() => {
    if (!user) return 0;
    return recognitions.filter((rec) => Number(rec.receiver_id) === Number(user.id)).length;
  }, [recognitions, user]);

  const getReactionData = (recId) => {
    return reactionTotals[recId] || { like: 0, celebrate: 0, inspire: 0, love: 0 };
  };

  const getSelectedReactionMeta = (recId) => {
    const selected = userReactionMap[recId];
    return reactionOptions.find((item) => item.key === selected) || null;
  };

  const handleReactionSelect = async (recId, reactionKey) => {
    if (!user?.id) return;

    try {
      setReactingIds((prev) => ({ ...prev, [recId]: true }));

      await axios.post(`${API_BASE}/api/recognitions/${recId}/react`, {
        user_id: user.id,
        reaction_type: reactionKey,
      });

      await fetchRecognitionReactions(recId);
    } catch (err) {
      console.error('Error al guardar reacción:', err);
      alert(err.response?.data?.error || 'No se pudo guardar la reacción.');
    } finally {
      setReactingIds((prev) => ({ ...prev, [recId]: false }));
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Selecciona una imagen PNG, JPG o WEBP.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await axios.post(
        `${API_BASE}/api/users/profile/${user.id}/photo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const updatedProfile = response.data;
      setProfileImage(resolveImageUrl(updatedProfile.profile_image_url));
      setUser((prev) => ({ ...prev, ...updatedProfile }));
      await handleRefreshAllProfileData();
    } catch (err) {
      console.error('Error al subir la foto:', err);
      alert(err.response?.data?.error || 'No se pudo subir la foto de perfil.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Selecciona una imagen PNG, JPG o WEBP.');
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      const response = await axios.post(
        `${API_BASE}/api/users/profile/${user.id}/cover`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const updatedProfile = response.data;
      setCoverImage(resolveImageUrl(updatedProfile.cover_image_url));
      setUser((prev) => ({ ...prev, ...updatedProfile }));
      await handleRefreshAllProfileData();
    } catch (err) {
      console.error('Error al subir portada:', err);
      alert(err.response?.data?.error || 'No se pudo subir la portada.');
    } finally {
      e.target.value = '';
    }
  };

  const openEditProfileModal = () => {
    setDraftDisplayName(displayName || user.fullname || '');
    setDraftProfileBio(profileBio);
    setDraftProfileTags(profileTags.join(', '));
    setDraftBirthDate(birthDate || '');
    setDraftLocationText(locationText || '');
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    const cleanedTags = draftProfileTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '')
      .slice(0, 8);

    try {
      setSavingProfile(true);

      const payload = {
        display_name: draftDisplayName.trim() || user.fullname || '',
        bio: draftProfileBio.trim(),
        tags: cleanedTags.length ? cleanedTags : ['Comunidad TSJ'],
        birth_date: draftBirthDate || null,
        location: draftLocationText.trim(),
      };

      const response = await axios.put(`${API_BASE}/api/users/profile/${user.id}`, payload);
      const updatedProfile = response.data;

      setDisplayName(updatedProfile.display_name || user.fullname || '');
      setProfileBio(updatedProfile.bio || '');
      setProfileTags(
        Array.isArray(updatedProfile.tags) && updatedProfile.tags.length > 0
          ? updatedProfile.tags
          : ['Comunidad TSJ']
      );
      setBirthDate(updatedProfile.birth_date || '');
      setLocationText(updatedProfile.location || '');
      setIsVerified(Boolean(updatedProfile.is_verified));
      setProfileImage(resolveImageUrl(updatedProfile.profile_image_url));
      setCoverImage(resolveImageUrl(updatedProfile.cover_image_url));

      setUser((prev) => ({ ...prev, ...updatedProfile }));
      setShowEditProfileModal(false);
      await handleRefreshAllProfileData();
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      alert(err.response?.data?.error || 'No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const renderReactionUsersPanel = (recId) => {
    const usersList = reactionUsersMap[recId] || [];
    if (usersList.length === 0) {
      return (
        <div className="reaction-users-panel">
          <p className="reaction-users-empty">Aún no hay reacciones.</p>
        </div>
      );
    }

    return (
      <div className="reaction-users-panel">
        <div className="reaction-users-list">
          {usersList.map((person, index) => (
            <div key={`${person.user_id}-${index}`} className="reaction-user-item">
              {person.profile_image_url ? (
                <img
                  src={resolveImageUrl(person.profile_image_url)}
                  alt={person.user_name}
                  className="reaction-user-avatar"
                />
              ) : (
                <div className="reaction-user-avatar-fallback">
                  {(person.user_name || 'TSJ')
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}

              <div className="reaction-user-meta">
                <button
                  type="button"
                  className="inline-user-link reaction-user-link"
                  onClick={() => openUserProfile(person.user_id)}
                >
                  {person.user_name}
                </button>
                <span>
                  {reactionOptions.find((r) => r.key === person.reaction_type)?.emoji}{' '}
                  {reactionOptions.find((r) => r.key === person.reaction_type)?.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReactionBar = (recId) => {
    const selectedMeta = getSelectedReactionMeta(recId);
    const reactionData = getReactionData(recId);
    const isReacting = reactingIds[recId];
    const isPickerOpen = openReactionPickerId === recId;

    return (
      <div className="reaction-block">
        <div className="reaction-picker-stable">
          <button
            type="button"
            className={`reaction-main-btn ${selectedMeta ? 'active' : ''}`}
            disabled={isReacting}
            onClick={() => setOpenReactionPickerId((prev) => (prev === recId ? null : recId))}
          >
            <span className="reaction-main-icon">{selectedMeta ? selectedMeta.emoji : '✨'}</span>
            <span>{isReacting ? 'Guardando...' : selectedMeta ? selectedMeta.label : 'Reaccionar'}</span>
          </button>

          {isPickerOpen && !isReacting && (
            <div className="reaction-picker-panel">
              <div className="reaction-picker-panel-header">
                <strong>Selecciona una reacción</strong>
                <button
                  type="button"
                  className="reaction-picker-close"
                  onClick={() => setOpenReactionPickerId(null)}
                >
                  ✕
                </button>
              </div>

              <div className="reaction-picker-options">
                {reactionOptions.map((reaction) => {
                  const isSelected = userReactionMap[recId] === reaction.key;

                  return (
                    <button
                      key={reaction.key}
                      type="button"
                      className={`reaction-option-stable ${isSelected ? 'selected' : ''}`}
                      onClick={async () => {
                        await handleReactionSelect(recId, reaction.key);
                        setOpenReactionPickerId(null);
                      }}
                    >
                      <span className="reaction-option-stable-emoji">{reaction.emoji}</span>
                      <span className="reaction-option-stable-label">{reaction.label}</span>
                    </button>
                  );
                })}
              </div>

              <small className="reaction-picker-hint">
                Toca la misma reacción otra vez para quitarla.
              </small>
            </div>
          )}
        </div>

        <div className="reaction-meta-row">
          <div className="reaction-counts">
            {reactionOptions.map((reaction) => (
              <div
                key={reaction.key}
                className={`reaction-chip ${userReactionMap[recId] === reaction.key ? 'selected' : ''}`}
              >
                <span>{reaction.emoji}</span>
                <strong>{reactionData[reaction.key] || 0}</strong>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="reaction-details-btn"
            onClick={() => setOpenReactionPanelId((prev) => (prev === recId ? null : recId))}
          >
            {openReactionPanelId === recId ? 'Ocultar reacciones' : 'Ver quién reaccionó'}
          </button>
        </div>

        {openReactionPanelId === recId && renderReactionUsersPanel(recId)}
      </div>
    );
  };


 const dashboardView = user ? (
  <>
    <header className="main-nav">
      <div className="nav-content">
        <div className="nav-left">
          <div className="nav-logo-mark image-logo-shell">
            <img src={logoTSJ} alt="Logo TSJ" className="tsj-logo nav-logo" />
          </div>

          <div className="nav-title-group">
            <span className="logo-text">
              ¡Tec! <strong>¡you!</strong>
            </span>
            <small>Reconocimiento universitario</small>
          </div>
        </div>

        <GlobalSectionSearch sections={sectionSearchItems} />

        <div className="user-info">
          <NotificationsBell userId={user?.id} onOpenProfile={openUserProfile} />

          <ProfileDropdown
            user={user}
            displayName={displayName}
            profileImage={profileImage}
            getInitials={getInitials}
            openEditProfileModal={openEditProfileModal}
            fileInputRef={fileInputRef}
            onLogout={handleLogout}
            onGoToProfile={() => navigate('/perfil')}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode((prev) => !prev)}
          />
        </div>
      </div>
    </header>

    <main className="dashboard-shell">
      <section id="hero-section" className="hero-panel">
        <div>
          <p className="hero-kicker">Comunidad TSJ</p>
          <h1>Impulsa una cultura de gratitud y reconocimiento</h1>
          <p className="hero-subtext">
            Publica reconocimientos, celebra logros y fortalece la identidad de tu comunidad académica con una experiencia más clara, humana y moderna.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span>Total de reconocimientos</span>
            <strong>{recognitions.length}</strong>
          </div>
          <div className="stat-card">
            <span>Categoría destacada</span>
            <strong>{featuredCategory}</strong>
          </div>
          <div className="stat-card">
            <span>Usuario activo</span>
            <strong>{(displayName || user?.fullname || '').split(' ')[0]}</strong>
          </div>
        </div>
      </section>

      <section id="featured-section" className="featured-section">
        <div className="featured-header">
          <div>
            <p className="section-label">Destacados</p>
            <h2>Reconocimientos recientes con mayor visibilidad</h2>
          </div>
          <p className="featured-subtext">
            Una selección visual de mensajes que fortalecen la cultura de gratitud dentro del TSJ.
          </p>
        </div>

        <div className="featured-grid">
          {featuredRecognitions.length === 0 ? (
            <div className="featured-empty">
              <div className="empty-icon">✦</div>
              <h3>Aún no hay destacados</h3>
              <p>Cuando existan reconocimientos, aparecerán aquí de forma destacada.</p>
            </div>
          ) : (
            featuredRecognitions.map((rec, index) => {
              const categoryMeta = getCategoryMeta(rec.category);
              const recImages = normalizeRecognitionImages(rec.images).map((img) => ({
                ...img,
                fullUrl: resolveImageUrl(img.image_url),
              }));

              return (
                <article
                  key={rec.id}
                  className={`featured-card ${categoryMeta.className} ${
                    index === 0 ? 'featured-card-large' : ''
                  }`}
                >
                  <div className="featured-card-top">
                    <span className={`badge-category ${categoryMeta.className}`}>
                      <span className="badge-icon">{categoryMeta.icon}</span>
                      {rec.category}
                    </span>
                    <span className="date">{formatDate(rec.created_at)}</span>
                  </div>

                  <div className="featured-card-body">
                    <div className={`recognition-icon-box ${categoryMeta.className}`}>
                      {categoryMeta.icon}
                    </div>

                    <div>
                      <p className="featured-main-text">
                        <button
                          type="button"
                          className="inline-user-link"
                          onClick={() => openUserProfile(rec.sender_id)}
                        >
                          {rec.sender_name}
                        </button>{' '}
                        reconoció a{' '}
                        <button
                          type="button"
                          className="inline-user-link"
                          onClick={() => openUserProfile(rec.receiver_id)}
                        >
                          {rec.receiver_name}
                        </button>
                      </p>

                      <p className="featured-message-text">“{rec.message}”</p>

                      {recImages.length > 0 && (
                        <div className="recognition-images-grid">
                          {recImages.map((image, imageIndex) => (
                            <button
                              key={image.id}
                              type="button"
                              className="recognition-image-card"
                              onClick={() => openImageViewer(recImages, imageIndex)}
                            >
                              <img
                                src={image.fullUrl}
                                alt="Imagen del reconocimiento"
                                className="recognition-image-thumb"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      <RecognitionComments
                        recognitionId={rec.id}
                        currentUserId={user?.id}
                        onOpenProfile={openUserProfile}
                      />

                      {renderReactionBar(rec.id)}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section id="analytics-section" className="analytics-strip">
        <div className="mini-stat">
          <span>🤝 Colaboración</span>
          <strong>{categoryCounts.Colaboración}</strong>
        </div>
        <div className="mini-stat">
          <span>📚 Académico</span>
          <strong>{categoryCounts.Académico}</strong>
        </div>
        <div className="mini-stat">
          <span>⭐ Liderazgo</span>
          <strong>{categoryCounts.Liderazgo}</strong>
        </div>
        <div className="mini-stat">
          <span>💡 Creatividad</span>
          <strong>{categoryCounts.Creatividad}</strong>
        </div>
      </section>

      <section className="category-summary-section" id="category-summary-section">
        <div className="category-summary-card">
          <div className="category-summary-header">
            <div>
              <p className="section-label">Top categorías</p>
              <h2>Distribución actual de reconocimientos</h2>
            </div>
            <p className="category-summary-subtext">
              Visualiza rápidamente qué tipo de reconocimiento tiene mayor presencia en la comunidad.
            </p>
          </div>

          <div className="category-bars">
            {categorySummary.map((item) => {
              const widthPercentage = maxCategoryCount > 0
                ? (item.value / maxCategoryCount) * 100
                : 0;

              return (
                <div key={item.name} className="category-bar-row">
                  <div className="category-bar-label">
                    <span className={`category-pill ${item.className}`}>
                      {item.icon} {item.name}
                    </span>
                    <strong>{item.value}</strong>
                  </div>

                  <div className="category-bar-track">
                    <div
                      className={`category-bar-fill ${item.className}`}
                      style={{ width: `${widthPercentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <UsersDirectory
        currentUserId={user?.id}
        onUserSelected={(selectedUser) => {
          setRecognitionPrefillUser(selectedUser);
          window.scrollTo({ top: 1180, behavior: 'smooth' });
        }}
        onOpenProfile={openUserProfile}
      />

      <NotificationsPanel userId={user?.id} onOpenProfile={openUserProfile} />

      <ActivityPanel userId={user?.id} />

      <section className="dashboard" id="dashboard-section">
        <aside id="profile-section" className="sidebar">
          <div className="profile-card">
            <div className="profile-cover">
              {coverImage ? (
                <img src={coverImage} alt="Portada" className="profile-cover-image" />
              ) : null}
            </div>

            <div className="profile-card-body">
              <div className="profile-avatar-wrap">
                {profileImage ? (
                  <img src={profileImage} alt="Perfil" className="profile-avatar-image" />
                ) : (
                  <div className="profile-avatar-fallback">
                    {getInitials(displayName || user?.fullname || '')}
                  </div>
                )}

                <button
                  type="button"
                  className="profile-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar foto
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleProfileImageChange}
                  className="hidden-file-input"
                />
              </div>

              <div className="profile-main-info">
                <div className="profile-status-row">
                  <span className="profile-status-dot"></span>
                  <span className="profile-status-text">
                    {loadingProfile ? 'Cargando perfil...' : 'Activo en la plataforma'}
                  </span>
                </div>

                <h3>{displayName || user?.fullname || ''}</h3>
                <p className="profile-email">{user?.email || ''}</p>

                <div className="profile-extra-meta">
                  {locationText && <span className="profile-extra-chip">📍 {locationText}</span>}
                  {birthDate && (
                    <span className="profile-extra-chip">
                      🎂{' '}
                      {new Date(birthDate).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <div className="profile-tags">
                  {profileTags.map((tag) => (
                    <span key={tag} className="profile-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="profile-bio">{profileBio}</p>

                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={openEditProfileModal}
                >
                  Editar perfil
                </button>
              </div>

              <div className="profile-stats-grid">
                <div className="profile-mini-stat">
                  <span>Enviados</span>
                  <strong>{recognitionsSentByUser}</strong>
                </div>
                <div className="profile-mini-stat">
                  <span>Recibidos</span>
                  <strong>{recognitionsReceivedByUser}</strong>
                </div>
                <div className="profile-mini-stat">
                  <span>Reacciones</span>
                  <strong>{Object.values(userReactionMap).filter(Boolean).length}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-header">
            <p className="section-label">Nuevo reconocimiento</p>
            <h3>Haz visible una acción positiva</h3>
          </div>

          <div id="recognition-form-section">
            <RecognitionForm
              onRecognitionSent={fetchFeed}
              senderId={user?.id}
              preselectedUser={recognitionPrefillUser}
            />
          </div>
        </aside>

        <section id="feed-section" className="feed-section">
          <div className="feed-header">
            <div>
              <p className="section-label">Muro de la comunidad</p>
              <h2>Reconocimientos recientes</h2>
            </div>
            <p className="feed-subtext">
              Explora mensajes positivos, filtra por categoría y encuentra aportes de la comunidad.
            </p>
          </div>

          <div className="feed-toolbar">
            <div className="feed-search">
              <input
                type="text"
                placeholder="Buscar por nombre, mensaje o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="feed-toolbar-row">
              <div className="category-filters">
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    className={`filter-chip ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="sort-box">
                <label htmlFor="sortSelect">Ordenar por</label>
                <select
                  id="sortSelect"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="recent">Más recientes</option>
                  <option value="oldest">Más antiguas</option>
                  <option value="az">Nombre A-Z</option>
                  <option value="category">Categoría</option>
                </select>
              </div>
            </div>
          </div>

          {activeFilterLabels.length > 0 && (
            <div className="active-filters-row">
              {activeFilterLabels.map((label) => (
                <span key={label} className="active-filter-chip">
                  {label}
                </span>
              ))}
            </div>
          )}

          <div className="feed-results-bar">
            <span>
              Mostrando <strong>{filteredRecognitions.length}</strong> resultado(s)
            </span>
            {(selectedCategory !== 'Todas' || searchTerm.trim() !== '' || sortBy !== 'recent') && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={() => {
                  setSelectedCategory('Todas');
                  setSearchTerm('');
                  setSortBy('recent');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="feed-container">
            {loadingFeed ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Cargando reconocimientos...</p>
              </div>
            ) : filteredRecognitions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✦</div>
                <h3>No se encontraron resultados</h3>
                <p>Prueba con otra categoría o cambia el texto de búsqueda.</p>
              </div>
            ) : (
              filteredRecognitions.map((rec, index) => {
                const categoryMeta = getCategoryMeta(rec.category);
                const recImages = normalizeRecognitionImages(rec.images).map((img) => ({
                  ...img,
                  fullUrl: resolveImageUrl(img.image_url),
                }));

                return (
                  <div
                    key={rec.id}
                    className={`recognition-card ${categoryMeta.className}`}
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <div className="card-top">
                      <span className={`badge-category ${categoryMeta.className}`}>
                        <span className="badge-icon">{categoryMeta.icon}</span>
                        {rec.category}
                      </span>
                      <span className="date">{formatDate(rec.created_at)}</span>
                    </div>

                    <div className="recognition-main-row">
                      <div className={`recognition-icon-box ${categoryMeta.className}`}>
                        {categoryMeta.icon}
                      </div>

                      <div className="recognition-body">
                        <p className="main-text">
                          <button
                            type="button"
                            className="inline-user-link"
                            onClick={() => openUserProfile(rec.sender_id)}
                          >
                            {rec.sender_name}
                          </button>{' '}
                          reconoció a{' '}
                          <button
                            type="button"
                            className="inline-user-link"
                            onClick={() => openUserProfile(rec.receiver_id)}
                          >
                            {rec.receiver_name}
                          </button>
                        </p>

                        <p className="message-text">“{rec.message}”</p>

                        {recImages.length > 0 && (
                          <div className="recognition-images-grid">
                            {recImages.map((image, imageIndex) => (
                              <button
                                key={image.id}
                                type="button"
                                className="recognition-image-card"
                                onClick={() => openImageViewer(recImages, imageIndex)}
                              >
                                <img
                                  src={image.fullUrl}
                                  alt="Imagen del reconocimiento"
                                  className="recognition-image-thumb"
                                />
                              </button>
                            ))}
                          </div>
                        )}

                        <RecognitionComments
                          recognitionId={rec.id}
                          currentUserId={user?.id}
                          onOpenProfile={openUserProfile}
                        />

                        {renderReactionBar(rec.id)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  </>
) : null;

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <Routes>
  <Route
    path="/login"
    element={
      user ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleAuthSuccess} />
    }
  />

  <Route
    path="/registro"
    element={
      user ? <Navigate to="/" replace /> : <RegisterPage onRegisterSuccess={handleAuthSuccess} />
    }
  />

  <Route
    path="/"
    element={user ? dashboardView : <Navigate to="/login" replace />}
  />

  <Route
    path="/perfil"
    element={
      user ? (
        <ProfilePage
          currentUser={user}
          loggedInUserId={user?.id}
          recognitions={recognitions}
          onBack={() => navigate('/')}
          onOpenImageViewer={openImageViewer}
          darkMode={darkMode}
          onOpenEditProfile={openEditProfileModal}
          isOwnProfile={true}
        />
      ) : (
        <Navigate to="/login" replace />
      )
    }
  />

  <Route
    path="/perfil/:userId"
    element={
      user ? (
        <ProfilePage
          currentUser={user}
          loggedInUserId={user?.id}
          recognitions={recognitions}
          onBack={() => navigate('/')}
          onOpenImageViewer={openImageViewer}
          darkMode={darkMode}
          onOpenEditProfile={openEditProfileModal}
          isOwnProfile={false}
        />
      ) : (
        <Navigate to="/login" replace />
      )
    }
  />

  <Route
    path="*"
    element={<Navigate to={user ? '/' : '/login'} replace />}
  />
</Routes>

      {showEditProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="profile-modal premium-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-profile-modal-cover">
              {coverImage ? (
                <img src={coverImage} alt="Portada" className="premium-profile-modal-cover-image" />
              ) : null}

              <button
                type="button"
                className="premium-cover-btn"
                onClick={() => coverInputRef.current?.click()}
              >
                Cambiar portada
              </button>

              <button
                type="button"
                className="premium-profile-modal-close"
                onClick={() => setShowEditProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="premium-profile-modal-avatar-row">
              <div className="premium-profile-avatar-box">
                {profileImage ? (
                  <img src={profileImage} alt="Perfil" className="premium-profile-avatar-image" />
                ) : (
                  <div className="premium-profile-avatar-fallback">
                    {getInitials(displayName || user.fullname)}
                  </div>
                )}

                <button
                  type="button"
                  className="premium-avatar-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Cambiar foto
                </button>
              </div>

              <div className="premium-profile-verified-box">
                <span className={`premium-verified-chip ${isVerified ? 'verified' : ''}`}>
                  {isVerified ? '✔ Verificado' : '◇ Get verified'}
                </span>
              </div>
            </div>

            <div className="profile-modal-body premium-profile-modal-body">
              <div className="input-group-custom">
                <label>Nombre visible</label>
                <input
                  type="text"
                  className="form-control"
                  value={draftDisplayName}
                  onChange={(e) => setDraftDisplayName(e.target.value)}
                  placeholder="Escribe tu nombre visible"
                />
              </div>

              <div className="input-group-custom">
                <label>Biografía</label>
                <textarea
                  className="form-control form-textarea"
                  value={draftProfileBio}
                  onChange={(e) => setDraftProfileBio(e.target.value)}
                  placeholder="Describe tu perfil..."
                />
              </div>

              <div className="profile-modal-two-columns">
                <div className="input-group-custom">
                  <label>Ubicación</label>
                  <input
                    type="text"
                    className="form-control"
                    value={draftLocationText}
                    onChange={(e) => setDraftLocationText(e.target.value)}
                    placeholder="Ej. Zapopan, Jalisco"
                  />
                </div>

                <div className="input-group-custom">
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    className="form-control"
                    value={draftBirthDate}
                    onChange={(e) => setDraftBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group-custom">
                <label>Tags o intereses</label>
                <input
                  type="text"
                  className="form-control"
                  value={draftProfileTags}
                  onChange={(e) => setDraftProfileTags(e.target.value)}
                  placeholder="Ej. Comunidad TSJ, Liderazgo, Innovación"
                />
                <small className="field-hint">Separa cada tag con coma.</small>
              </div>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleCoverImageChange}
                className="hidden-file-input"
              />
            </div>

            <div className="profile-modal-footer">
              <button
                type="button"
                className="profile-secondary-btn"
                onClick={() => setShowEditProfileModal(false)}
                disabled={savingProfile}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-primary profile-save-btn"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {imageViewer.isOpen && imageViewer.images.length > 0 && (
        <div className="recognition-image-modal-overlay" onClick={closeImageViewer}>
          <div className="recognition-image-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="recognition-image-modal-close"
              onClick={closeImageViewer}
            >
              ✕
            </button>

            {imageViewer.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="recognition-image-nav-btn prev"
                  onClick={goToPrevImage}
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="recognition-image-nav-btn next"
                  onClick={goToNextImage}
                >
                  ›
                </button>
              </>
            )}

            <div className="recognition-image-modal-counter">
              {imageViewer.currentIndex + 1} / {imageViewer.images.length}
            </div>

            <img
              src={imageViewer.images[imageViewer.currentIndex].fullUrl}
              alt="Imagen ampliada del reconocimiento"
              className="recognition-image-modal-content"
            />

            {imageViewer.images.length > 1 && (
              <div className="recognition-image-modal-thumbs">
                {imageViewer.images.map((image, index) => (
                  <button
                    key={image.id || index}
                    type="button"
                    className={`recognition-image-modal-thumb-btn ${
                      imageViewer.currentIndex === index ? 'active' : ''
                    }`}
                    onClick={() =>
                      setImageViewer((prev) => ({
                        ...prev,
                        currentIndex: index,
                      }))
                    }
                  >
                    <img
                      src={image.fullUrl}
                      alt={`Miniatura ${index + 1}`}
                      className="recognition-image-modal-thumb"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showScrollTop && location.pathname === '/' && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
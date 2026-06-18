import React, { useEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import axios from 'axios';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import RecognitionForm from './components/RecognitionForm';
import RecognitionVideoPlayer from './components/RecognitionVideoPlayer';
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
import UsersPage from './pages/UsersPage';
import './styles/auth.css';
import { clearUserSession, getUserSession, saveUserSession } from './utils/authStorage';
import RecognitionPage from './pages/RecognitionPage';
import { renderTextWithHashtags } from './textFormatters';
import StoriesBar from './components/StoriesBar';
import StoryViewer from './components/StoryViewer';
import CreateStoryModal from './components/CreateStoryModal';
import FramedAvatar from './components/FramedAvatar';
import AchievementUnlockToast from './components/AchievementUnlockToast';
import ReactionBar from './components/ReactionBar';

import TecAgentChatbot from './components/TecAgentChatbot';

const API_BASE = 'http://localhost:5000';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRefs = useRef({});
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('tec_you_dark_mode');
    return saved === 'true';
  });

  // Controla si los marcos de avatar se muestran u ocultan visualmente.
const [hideAvatarFrames, setHideAvatarFrames] = useState(() => {
  return localStorage.getItem('hideAvatarFrames') === 'true';
});

  const [user, setUser] = useState(() => getUserSession());
  const [recognitions, setRecognitions] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [hashtagFilter, setHashtagFilter] = useState('');
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
  const [showRecognitionComposer, setShowRecognitionComposer] = useState(false);
  const [deletingRecognitionIds, setDeletingRecognitionIds] = useState({});
  const [deleteCandidateId, setDeleteCandidateId] = useState(null);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [showMessengerPanel, setShowMessengerPanel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [chatConversations, setChatConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatFiles, setChatFiles] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');
  const [isMessengerExpanded, setIsMessengerExpanded] = useState(false);
  const [chatImageViewer, setChatImageViewer] = useState(null);
  const [showChatExtras, setShowChatExtras] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState({});
  const [favoritingIds, setFavoritingIds] = useState({});

  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storyViewer, setStoryViewer] = useState({
    isOpen: false,
    stories: [],
    currentIndex: 0,
  });

  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [unlockQueue, setUnlockQueue] = useState([]);
  const [activeUnlockItem, setActiveUnlockItem] = useState(null);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const [storyCommentsMap, setStoryCommentsMap] = useState({});
  const [storyReactionsMap, setStoryReactionsMap] = useState({});
  const [storyViewsMap, setStoryViewsMap] = useState({});
  const [allUsers, setAllUsers] = useState([]);

  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  const profileLoadedRef = useRef(false);
  const fileInputRef = useRef(null);
  const modalProfileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const activeChatRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const reactionOptions = [
    { key: 'like', label: 'Me gusta', emoji: '\uD83D\uDC4D' },
    { key: 'celebrate', label: 'Excelente', emoji: '\uD83C\uDF89' },
    { key: 'inspire', label: 'Inspirador', emoji: '\uD83D\uDCA1' },
    { key: 'love', label: 'Agradezco', emoji: '\u2764\uFE0F' },
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
    { id: 'analytics-section', title: 'Distribuci\u00f3n', description: 'M\u00e9tricas por categor\u00eda', keywords: ['estadisticas', 'analiticas', 'categorias'] },
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
      // Antes: 3 setState separados = 3 re-renders del componente App
      // Ahora: los 3 juntos = 1 solo re-render
      unstable_batchedUpdates(() => {
        setReactionTotals(totalsMap);
        setReactionUsersMap(usersMap);
        setUserReactionMap(myReactionMap);
      });
    } catch (err) {
      console.error('Error al obtener las reacciones del feed:', err);
    }
  };

  const refreshGlobalFavorites = async () => {
    await fetchFavorites();
  };

  const fetchFeed = async () => {
    try {
      setLoadingFeed(true);
      const response = await axios.get(`${API_BASE}/api/recognitions/feed`);
      setRecognitions(response.data);
      await fetchAllReactionsForFeed(response.data);

      if (user?.id) {
        await fetchFavorites();
      }
    } catch (err) {
      console.error('Error al obtener el feed:', err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchStoryComments = async (storyId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/stories/${storyId}/comments`);
      setStoryCommentsMap((prev) => ({
        ...prev,
        [storyId]: response.data,
      }));
    } catch (error) {
      console.error('Error al obtener comentarios de historia:', error);
    }
  };

  const handleStoryComment = async (storyId, comment) => {
    try {
      await axios.post(`${API_BASE}/api/stories/${storyId}/comments`, {
        user_id: user.id,
        comment,
      });
      await fetchStoryComments(storyId);
    } catch (error) {
      console.error('Error al comentar historia:', error);
      alert(error.response?.data?.error || 'No se pudo comentar la historia.');
    }
  };

  // Cambia entre mostrar y ocultar los marcos.
// Se guarda en localStorage para que no se pierda al recargar.
const handleToggleAvatarFrames = () => {
  setHideAvatarFrames((prev) => {
    const nextValue = !prev;
    localStorage.setItem('hideAvatarFrames', String(nextValue));
    return nextValue;
  });
};

  const fetchStoryReactions = async (storyId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/stories/${storyId}/reactions`);
      setStoryReactionsMap((prev) => ({
        ...prev,
        [storyId]: response.data,
      }));
    } catch (error) {
      console.error('Error al obtener reacciones de historia:', error);
    }
  };

  const handleStoryReaction = async (storyId, reactionType) => {
    try {
      console.log('Reaccionando historia:', { storyId, reactionType, userId: user?.id });

      await axios.post(`${API_BASE}/api/stories/${storyId}/react`, {
        user_id: user.id,
        reaction_type: reactionType,
      });

      await fetchStoryReactions(storyId);
    } catch (error) {
      console.error('Error al reaccionar historia:', error);
      console.error('Respuesta backend:', error.response?.data);

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'No se pudo reaccionar a la historia.'
      );
    }
  };

  const fetchStoryViews = async (storyId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/stories/${storyId}/views`);
      setStoryViewsMap((prev) => ({
        ...prev,
        [storyId]: response.data,
      }));
    } catch (error) {
      console.error('Error al obtener vistas de historia:', error);
    }
  };

  const openStoryViewer = async (userStories, index = 0) => {
    setStoryViewer({
      isOpen: true,
      stories: userStories,
      currentIndex: index,
    });

    const story = userStories[index];
    if (!story || !user?.id) return;

    try {
      await axios.post(`${API_BASE}/api/stories/${story.id}/view`, {
        viewer_id: user.id,
      });

      await fetchStoryViews(story.id);
      await fetchStoryReactions(story.id);
      await fetchStoryComments(story.id);
    } catch (error) {
      console.error('Error al abrir historia:', error);
    }
  };

  const closeStoryViewer = () => {
    setStoryViewer({
      isOpen: false,
      stories: [],
      currentIndex: 0,
    });
  };

  const nextStory = async () => {
    if (!storyViewer.stories.length) return;

    const nextIndex = storyViewer.currentIndex + 1;

    if (nextIndex >= storyViewer.stories.length) {
      closeStoryViewer();
      return;
    }

    const nextStoryItem = storyViewer.stories[nextIndex];

    setStoryViewer((prev) => ({
      ...prev,
      currentIndex: nextIndex,
    }));

    if (user?.id && nextStoryItem) {
      try {
        await axios.post(`${API_BASE}/api/stories/${nextStoryItem.id}/view`, {
          viewer_id: user.id,
        });

        await fetchStoryViews(nextStoryItem.id);
        await fetchStoryReactions(nextStoryItem.id);
        await fetchStoryComments(nextStoryItem.id);
      } catch (error) {
        console.error('Error al avanzar historia:', error);
      }
    }
  };

  const prevStory = async () => {
    if (storyViewer.currentIndex <= 0) return;

    const prevIndex = storyViewer.currentIndex - 1;
    const prevStoryItem = storyViewer.stories[prevIndex];

    setStoryViewer((prev) => ({
      ...prev,
      currentIndex: prevIndex,
    }));

    if (user?.id && prevStoryItem) {
      try {
        await axios.post(`${API_BASE}/api/stories/${prevStoryItem.id}/view`, {
          viewer_id: user.id,
        });

        await fetchStoryViews(prevStoryItem.id);
        await fetchStoryReactions(prevStoryItem.id);
        await fetchStoryComments(prevStoryItem.id);
      } catch (error) {
        console.error('Error al retroceder historia:', error);
      }
    }
  };

  const groupedStories = useMemo(() => {
    const groups = {};

    stories.forEach((story) => {
      if (!groups[story.user_id]) {
        groups[story.user_id] = {
          user_id: story.user_id,
          fullname: story.fullname,
          display_name: story.display_name,
          profile_image_url: resolveImageUrl(story.profile_image_url),
          stories: [],
        };
      }

      groups[story.user_id].stories.push({
        ...story,
        profile_image_url: resolveImageUrl(story.profile_image_url),
      });
    });

    return Object.values(groups);
  }, [stories]);

  const fetchStories = async () => {
    try {
      if (!user?.id) return;
      const response = await axios.get(`${API_BASE}/api/stories/feed/${user.id}`);
      setStories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al obtener historias:', error);
    }
  };

  const fetchAllUsersForStories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/all`, {
        params: { currentUserId: user?.id },
      });
      setAllUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al obtener usuarios para historias:', error);
    }
  };

  const handleCreateStory = async (formData) => {
    try {
      formData.append('user_id', user.id);

      const res = await axios.post(`${API_BASE}/api/stories/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Historia creada:', res.data);

      setShowCreateStoryModal(false);
      fetchStories();
    } catch (error) {
      console.error('ERROR COMPLETO:', error);
      console.error('ERROR RESPONSE:', error.response?.data);

      alert(error.response?.data?.error || 'No se pudo subir la historia.');
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
          'Usuario participante en la comunidad \u00a1Tec! \u00a1you!, enfocado en reconocer logros, fortalecer v\u00ednculos y visibilizar el impacto positivo dentro del TSJ.'
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

      // Se elimino la condicion de cortocircuito porque bloqueaba
      // la actualizacion de equipped_frame_code (y otros campos
      // como bio, tags, location) cuando la foto y el nombre no
      // habian cambiado. Ahora siempre se hace el merge completo.
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
    await fetchStories();
    await fetchFavorites();
  };

 const handleAuthSuccess = async (loggedUser) => {
    // 1. Guardamos inmediatamente lo que devuelve el login
    //    para que la UI ya tenga algo mientras carga el perfil completo.
    setUser(loggedUser);
    saveUserSession(loggedUser);

    // 2. Hacemos fetch del perfil completo para obtener
    //    profile_image_url, equipped_frame_code, display_name, etc.
    //    actualizados, sin depender de un refresh manual.
    try {
      const response = await axios.get(
        `${API_BASE}/api/users/profile/${loggedUser.id}`
      );
      const fullProfile = response.data;

      // Merge: los datos del login + los datos completos del perfil
      const mergedUser = { ...loggedUser, ...fullProfile };
      setUser(mergedUser);
      saveUserSession(mergedUser);

      // Actualizar tambien los estados del perfil (foto, nombre, bio...)
      setDisplayName(fullProfile.display_name || fullProfile.fullname || '');
      setProfileImage(resolveImageUrl(fullProfile.profile_image_url));
      setCoverImage(resolveImageUrl(fullProfile.cover_image_url));
      setProfileBio(fullProfile.bio || '');
      setProfileTags(
        Array.isArray(fullProfile.tags) && fullProfile.tags.length > 0
          ? fullProfile.tags
          : ['Comunidad TSJ', 'Reconocimiento positivo']
      );
      setBirthDate(fullProfile.birth_date || '');
      setLocationText(fullProfile.location || '');
      setIsVerified(Boolean(fullProfile.is_verified));
      setFollowersCount(Number(fullProfile.followers_count || 0));
      setFollowingCount(Number(fullProfile.following_count || 0));
    } catch (err) {
      // Si falla el fetch del perfil no bloqueamos el login,
      // el usuario ya entro con los datos basicos.
      console.error('Error al cargar perfil completo tras login:', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    clearUserSession();
    navigate('/login');
  };

  const handleShareRecognition = async (recognition) => {
    try {
      const shareUrl = `${window.location.origin}/reconocimiento/${recognition.id}`;

      const shareText = `Mira este reconocimiento en \u00a1Tec! \u00a1you!
${recognition.sender_name} reconoci\u00f3 a ${recognition.receiver_name}
"${recognition.message}"`;

      if (navigator.share) {
        await navigator.share({
          title: '\u00a1Tec! \u00a1you! - Reconocimiento',
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert('Enlace copiado al portapapeles.');
    } catch (error) {
      console.error('Error al compartir reconocimiento:', error);
    }
  };

  const fetchChatConversations = async () => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${API_BASE}/api/chat/conversations/${user.id}`);
      setChatConversations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const fetchChatMessages = async (conversationId) => {
    if (!user?.id || !conversationId) return;
    try {
      setChatLoading(true);
      const response = await axios.get(
        `${API_BASE}/api/chat/conversations/${conversationId}/messages?userId=${user.id}`
      );
      setChatMessages(Array.isArray(response.data) ? response.data : []);
      await axios.patch(`${API_BASE}/api/chat/conversations/${conversationId}/read`, {
        user_id: user.id,
      });
      fetchChatConversations();
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const openChatWithUser = (targetUser) => {
    if (!targetUser) return;
    setShowMessengerPanel(true);
    setShowSocialMenu(false);
    setActiveChat({
      id: null,
      other_user_id: targetUser.id,
      display_name: targetUser.display_name || targetUser.fullname,
      other_profile_image: targetUser.profile_image_url,
      other_frame_code: targetUser.equipped_frame_code,
      isPendingDirect: true,
    });
    setChatMessages([]);
  };

  const openConversation = async (conversation) => {
    setActiveChat(conversation);
    await fetchChatMessages(conversation.id);
  };

  const handleChatFilesChange = (event) => {
    setChatFiles(Array.from(event.target.files || []));
  };

  const appendChatText = (text) => {
    setChatDraft((prev) => `${prev}${text}`);
  };

  const getChatFilePreview = (file) => {
    if (!file) return null;
    return URL.createObjectURL(file);
  };

  const startAudioRecording = async () => {
    if (recordingAudio) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `nota_voz_${Date.now()}.webm`, { type: 'audio/webm' });
        setChatFiles((prev) => [...prev, file]);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingAudio(false);
      };

      recorder.start();
      setRecordingAudio(true);
    } catch (error) {
      console.error('Error al grabar audio:', error);
      setChatError('No se pudo acceder al microfono. Revisa permisos del navegador.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const sendChatMessage = async () => {
    if (!user?.id || !activeChat || sendingChat) return;
    if (!chatDraft.trim() && chatFiles.length === 0) return;

    try {
      setSendingChat(true);
      setChatError('');
      const payload = new FormData();
      payload.append('sender_id', user.id);
      payload.append('content', chatDraft.trim());
      chatFiles.forEach((file) => payload.append('attachments', file));

      const url = activeChat.isPendingDirect
        ? `${API_BASE}/api/chat/direct/${activeChat.other_user_id}/messages`
        : `${API_BASE}/api/chat/conversations/${activeChat.id}/messages`;

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const nextConversationId = response.data?.conversation_id;
      setChatDraft('');
      setChatFiles([]);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';

      if (nextConversationId) {
        const updatedChat = {
          ...activeChat,
          id: nextConversationId,
          isPendingDirect: false,
        };
        setActiveChat(updatedChat);
        await fetchChatMessages(nextConversationId);
      }
      fetchChatConversations();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setChatError(error.response?.data?.error || 'No se pudo enviar el mensaje.');
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAllUsersForStories();
    }
  }, [user?.id]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (!user?.id) return;

    fetchChatConversations();

    const events = new EventSource(`${API_BASE}/api/chat/events/${user.id}`);

    events.addEventListener('presence_snapshot', (event) => {
      const snapshot = JSON.parse(event.data || '[]');
      setOnlineUsers(() =>
        snapshot.reduce((acc, item) => {
          acc[item.userId] = item;
          return acc;
        }, {})
      );
    });

    events.addEventListener('presence', (event) => {
      const item = JSON.parse(event.data || '{}');
      if (!item.userId) return;
      setOnlineUsers((prev) => ({ ...prev, [item.userId]: item }));
    });

    events.addEventListener('message', (event) => {
      const message = JSON.parse(event.data || '{}');
      if (!message.id) return;
      setChatMessages((prev) => {
        const currentChatId = activeChatRef.current?.id;
        if (Number(message.conversation_id) !== Number(currentChatId)) return prev;
        if (prev.some((item) => Number(item.id) === Number(message.id))) return prev;
        return [...prev, message];
      });
      fetchChatConversations();
    });

    events.addEventListener('notification', () => {
      window.dispatchEvent(new CustomEvent('tec-notification-refresh'));
      fetchChatConversations();
    });

    events.onerror = () => {
      console.warn('Conexi\u00f3n en tiempo real intentando reconectar...');
    };

    return () => events.close();
  }, [user?.id]);

  useEffect(()=> {
    if (user?.id && !profileLoadedRef.current){
      profileLoadedRef.current = true;
      handleRefreshAllProfileData();
    }
  },[user?.id]);

  useEffect(() => {
    if (location.pathname === '/perfil' && user?.id) {
      fetchUserProfile(user.id);
    }
  }, [location.pathname]);

 useEffect(() => {
  if (location.pathname !== '/') return;

  const onScroll = () => {
    const shouldShow = window.scrollY > 420;
    // Solo actualiza el estado si el valor realmente cambia.
    // Asi evitas re-renders en cada pixel del scroll.
    setShowScrollTop((prev) => (prev === shouldShow ? prev : shouldShow));
  };

  // { passive: true } le dice al navegador que nunca vas a bloquear
  // el scroll con preventDefault(), lo que optimiza mucho la fluidez.
  window.addEventListener('scroll', onScroll, { passive: true });
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

  useEffect(() => {
  const recognitionId = location.state?.highlightRecognitionId;

  if (!recognitionId || recognitions.length === 0) return;
  if (location.pathname !== '/') return;

  const target = recognitionRefs.current[recognitionId];

  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // ARREGLO AQUI:
    // Limpiamos el state de navegacion para que no vuelva a hacer scroll
    // cada vez que el feed se actualice.
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }
}, [location.pathname, location.state?.highlightRecognitionId, recognitions.length, navigate]);

  useEffect(() => {
    const incomingHashtag = location.state?.hashtagFilter;

    if (incomingHashtag) {
      setHashtagFilter(incomingHashtag);
    }
  }, [location.state]);

  useEffect(() => {
    if (!showUnlockToast && !activeUnlockItem && unlockQueue.length > 0) {
      const nextItem = unlockQueue[0];

      setActiveUnlockItem(nextItem);
      setShowUnlockToast(true);

      setUnlockQueue((prev) => prev.slice(1));
    }
  }, [unlockQueue, showUnlockToast, activeUnlockItem]);

  useEffect(() => {
    if (!showUnlockToast || !activeUnlockItem) return;

    const timer = setTimeout(() => {
      closeUnlockToast();
    }, 4200);

    return () => clearTimeout(timer);
  }, [showUnlockToast, activeUnlockItem]);

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
      'Colaboraci\u00f3n': { icon: '\uD83E\uDD1D', className: 'category-colaboracion' },
      'Acad\u00e9mico': { icon: '\uD83D\uDCDA', className: 'category-academico' },
      Liderazgo: { icon: '\u2B50', className: 'category-liderazgo' },
      Creatividad: { icon: '\uD83D\uDCA1', className: 'category-creatividad' },
    };
    return categories[category] || { icon: '\u2728', className: 'category-default' };
  };

  const categoryCounts = useMemo(() => {
    const counts = {
      'Colaboraci\u00f3n': 0,
      'Acad\u00e9mico': 0,
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

  const maxCategoryCount = useMemo(() => {
    const values = Object.values(categoryCounts);
    return Math.max(...values, 1);
  }, [categoryCounts]);

  const categorySummary = useMemo(
    () => [
      { name: 'Colaboraci\u00f3n', value: categoryCounts['Colaboraci\u00f3n'], icon: '\uD83E\uDD1D', className: 'category-colaboracion' },
      { name: 'Acad\u00e9mico', value: categoryCounts['Acad\u00e9mico'], icon: '\uD83D\uDCDA', className: 'category-academico' },
      { name: 'Liderazgo', value: categoryCounts.Liderazgo, icon: '\u2B50', className: 'category-liderazgo' },
      { name: 'Creatividad', value: categoryCounts.Creatividad, icon: '\uD83D\uDCA1', className: 'category-creatividad' },
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

      const activeHashtag = hashtagFilter.trim().toLowerCase();
      const matchesHashtag =
        activeHashtag === '' || rec.message?.toLowerCase().includes(activeHashtag);

      return matchesCategory && matchesSearch && matchesHashtag;
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
  }, [recognitions, selectedCategory, searchTerm, hashtagFilter, sortBy]);

  const activeFilterLabels = useMemo(() => {
    const labels = [];

    if (selectedCategory !== 'Todas') labels.push(`Categor\u00eda: ${selectedCategory}`);
    if (searchTerm.trim() !== '') labels.push(`B\u00fasqueda: "${searchTerm.trim()}"`);
    if (hashtagFilter.trim() !== '') labels.push(`Hashtag: ${hashtagFilter}`);

    if (sortBy !== 'recent') {
      const map = {
        oldest: 'Orden: m\u00e1s antiguas',
        az: 'Orden: A-Z',
        category: 'Orden: categor\u00eda',
      };
      labels.push(map[sortBy]);
    }

    return labels;
  }, [selectedCategory, searchTerm, hashtagFilter, sortBy]);

  const categoryOptions = ['Todas', 'Colaboraci\u00f3n', 'Acad\u00e9mico', 'Liderazgo', 'Creatividad'];

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

  const closeUnlockToast = () => {
    setShowUnlockToast(false);

    setTimeout(() => {
      setActiveUnlockItem(null);
    }, 250);
  };

  const enqueueUnlockItems = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setUnlockQueue((prev) => [...prev, ...items]);
  };

  const buildUnlockItemsFromProgress = (progressPayload) => {
    if (!progressPayload) return [];

    const collected = [];

    const senderAchievements = progressPayload?.sender?.newlyUnlockedAchievements || [];
    const receiverAchievements = progressPayload?.receiver?.newlyUnlockedAchievements || [];

    const senderFrames = progressPayload?.sender?.newlyUnlockedFrames || [];
    const receiverFrames = progressPayload?.receiver?.newlyUnlockedFrames || [];

    senderAchievements.forEach((achievement) => {
      collected.push({
        type: 'achievement',
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
      });
    });

    receiverAchievements.forEach((achievement) => {
      collected.push({
        type: 'achievement',
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
      });
    });

    senderFrames.forEach((frame) => {
      collected.push({
        type: 'frame',
        name: frame.name,
        title: frame.name,
        description: frame.description,
        rarity: frame.rarity,
      });
    });

    receiverFrames.forEach((frame) => {
      collected.push({
        type: 'frame',
        name: frame.name,
        title: frame.name,
        description: frame.description,
        rarity: frame.rarity,
      });
    });

    return collected;
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
      console.error('Error al guardar reacci\u00f3n:', err);
      alert(err.response?.data?.error || 'No se pudo guardar la reacci\u00f3n.');
    } finally {
      setReactingIds((prev) => ({ ...prev, [recId]: false }));
    }
  };

  const fetchFavorites = async () => {
    try {
      if (!user?.id) {
        setFavoriteIds({});
        return;
      }

      const response = await axios.get(`${API_BASE}/api/recognitions/favorites/${user.id}`);
      const favorites = Array.isArray(response.data) ? response.data : [];
      const idsMap = {};
      favorites.forEach((item) => {
        idsMap[item.id] = true;
      });

      setFavoriteIds(idsMap);
    } catch (err) {
      console.error('Error al obtener favoritos:', err);
    }
  };

  const handleFavoriteToggle = async (recognitionId) => {
    try {
      if (!user?.id) return;

      setFavoritingIds((prev) => ({ ...prev, [recognitionId]: true }));

      const isFavorite = Boolean(favoriteIds[recognitionId]);

      if (isFavorite) {
        await axios.delete(`${API_BASE}/api/recognitions/${recognitionId}/favorite`, {
          data: { user_id: user.id },
        });

        setFavoriteIds((prev) => ({
          ...prev,
          [recognitionId]: false,
        }));

      } else {
        await axios.post(`${API_BASE}/api/recognitions/${recognitionId}/favorite`, {
          user_id: user.id,
        });

        setFavoriteIds((prev) => ({
          ...prev,
          [recognitionId]: true,
        }));

        await fetchFavorites();
      }
    } catch (err) {
      console.error('Error al cambiar favorito:', err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'No se pudo actualizar el favorito.'
      );
    } finally {
      setFavoritingIds((prev) => ({ ...prev, [recognitionId]: false }));
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
      const unlockItems = buildUnlockItemsFromProgress(response.data?.progress);
      enqueueUnlockItems(unlockItems);
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
      const unlockItems = buildUnlockItemsFromProgress(response.data?.progress);
      enqueueUnlockItems(unlockItems);
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
      const unlockItems = buildUnlockItemsFromProgress(response.data?.progress);
      enqueueUnlockItems(unlockItems);
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
          <p className="reaction-users-empty">A{'\u00fa'}n no hay reacciones.</p>
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
            <span className="reaction-main-icon">{selectedMeta ? selectedMeta.emoji : '\u2728'}</span>
            <span>{isReacting ? 'Guardando...' : selectedMeta ? selectedMeta.label : 'Reaccionar'}</span>
          </button>

          {isPickerOpen && !isReacting && (
            <div className="reaction-picker-panel">
              <div className="reaction-picker-panel-header">
                <strong>Selecciona una reacci{'\u00f3'}n</strong>
                <button
                  type="button"
                  className="reaction-picker-close"
                  onClick={() => setOpenReactionPickerId(null)}
                >
                  {'\u00d7'}
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
                Toca la misma reacci{'\u00f3'}n otra vez para quitarla.
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
            {openReactionPanelId === recId ? 'Ocultar reacciones' : 'Ver qui\u00e9n reaccion\u00f3'}
          </button>
        </div>

        {openReactionPanelId === recId && renderReactionUsersPanel(recId)}
      </div>
    );
  };

  const handleRecognitionSent = async (responsePayload) => {
    await fetchFeed();
    const unlockItems = buildUnlockItemsFromProgress(responsePayload?.progress);
    enqueueUnlockItems(unlockItems);
    setShowRecognitionComposer(false);
    setRecognitionPrefillUser(null);
  };

  const handleDeleteRecognition = async (recognitionId) => {
    if (!user?.id || !recognitionId) return;

    try {
      setDeletingRecognitionIds((prev) => ({ ...prev, [recognitionId]: true }));

      await axios.delete(`${API_BASE}/api/recognitions/${recognitionId}`, {
        data: { user_id: user.id },
      });

      setRecognitions((prev) => prev.filter((item) => Number(item.id) !== Number(recognitionId)));
      setFavoriteIds((prev) => {
        const next = { ...prev };
        delete next[recognitionId];
        return next;
      });
      setReactionTotals((prev) => {
        const next = { ...prev };
        delete next[recognitionId];
        return next;
      });
      setReactionUsersMap((prev) => {
        const next = { ...prev };
        delete next[recognitionId];
        return next;
      });
      setUserReactionMap((prev) => {
        const next = { ...prev };
        delete next[recognitionId];
        return next;
      });
      setDeleteCandidateId(null);
    } catch (error) {
      console.error('Error al eliminar reconocimiento:', error);
      alert(error.response?.data?.error || 'No se pudo eliminar el reconocimiento.');
    } finally {
      setDeletingRecognitionIds((prev) => {
        const next = { ...prev };
        delete next[recognitionId];
        return next;
      });
    }
  };
  const getComposedRecognitionMedia = (mediaItems = []) => {
    if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
      return {
        primaryMedia: null,
        imageOnlyMedia: [],
        secondaryMedia: [],
        layoutType: 'empty',
        visibleSecondaryMedia: [],
        remainingCount: 0,
      };
    }

    const videoItems = mediaItems.filter((item) => item.media_type === 'video');
    const imageItems = mediaItems.filter((item) => item.media_type === 'image');

    if (videoItems.length > 0) {
      const primaryMedia = videoItems[0];
      const secondaryMedia = imageItems;
      const visibleSecondaryMedia = secondaryMedia.slice(0, 3);
      const remainingCount = Math.max(secondaryMedia.length - 3, 0);

      let layoutType = 'video-only';
      if (visibleSecondaryMedia.length === 1) layoutType = 'video-plus-1';
      if (visibleSecondaryMedia.length === 2) layoutType = 'video-plus-2';
      if (visibleSecondaryMedia.length >= 3) layoutType = 'video-plus-3';

      return {
        primaryMedia,
        imageOnlyMedia: imageItems,
        secondaryMedia,
        layoutType,
        visibleSecondaryMedia,
        remainingCount,
      };
    }

    const primaryMedia = imageItems[0] || null;
    const secondaryMedia = imageItems.slice(1);
    const visibleSecondaryMedia = secondaryMedia.slice(0, 3);
    const remainingCount = Math.max(secondaryMedia.length - 3, 0);

    let layoutType = 'image-single';
    if (imageItems.length === 2) layoutType = 'image-2';
    if (imageItems.length === 3) layoutType = 'image-3';
    if (imageItems.length >= 4) layoutType = 'image-4plus';

    return {
      primaryMedia,
      imageOnlyMedia: imageItems,
      secondaryMedia,
      layoutType,
      visibleSecondaryMedia,
      remainingCount,
    };
  };

  const renderRecognitionCard = (rec) => {
    const categoryMeta = getCategoryMeta(rec.category);
    const recMedia = Array.isArray(rec.media)
      ? rec.media.map((item) => ({
          ...item,
          fullUrl: resolveImageUrl(item.media_url),
        }))
      : [];

    const {
      primaryMedia,
      imageOnlyMedia,
      layoutType,
      remainingCount,
      visibleSecondaryMedia,
    } = getComposedRecognitionMedia(recMedia);

    const canDelete = Number(rec.sender_id) === Number(user?.id);
    const isDeleting = Boolean(deletingRecognitionIds[rec.id]);

    return (
      <article
        key={rec.id}
        ref={(el) => {
          recognitionRefs.current[rec.id] = el;
        }}
        className={`recognition-card social-post-card ${categoryMeta.className}`}
      >
        <div className="social-post-header">
          <div className="recognition-author-avatar">
            <FramedAvatar
              imageUrl={rec.sender_profile_image}
              name={rec.sender_name}
              frameCode={hideAvatarFrames ? null : rec.sender_frame_code}
              sizeClass="size-feed"
            />
          </div>

          <div className="recognition-header-meta social-post-meta">
            <p className="main-text">
              <button
                type="button"
                className="inline-user-link"
                onClick={() => openUserProfile(rec.sender_id)}
              >
                {rec.sender_name}
              </button>{' '}
              reconoci{'\u00f3'} a{' '}
              <button
                type="button"
                className="inline-user-link"
                onClick={() => openUserProfile(rec.receiver_id)}
              >
                {rec.receiver_name}
              </button>
            </p>
            <div className="social-post-submeta">
              <span>{formatDate(rec.created_at)}</span>
              <span>{'\u2022'}</span>
              <span className={`badge-category ${categoryMeta.className}`}>
                <span className="badge-icon">{categoryMeta.icon}</span>
                {rec.category}
              </span>
            </div>
          </div>

          {canDelete && (
            <button
              type="button"
              className="social-post-delete-btn"
              onClick={() => setDeleteCandidateId(rec.id)}
              disabled={isDeleting}
              title={'Eliminar publicaci\u00f3n'}
              aria-label={'Eliminar publicaci\u00f3n'}
            >
              {isDeleting ? '...' : '\u00d7'}
            </button>
          )}
        </div>

        <div className="recognition-body social-post-body">
          <p className="message-text social-post-message">
            {renderTextWithHashtags(rec.message, (tag) => {
              setHashtagFilter(`#${tag}`);
            })}
          </p>

          {recMedia.length > 0 && (
            <div className={`recognition-media-premium ${layoutType}`}>
              {primaryMedia && (
                <div className="recognition-media-premium-main">
                  {primaryMedia.media_type === 'video' ? (
                    <RecognitionVideoPlayer
                      src={primaryMedia.fullUrl}
                      className="recognition-media-premium-main-video"
                      autoPlayWhenVisible={true}
                      showDurationBadge={true}
                    />
                  ) : (
                    <button
                      type="button"
                      className="recognition-media-premium-main-button"
                      onClick={() => {
                        const imageIndex = imageOnlyMedia.findIndex(
                          (item) => item.id === primaryMedia.id
                        );
                        if (imageIndex >= 0) {
                          openImageViewer(imageOnlyMedia, imageIndex);
                        }
                      }}
                    >
                      <img
                        src={primaryMedia.fullUrl}
                        alt="Media principal del reconocimiento"
                        className="recognition-media-premium-main-image"
                      />
                    </button>
                  )}
                </div>
              )}

              {visibleSecondaryMedia.length > 0 && (
                <div className="recognition-media-premium-secondary">
                  {visibleSecondaryMedia.map((item, mediaIndex) => {
                    const isLastVisible =
                      mediaIndex === visibleSecondaryMedia.length - 1 &&
                      remainingCount > 0;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="recognition-media-premium-secondary-item"
                        onClick={() => {
                          const imageIndex = imageOnlyMedia.findIndex(
                            (mediaItem) => mediaItem.id === item.id
                          );
                          if (imageIndex >= 0) {
                            openImageViewer(imageOnlyMedia, imageIndex);
                          }
                        }}
                      >
                        <img
                          src={item.fullUrl}
                          alt={`Media secundaria ${mediaIndex + 1}`}
                          className="recognition-media-premium-secondary-image"
                        />

                        {isLastVisible && (
                          <div className="recognition-media-premium-overlay">
                            +{remainingCount}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="social-post-actions-row">
            <button
              type="button"
              className={`recognition-favorite-btn ${favoriteIds[rec.id] ? 'is-favorite' : ''}`}
              onClick={() => handleFavoriteToggle(rec.id)}
              disabled={Boolean(favoritingIds[rec.id])}
            >
              {favoritingIds[rec.id]
                ? 'Guardando...'
                : favoriteIds[rec.id]
                ? '\u2605 Guardado'
                : '\u2606 Guardar'}
            </button>

            <button
              type="button"
              className="recognition-share-btn"
              onClick={() => handleShareRecognition(rec)}
            >
              Compartir
            </button>
          </div>

          <ReactionBar
            recId={rec.id}
            userId={user?.id}
            initialTotals={reactionTotals[rec.id]}
            initialUserReaction={userReactionMap[rec.id]}
            initialUsers={reactionUsersMap[rec.id]}
            resolveImageUrl={resolveImageUrl}
            openUserProfile={openUserProfile}
          />

          <RecognitionComments
            recognitionId={rec.id}
            currentUserId={user?.id}
            onOpenProfile={openUserProfile}
          />
        </div>
      </article>
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
                {'\u00a1'}Tec! <strong>{'\u00a1'}you!</strong>
              </span>
              <small>Reconocimiento universitario</small>
            </div>
          </div>

          <GlobalSectionSearch sections={sectionSearchItems} />

          <div className="user-info">
            <button
              type="button"
              className={`nav-social-action-btn ${showSocialMenu ? 'active' : ''}`}
              onClick={() => {
                setShowSocialMenu((prev) => !prev);
                setShowMessengerPanel(false);
              }}
              title="Menu"
              aria-label="Abrir menu"
            >
              <span className="nav-social-action-icon">{'\u25A6'}</span>
            </button>
            <button
              type="button"
              className={`nav-social-action-btn ${showMessengerPanel ? 'active' : ''}`}
              onClick={() => {
                setShowMessengerPanel((prev) => !prev);
                setShowSocialMenu(false);
              }}
              title="Mensajes"
              aria-label="Abrir mensajes"
            >
              <span className="nav-social-action-icon">{'\u2709'}</span>
              <span className="nav-social-badge">1</span>
            </button>
            <button
            type="button"
            className="nav-users-icon-btn"
            onClick={() => navigate('/usuarios')}
            title="Comunidad"
            aria-label="Ver usuarios"
            >
            {'\uD83D\uDC65'}
            </button>
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
              hideAvatarFrames={hideAvatarFrames}
              onToggleAvatarFrames={handleToggleAvatarFrames}
            />
          </div>
        </div>
      </header>

      <main className="dashboard-shell social-dashboard-shell">
        <section className="social-layout" id="dashboard-section">
          <aside className="social-left-rail" aria-label="Navegacion de Tec you">
            <button type="button" className="social-profile-pill" onClick={() => navigate('/perfil')}>
              <FramedAvatar
                imageUrl={profileImage || user?.profile_image_url}
                name={displayName || user?.display_name || user?.fullname}
                frameCode={hideAvatarFrames ? null : user?.equipped_frame_code}
                sizeClass="size-nav"
              />
              <span>{displayName || user?.fullname || 'Mi perfil'}</span>
            </button>

            <button type="button" className="social-rail-item" onClick={() => setShowRecognitionComposer(true)}>
              <span className="social-rail-icon">{'\u2728'}</span>
              Crear reconocimiento
            </button>
            <button type="button" className="social-rail-item" onClick={() => navigate('/usuarios')}>
              <span className="social-rail-icon">{'\uD83D\uDC65'}</span>
              Comunidad
            </button>
            <button type="button" className="social-rail-item" onClick={() => setShowCreateStoryModal(true)}>
              <span className="social-rail-icon">{'\u25A3'}</span>
              Crear historia
            </button>
            <button type="button" className="social-rail-item" onClick={() => setHashtagFilter('')}>
              <span className="social-rail-icon">#</span>
              Explorar muro
            </button>

            <div className="social-rail-card">
              <span>Total de reconocimientos</span>
              <strong>{recognitions.length}</strong>
            </div>
            <div className="social-rail-card">
              <span>Categor{'\u00ed'}a destacada</span>
              <strong>{featuredCategory}</strong>
            </div>
            <div className="social-rail-card social-profile-summary">
              <span>{loadingProfile ? 'Perfil actualiz\u00e1ndose' : 'Tu actividad'}</span>
              <strong>{recognitionsSentByUser} enviados</strong>
              <small>{recognitionsReceivedByUser} recibidos</small>
            </div>
            <div className="social-rail-card social-category-summary">
              <span>Top categor{'\u00ed'}as</span>
              {categorySummary.map((item) => {
                const widthPercentage =
                  maxCategoryCount > 0 ? (item.value / maxCategoryCount) * 100 : 0;

                return (
                  <div key={item.name} className="social-category-mini">
                    <div>
                      <span>{item.icon} {item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="social-category-mini-track">
                      <div
                        className={`social-category-mini-fill ${item.className}`}
                        style={{ width: `${widthPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          <section id="feed-section" className="feed-section social-feed-column">
            <div className="social-composer-card">
              <FramedAvatar
                imageUrl={profileImage || user?.profile_image_url}
                name={displayName || user?.display_name || user?.fullname}
                frameCode={hideAvatarFrames ? null : user?.equipped_frame_code}
                sizeClass="size-nav"
              />
              <button
                type="button"
                className="social-composer-trigger"
                onClick={() => {
                  setRecognitionPrefillUser(null);
                  setShowRecognitionComposer(true);
                }}
              >
                {'\u00bf'}A qui{'\u00e9'}n quieres reconocer hoy, {(displayName || user?.fullname || 'compa').split(' ')[0]}?
              </button>
              <button type="button" className="social-composer-action" onClick={() => setShowRecognitionComposer(true)}>
                {'\uD83D\uDCF7'}
              </button>
              <button type="button" className="social-composer-action" onClick={() => setShowRecognitionComposer(true)}>
                {'\u2728'}
              </button>
            </div>

            <section className="stories-section social-stories-section">
              {storiesLoading ? (
                <p>Cargando historias...</p>
              ) : (
                <StoriesBar
                  groupedStories={groupedStories}
                  currentUser={user}
                  onOpenStory={openStoryViewer}
                  onCreateStory={() => setShowCreateStoryModal(true)}
                  hideAvatarFrames={hideAvatarFrames}
                />
              )}
            </section>

            <div className="feed-header social-feed-header">
              <div>
                <p className="section-label">Muro Tec you</p>
                <h2>Reconocimientos recientes</h2>
              </div>
              <p className="feed-subtext">
                Celebra logros, agradece apoyo y mant{'\u00e9'}n viva la comunidad TSJ.
              </p>
            </div>

            <div className="feed-toolbar social-feed-toolbar">
              <div className="feed-search">
                <input
                  type="text"
                  placeholder={'Buscar por nombre, mensaje o categor\u00eda...'}
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
                    <option value="recent">M{'\u00e1'}s recientes</option>
                    <option value="oldest">M{'\u00e1'}s antiguas</option>
                    <option value="az">Nombre A-Z</option>
                    <option value="category">Categor{'\u00ed'}a</option>
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
              {(selectedCategory !== 'Todas' ||
                searchTerm.trim() !== '' ||
                hashtagFilter.trim() !== '' ||
                sortBy !== 'recent') && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedCategory('Todas');
                    setSearchTerm('');
                    setHashtagFilter('');
                    setSortBy('recent');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {hashtagFilter && (
              <div className="active-hashtag-filter">
                <span>Filtrando por {hashtagFilter}</span>
                <button
                  type="button"
                  className="clear-hashtag-filter-btn"
                  onClick={() => setHashtagFilter('')}
                >
                  Quitar filtro
                </button>
              </div>
            )}

            <div className="feed-container social-feed-list">
              {loadingFeed ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Cargando reconocimientos...</p>
                </div>
              ) : filteredRecognitions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">{'\u2728'}</div>
                  <h3>No se encontraron resultados</h3>
                  <p>Prueba con otra categor{'\u00ed'}a o cambia el texto de b{'\u00fa'}squeda.</p>
                </div>
              ) : (
                filteredRecognitions.map((rec) => renderRecognitionCard(rec))
              )}
            </div>
          </section>

          <aside className="social-right-rail" aria-label="Actividad de comunidad">
            <UsersDirectory
              currentUserId={user?.id}
              onUserSelected={(selectedUser) => {
                setRecognitionPrefillUser(selectedUser);
                setShowRecognitionComposer(true);
              }}
              onOpenProfile={openUserProfile}
              onOpenChat={openChatWithUser}
              onlineUsers={onlineUsers}
            />

            <NotificationsPanel userId={user?.id} onOpenProfile={openUserProfile} />
            <ActivityPanel userId={user?.id} />
          </aside>
        </section>
      </main>

      {showRecognitionComposer && (
        <div className="recognition-composer-overlay" role="dialog" aria-modal="true">
          <div className="recognition-composer-modal">
            <div className="recognition-composer-modal-header">
              <h2>Crear reconocimiento</h2>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => {
                  setShowRecognitionComposer(false);
                  setRecognitionPrefillUser(null);
                }}
                aria-label="Cerrar compositor"
              >
                {'\u00d7'}
              </button>
            </div>

            <RecognitionForm
              onRecognitionSent={handleRecognitionSent}
              senderId={user?.id}
              preselectedUser={recognitionPrefillUser}
            />
          </div>
        </div>
      )}

      {deleteCandidateId && (
        <div className="tec-confirm-overlay" role="dialog" aria-modal="true">
          <div className="tec-confirm-modal">
            <div className="tec-confirm-icon">{'\u26A0'}</div>
            <h2>Eliminar publicaci{'\u00f3'}n</h2>
            <p>
              Esta acci{'\u00f3'}n eliminar{'\u00e1'} el reconocimiento del muro de Tec You.
              No se puede deshacer.
            </p>
            <div className="tec-confirm-actions">
              <button
                type="button"
                className="tec-confirm-secondary"
                onClick={() => setDeleteCandidateId(null)}
                disabled={Boolean(deletingRecognitionIds[deleteCandidateId])}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="tec-confirm-danger"
                onClick={() => handleDeleteRecognition(deleteCandidateId)}
                disabled={Boolean(deletingRecognitionIds[deleteCandidateId])}
              >
                {deletingRecognitionIds[deleteCandidateId] ? 'Eliminando...' : 'Si, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSocialMenu && (
        <div className="tec-popover-overlay" onClick={() => setShowSocialMenu(false)}>
          <section className="tec-social-menu-panel" onClick={(e) => e.stopPropagation()}>
            <div className="tec-panel-header">
              <h2>Men{'\u00fa'}</h2>
              <button type="button" onClick={() => setShowSocialMenu(false)}>{'\u00d7'}</button>
            </div>
            <div className="tec-menu-search">Busca en el men{'\u00fa'}</div>
            <div className="tec-menu-grid">
              {[
                ['Reconocimientos', 'Publica y celebra logros de tu comunidad.'],
                ['Historias', 'Comparte momentos rapidos del Tec.'],
                ['Comunidad', 'Encuentra estudiantes, maestros y equipos.'],
                ['Grupos', 'Crea espacios por materias, proyectos o clubes.'],
                ['Eventos', 'Organiza actividades academicas y sociales.'],
                ['Guardados', 'Vuelve a reconocimientos importantes.'],
              ].map(([title, description]) => (
                <button key={title} type="button" className="tec-menu-item">
                  <span>{'\u2728'}</span>
                  <div>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {showMessengerPanel && (
        <div className="tec-popover-overlay" onClick={() => setShowMessengerPanel(false)}>
          <section
            className={`tec-messenger-panel ${isMessengerExpanded ? 'expanded' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tec-panel-header">
              <div>
                <h2>Chats</h2>
                <small>Messenger Tec You</small>
              </div>
              <div className="tec-panel-header-actions">
                <button
                  type="button"
                  onClick={() => setIsMessengerExpanded((prev) => !prev)}
                  title={isMessengerExpanded ? 'Reducir' : 'Ampliar'}
                >
                  {isMessengerExpanded ? '\u21F2' : '\u26F6'}
                </button>
                <button type="button" onClick={() => setShowMessengerPanel(false)}>{'\u00d7'}</button>
              </div>
            </div>
            <div className="tec-messenger-toolbar">
              <button type="button" onClick={fetchChatConversations}>Actualizar</button>
              <button type="button">Crear grupo</button>
              <button type="button" onClick={() => setShowChatExtras((prev) => !prev)}>
                Emojis/GIFs
              </button>
            </div>

            <div className="tec-messenger-layout">
              <div className="tec-chat-preview-list">
                {chatConversations.length === 0 ? (
                  <div className="tec-chat-empty">
                    <strong>Sin conversaciones todav{'\u00ed'}a</strong>
                    <small>Abre un chat desde la lista de contactos.</small>
                  </div>
                ) : (
                  chatConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`tec-chat-preview ${
                        Number(activeChat?.id) === Number(conversation.id) ? 'active' : ''
                      }`}
                      onClick={() => openConversation(conversation)}
                    >
                      <span className="tec-chat-avatar">
                        {conversation.other_profile_image ? (
                          <img
                            src={resolveImageUrl(conversation.other_profile_image)}
                            alt={conversation.display_name || 'Chat'}
                          />
                        ) : (
                          (conversation.display_name || 'T')[0]
                        )}
                      </span>
                      <div>
                        <strong>{conversation.display_name || 'Chat Tec You'}</strong>
                        <small>
                          {conversation.last_message_content ||
                            (conversation.last_message_type === 'image'
                              ? 'Imagen'
                              : conversation.last_message_type === 'audio'
                              ? 'Audio'
                              : 'Sin mensajes')}
                        </small>
                      </div>
                      {conversation.unread_count > 0 && (
                        <em>{conversation.unread_count}</em>
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="tec-chat-window">
                {activeChat ? (
                  <>
                    <div className="tec-chat-window-header">
                      <div className="tec-chat-title-user">
                        <span className="tec-chat-avatar header">
                          {activeChat.other_profile_image ? (
                            <img
                              src={resolveImageUrl(activeChat.other_profile_image)}
                              alt={activeChat.display_name || 'Chat'}
                            />
                          ) : (
                            (activeChat.display_name || 'T')[0]
                          )}
                        </span>
                        <div>
                          <strong>{activeChat.display_name || 'Chat Tec You'}</strong>
                          <small>
                            {onlineUsers[activeChat.other_user_id]?.online
                              ? 'Activo ahora'
                              : 'Disponible para mensajes'}
                          </small>
                        </div>
                      </div>
                      <div className="tec-chat-call-actions">
                        <button type="button" title="Llamada de voz">{'\u260E'}</button>
                        <button type="button" title="Videollamada">{'\u25B6'}</button>
                        <button type="button" title="Info">{'\u2139'}</button>
                      </div>
                    </div>

                    <div className="tec-chat-messages">
                      {chatLoading ? (
                        <p className="tec-chat-state">Cargando mensajes...</p>
                      ) : chatMessages.length === 0 ? (
                        <p className="tec-chat-state">Inicia la conversaci{'\u00f3'}n.</p>
                      ) : (
                        chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`tec-chat-bubble ${
                              Number(message.sender_id) === Number(user?.id) ? 'mine' : 'theirs'
                            }`}
                          >
                            {message.content && <p>{message.content}</p>}
                            {message.media_url && message.message_type === 'image' && (
                              <button
                                type="button"
                                className="tec-chat-image-btn"
                                onClick={() =>
                                  setChatImageViewer({
                                    src: resolveImageUrl(message.media_url),
                                    alt: 'Imagen del chat',
                                  })
                                }
                              >
                                <img src={resolveImageUrl(message.media_url)} alt="Adjunto del chat" />
                              </button>
                            )}
                            {message.media_url && message.message_type === 'audio' && (
                              <audio controls src={resolveImageUrl(message.media_url)} />
                            )}
                            {message.media_url && message.message_type === 'file' && (
                              <a href={resolveImageUrl(message.media_url)} target="_blank" rel="noreferrer">
                                Ver archivo
                              </a>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {chatFiles.length > 0 && (
                      <div className="tec-chat-attachments">
                        {chatFiles.map((file) => {
                          const preview = getChatFilePreview(file);
                          return (
                            <span key={`${file.name}-${file.size}`} className="tec-chat-file-preview">
                              {file.type.startsWith('image/') ? (
                                <img src={preview} alt={file.name} />
                              ) : file.type.startsWith('audio/') ? (
                                <audio controls src={preview} />
                              ) : (
                                file.name
                              )}
                            </span>
                          );
                        })}
                        <button type="button" onClick={() => setChatFiles([])}>Quitar</button>
                      </div>
                    )}

                    {chatError && (
                      <div className="tec-chat-error">
                        {chatError}
                      </div>
                    )}

                    {showChatExtras && (
                      <div className="tec-chat-extras">
                        <div>
                          <strong>Emojis</strong>
                          {['😀', '😂', '😍', '🥳', '😮', '😢', '🔥', '💙', '👍'].map((emoji) => (
                            <button key={emoji} type="button" onClick={() => appendChatText(emoji)}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div>
                          <strong>Stickers</strong>
                          {['Tec You ✨', 'Orgullo TSJ 💙', 'Crack 👑'].map((sticker) => (
                            <button key={sticker} type="button" onClick={() => appendChatText(` ${sticker} `)}>
                              {sticker}
                            </button>
                          ))}
                        </div>
                        <div>
                          <strong>GIFs</strong>
                          {['Celebrando', 'Aplausos', 'Gracias'].map((gif) => (
                            <button key={gif} type="button" onClick={() => appendChatText(` [GIF: ${gif}] `)}>
                              {gif}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="tec-message-composer">
                      <label>
                        {'\uD83D\uDCF7'}
                        <input
                          ref={chatFileInputRef}
                          type="file"
                          accept="image/*,audio/*,video/mp4,video/webm,video/quicktime"
                          multiple
                          onChange={handleChatFilesChange}
                        />
                      </label>
                      <button
                        type="button"
                        title={recordingAudio ? 'Detener grabacion' : 'Grabar audio'}
                        className={recordingAudio ? 'recording' : ''}
                        onClick={recordingAudio ? stopAudioRecording : startAudioRecording}
                      >
                        {'\uD83C\uDFA4'}
                      </button>
                      <button type="button" onClick={() => setShowChatExtras((prev) => !prev)}>
                        {'\uD83D\uDE00'}
                      </button>
                      <input
                        placeholder="Escribe un mensaje..."
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendChatMessage();
                          }
                        }}
                      />
                      <button type="button" onClick={sendChatMessage} disabled={sendingChat}>
                        {sendingChat ? '...' : '\u27A4'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="tec-chat-empty-window">
                    <strong>Elige una conversaci{'\u00f3'}n</strong>
                    <small>Tambien puedes abrir un chat desde Contactos.</small>
                  </div>
                )}
              </div>

              {isMessengerExpanded && (
                <aside className="tec-chat-info-panel">
                  <span className="tec-chat-avatar profile">
                    {activeChat?.other_profile_image ? (
                      <img
                        src={resolveImageUrl(activeChat.other_profile_image)}
                        alt={activeChat.display_name || 'Chat'}
                      />
                    ) : (
                      (activeChat?.display_name || 'T')[0]
                    )}
                  </span>
                  <h3>{activeChat?.display_name || 'Selecciona un chat'}</h3>
                  <p>{activeChat ? 'Activo en Tec You Messenger' : 'El perfil aparecera aqui.'}</p>
                  <div className="tec-chat-info-actions">
                    <button type="button">Perfil</button>
                    <button type="button">Silenciar</button>
                    <button type="button">Buscar</button>
                  </div>
                  <details open>
                    <summary>Multimedia y archivos</summary>
                    <small>Las imagenes del chat se pueden ampliar al tocarlas.</small>
                  </details>
                  <details>
                    <summary>Privacidad y ayuda</summary>
                    <small>Reportes y controles se pueden conectar despues.</small>
                  </details>
                </aside>
              )}
            </div>
          </section>
        </div>
      )}

      {chatImageViewer && (
        <div className="tec-chat-image-viewer" onClick={() => setChatImageViewer(null)}>
          <button type="button" onClick={() => setChatImageViewer(null)}>{'\u00d7'}</button>
          <img src={chatImageViewer.src} alt={chatImageViewer.alt} />
        </div>
      )}
    </>
  ) : null;

  return (
   <div className={`App ${darkMode ? 'dark' : ''} ${hideAvatarFrames ? 'hide-avatar-frames' : ''}`}>
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
         path="/usuarios"
          element={
        <UsersPage
         currentUserId={user?.id}
          onOpenProfile={openUserProfile}
         onUserSelected={setRecognitionPrefillUser}
         />
        }
        />

        <Route path="/" element={user ? dashboardView : <Navigate to="/login" replace />} />

        <Route
          path="/reconocimiento/:id"
          element={
            user ? (
              <RecognitionPage
                recognitions={recognitions}
                onBack={() => navigate('/')}
                onOpenImageViewer={openImageViewer}
                currentUserId={user?.id}
                onOpenProfile={openUserProfile}
                renderReactionBar={renderReactionBar}
                onFavoritesChanged={refreshGlobalFavorites}
                hideAvatarFrames={hideAvatarFrames}
                renderFavoriteButton={(recognitionId) => (
                  <div className="recognition-favorite-row">
                    <button
                      type="button"
                      className={`recognition-favorite-btn ${
                        favoriteIds[recognitionId] ? 'is-favorite' : ''
                      }`}
                      onClick={() => handleFavoriteToggle(recognitionId)}
                      disabled={Boolean(favoritingIds[recognitionId])}
                    >
                      {favoritingIds[recognitionId]
                        ? 'Guardando...'
                        : favoriteIds[recognitionId]
                        ? '\u2605 Guardado'
                        : '\u2606 Guardar'}
                    </button>
                  </div>
                )}
                onHashtagClick={(tag) => {
                  navigate('/', {
                    state: { hashtagFilter: `#${tag}` },
                  });
                }}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
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
                onFavoritesChanged={refreshGlobalFavorites}
                hideAvatarFrames={hideAvatarFrames}
                onOpenRecognition={(recognitionId) => {
                  navigate('/', {
                    state: { highlightRecognitionId: recognitionId },
                  });
                }}
                onBadgeAssigned={(badgeItem) => {
                  enqueueUnlockItems([badgeItem]);
                }}
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
        onFavoritesChanged={refreshGlobalFavorites}
        hideAvatarFrames={hideAvatarFrames}
        onOpenRecognition={(recognitionId) => {
          navigate('/', {
            state: { highlightRecognitionId: recognitionId },
          });
        }}
        onBadgeAssigned={(badgeItem) => {
          enqueueUnlockItems([badgeItem]);
        }}
      />
    ) : (
      <Navigate to="/login" replace />
    )
    }
  />

        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>{user && <TecAgentChatbot/>}

      {showEditProfileModal && (
        <div className="profile-modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div
            className="profile-modal premium-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="premium-profile-modal-cover">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Portada"
                  className="premium-profile-modal-cover-image"
                />
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
                {'\u00d7'}
              </button>
            </div>

            <div className="premium-profile-modal-avatar-row">
              <div className="premium-profile-avatar-box">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Perfil"
                    className="premium-profile-avatar-image"
                  />
                ) : (
                  <div className="premium-profile-avatar-fallback">
                    {getInitials(displayName || user.fullname)}
                  </div>
                )}

                <button
                  type="button"
                  className="premium-avatar-btn"
                  onClick={() => modalProfileInputRef.current?.click()}
                >
                  Cambiar foto
                </button>
              </div>

              <div className="premium-profile-verified-box">
                <span className={`premium-verified-chip ${isVerified ? 'verified' : ''}`}>
                  {isVerified ? '\u2714 Verificado' : '\u25C7 Get verified'}
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
                <label>Biograf{'\u00ed'}a</label>
                <textarea
                  className="form-control form-textarea"
                  value={draftProfileBio}
                  onChange={(e) => setDraftProfileBio(e.target.value)}
                  placeholder="Describe tu perfil..."
                />
              </div>

              <div className="profile-modal-two-columns">
                <div className="input-group-custom">
                  <label>Ubicaci{'\u00f3'}n</label>
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
                  placeholder={'Ej. Comunidad TSJ, Liderazgo, Innovaci\u00f3n'}
                />
                <small className="field-hint">Separa cada tag con coma.</small>
              </div>

              <input
                ref={modalProfileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleProfileImageChange}
                className="hidden-file-input"
              />

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
              {'\u00d7'}
            </button>

            {imageViewer.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="recognition-image-nav-btn prev"
                  onClick={goToPrevImage}
                >
                  {'\u2039'}
                </button>

                <button
                  type="button"
                  className="recognition-image-nav-btn next"
                  onClick={goToNextImage}
                >
                  {'\u203A'}
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

      <CreateStoryModal
        isOpen={showCreateStoryModal}
        onClose={() => setShowCreateStoryModal(false)}
        onSubmit={handleCreateStory}
        users={allUsers.filter((u) => Number(u.id) !== Number(user?.id))}
      />

      <StoryViewer
        storyViewer={storyViewer}
        onClose={closeStoryViewer}
        onNext={nextStory}
        onPrev={prevStory}
        onReact={handleStoryReaction}
        onComment={handleStoryComment}
        comments={storyCommentsMap}
        reactions={storyReactionsMap}
        views={storyViewsMap}
        currentUser={user}
      />

      {showUnlockToast && activeUnlockItem && (
        <AchievementUnlockToast item={activeUnlockItem} onClose={closeUnlockToast} />
      )}

      {showScrollTop && location.pathname === '/' && (
        <button
          type="button"
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          {'\u2191'}
        </button>
      )}
    </div>
  );
}

export default App;

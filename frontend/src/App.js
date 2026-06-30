import React, { useEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
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
import AdminPage from './pages/AdminPage';
import './styles/auth.css';
import { clearUserSession, getSessionToken, getUserSession, saveSessionToken, saveUserSession } from './utils/authStorage';
import RecognitionPage from './pages/RecognitionPage';
import { renderTextWithHashtags } from './textFormatters';
import StoriesBar from './components/StoriesBar';
import StoryViewer from './components/StoryViewer';
import CreateStoryModal from './components/CreateStoryModal';
import FramedAvatar from './components/FramedAvatar';
import AchievementUnlockToast from './components/AchievementUnlockToast';
import ReactionBar from './components/ReactionBar';
import ReportDialog from './components/ReportDialog';

import TecAgentChatbot from './components/TecAgentChatbot';

const API_BASE = 'http://localhost:5000';

const existingSessionToken = getSessionToken();
if (existingSessionToken) {
  axios.defaults.headers.common.Authorization = `Bearer ${existingSessionToken}`;
}

function LucideIcon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const icons = {
    message: (
      <>
        <path d="M22 17a2 2 0 0 1-2 2H6.8a2 2 0 0 0-1.4.6l-2.2 2.2A.7.7 0 0 1 2 21.3V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
        <path d="M7 11h10" />
        <path d="M7 15h6" />
        <path d="M7 7h8" />
      </>
    ),
    heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 2.3 1.5 4 3 5.5l7 7z" />,
    comment: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
      </>
    ),
    repeat: (
      <>
        <path d="m2 9 3-3 3 3" />
        <path d="M13 18H7a2 2 0 0 1-2-2V6" />
        <path d="m22 15-3 3-3-3" />
        <path d="M11 6h6a2 2 0 0 1 2 2v10" />
      </>
    ),
    bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
    expand: (
      <>
        <path d="M15 3h6v6" />
        <path d="m21 3-7 7" />
        <path d="M9 21H3v-6" />
        <path d="m3 21 7-7" />
      </>
    ),
    shrink: (
      <>
        <path d="M8 3v5H3" />
        <path d="m3 8 5-5" />
        <path d="M16 21v-5h5" />
        <path d="m21 16-5 5" />
      </>
    ),
    x: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
    video: (
      <>
        <path d="m16 13 5 3V8l-5 3" />
        <rect x="3" y="5" width="13" height="14" rx="2" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
    image: (
      <>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </>
    ),
    mic: (
      <>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path d="M12 19v3" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
      </>
    ),
    grid: (
      <>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </>
    ),
    flag: (
      <>
        <path d="M4 22V4a2 2 0 0 1 2-2h11l-1 5 1 5H6" />
      </>
    ),
    sparkle: (
      <>
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
        <path d="M5 3v4" />
        <path d="M3 5h4" />
        <path d="M19 17v4" />
        <path d="M17 19h4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
        <path d="M16 3.1a4 4 0 0 1 0 7.8" />
      </>
    ),
    square: (
      <>
        <rect width="16" height="16" x="4" y="4" rx="2" />
        <path d="M9 9h6v6H9z" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11 4.9" />
        <path d="M14 11a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1L13 19.1" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
}

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
  const [openPostMenuId, setOpenPostMenuId] = useState(null);
  const [reactionPanelSignalById, setReactionPanelSignalById] = useState({});
  const [repostCandidate, setRepostCandidate] = useState(null);
  const [repostComment, setRepostComment] = useState('');
  const [appToast, setAppToast] = useState(null);
  const [reportCandidate, setReportCandidate] = useState(null);
  const [reportForm, setReportForm] = useState({ reason: '', details: '' });
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportingChatMessage, setReportingChatMessage] = useState(null);
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
  const [mediaSlideByRecognition, setMediaSlideByRecognition] = useState({});

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

      const targetStory = storyViewer.stories.find((story) => Number(story.id) === Number(storyId));
      if (targetStory?.user_id && Number(targetStory.user_id) !== Number(user.id)) {
        const formData = new FormData();
        formData.append('sender_id', user.id);
        formData.append('content', `Respondio a tu historia: ${comment}`);
        await axios.post(`${API_BASE}/api/chat/direct/${targetStory.user_id}/messages`, formData);
      }

      await fetchStoryComments(storyId);
      fetchChatConversations();
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
    const allStorySequence = groupedStories.flatMap((group) => group.stories || []);
    const selectedStory = userStories[index];
    const globalIndex = allStorySequence.findIndex(
      (story) => Number(story.id) === Number(selectedStory?.id)
    );
    const storiesToShow = allStorySequence.length ? allStorySequence : userStories;
    const startIndex = globalIndex >= 0 ? globalIndex : index;

    setStoryViewer({
      isOpen: true,
      stories: storiesToShow,
      currentIndex: startIndex,
    });

    const story = storiesToShow[startIndex];
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

  const storyUserIds = useMemo(
    () => new Set(groupedStories.map((group) => Number(group.user_id))),
    [groupedStories]
  );

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

 const handleAuthSuccess = async (loggedUser, sessionToken) => {
    // 1. Guardamos inmediatamente lo que devuelve el login
    //    para que la UI ya tenga algo mientras carga el perfil completo.
    setUser(loggedUser);
    saveUserSession(loggedUser);
    saveSessionToken(sessionToken);
    if (sessionToken) axios.defaults.headers.common.Authorization = `Bearer ${sessionToken}`;

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
    delete axios.defaults.headers.common.Authorization;
    navigate('/login');
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!reportCandidate || !reportForm.reason) return;

    setSubmittingReport(true);
    try {
      const response = await axios.post(`${API_BASE}/api/reports`, {
        target_type: 'recognition',
        target_id: reportCandidate.id,
        reason: reportForm.reason,
        details: reportForm.details,
      });
      setReportCandidate(null);
      setReportForm({ reason: '', details: '' });
      setAppToast({ type: 'success', message: response.data?.message || 'Reporte enviado a moderacion.' });
    } catch (error) {
      setAppToast({
        type: 'error',
        message: error.response?.data?.error || 'No se pudo enviar el reporte.',
      });
    } finally {
      setSubmittingReport(false);
    }
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
      const sorted = Array.isArray(response.data)
        ? [...response.data].sort(
            (a, b) =>
              new Date(b.last_message_at || b.updated_at || 0) -
              new Date(a.last_message_at || a.updated_at || 0)
          )
        : [];
      setChatConversations(sorted);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const formatChatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return sameDay
      ? date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      : date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  const formatPresenceText = (presence) => {
    if (presence?.online) return 'Activo ahora';
    if (!presence?.lastSeen) return 'Disponible para mensajes';
    return `Activo ${formatChatTime(presence.lastSeen)}`;
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

  useEffect(() => {
    if (!appToast) return undefined;

    const timer = setTimeout(() => {
      setAppToast(null);
    }, 3600);

    return () => clearTimeout(timer);
  }, [appToast]);

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

  const refreshRecognitionReactions = async (recognitionId) => {
    const response = await axios.get(`${API_BASE}/api/recognitions/${recognitionId}/reactions`);
    const nextTotals = { like: 0, celebrate: 0, inspire: 0, love: 0 };
    (response.data?.totals || []).forEach((item) => {
      if (nextTotals[item.reaction_type] !== undefined) {
        nextTotals[item.reaction_type] = Number(item.total) || 0;
      }
    });
    const nextUsers = response.data?.users || [];
    const nextUserReaction =
      nextUsers.find((item) => Number(item.user_id) === Number(user?.id))?.reaction_type || null;

    setReactionTotals((prev) => ({ ...prev, [recognitionId]: nextTotals }));
    setReactionUsersMap((prev) => ({ ...prev, [recognitionId]: nextUsers }));
    setUserReactionMap((prev) => ({ ...prev, [recognitionId]: nextUserReaction }));
  };

  const handleLoveRecognition = async (recognitionId) => {
    if (!user?.id) return;
    try {
      setReactingIds((prev) => ({ ...prev, [recognitionId]: true }));
      await axios.post(`${API_BASE}/api/recognitions/${recognitionId}/react`, {
        user_id: user.id,
        reaction_type: 'love',
      });
      await refreshRecognitionReactions(recognitionId);
    } catch (err) {
      console.error('Error al reaccionar:', err);
      alert(err.response?.data?.error || 'No se pudo reaccionar.');
    } finally {
      setReactingIds((prev) => ({ ...prev, [recognitionId]: false }));
    }
  };

  const handleSubmitRepost = async () => {
    if (!user?.id || !repostCandidate?.id) return;
    try {
      const response = await axios.post(`${API_BASE}/api/recognitions/${repostCandidate.id}/repost`, {
        user_id: user.id,
        comment: repostComment,
      });
      if (response.data?.created !== false) {
        setRecognitions((prev) =>
          prev.map((rec) =>
            Number(rec.id) === Number(repostCandidate.id)
              ? { ...rec, repost_count: Number(rec.repost_count || 0) + 1 }
              : rec
          )
        );
      }
      setRepostCandidate(null);
      setRepostComment('');
      setAppToast({
        type: 'success',
        message: 'Tu repost fue agregado al perfil.',
        actionLabel: 'Ver perfil',
        onAction: () => navigate(`/perfil/${user.id}?tab=reposts`),
      });
    } catch (err) {
      console.error('Error al repostear:', err);
      setAppToast({
        type: 'error',
        message: err.response?.data?.error || 'No se pudo repostear.',
      });
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
  const renderRecognitionCard = (rec) => {
    const categoryMeta = getCategoryMeta(rec.category);
    const recMedia = Array.isArray(rec.media)
      ? rec.media.map((item) => ({
          ...item,
          fullUrl: resolveImageUrl(item.media_url),
        }))
      : [];

    const canDelete = Number(rec.sender_id) === Number(user?.id);
    const isDeleting = Boolean(deletingRecognitionIds[rec.id]);
    const reactionTotal = Object.values(reactionTotals[rec.id] || {}).reduce(
      (sum, total) => sum + Number(total || 0),
      0
    );
    const commentCount = Number(rec.comment_count || 0);
    const repostCount = Number(rec.repost_count || 0);
    const activeMediaIndex = Math.min(
      mediaSlideByRecognition[rec.id] || 0,
      Math.max(recMedia.length - 1, 0)
    );
    const activeMedia = recMedia[activeMediaIndex];
    const goToMedia = (nextIndex) => {
      if (recMedia.length <= 1) return;
      const normalized = (nextIndex + recMedia.length) % recMedia.length;
      setMediaSlideByRecognition((prev) => ({ ...prev, [rec.id]: normalized }));
    };

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
              hasStory={storyUserIds.has(Number(rec.sender_id))}
              showPreview
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

          <div className="social-post-options">
            <button
              type="button"
              className="social-post-options-btn"
              onClick={() => setOpenPostMenuId((prev) => (prev === rec.id ? null : rec.id))}
              title="Opciones"
              aria-label="Opciones de publicacion"
            >
              <LucideIcon name="more" size={22} />
            </button>
            {openPostMenuId === rec.id && (
              <div className="social-post-menu">
                <button type="button" onClick={() => navigate(`/reconocimiento/${rec.id}`)}>
                  <LucideIcon name="message" size={16} />
                  Ir a la publicacion
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/reconocimiento/${rec.id}`);
                    setOpenPostMenuId(null);
                  }}
                >
                  <LucideIcon name="link" size={16} />
                  Copiar enlace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenPostMenuId(null);
                    handleShareRecognition(rec);
                  }}
                >
                  <LucideIcon name="share" size={16} />
                  Compartir
                </button>
                {canDelete ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setOpenPostMenuId(null);
                      setDeleteCandidateId(rec.id);
                    }}
                    disabled={isDeleting}
                  >
                    <LucideIcon name="trash" size={16} />
                    {isDeleting ? 'Eliminando...' : 'Eliminar publicacion'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      setOpenPostMenuId(null);
                      setReportCandidate(rec);
                      setReportForm({ reason: '', details: '' });
                    }}
                  >
                    <LucideIcon name="flag" size={16} />
                    Denunciar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="recognition-body social-post-body">
          <p className="message-text social-post-message">
            {renderTextWithHashtags(rec.message, (tag) => {
              setHashtagFilter(`#${tag}`);
            })}
          </p>

          {activeMedia && (
            <div className="recognition-instagram-carousel">
              <div className="recognition-carousel-stage">
                {activeMedia.media_type === 'video' ? (
                  <RecognitionVideoPlayer
                    src={activeMedia.fullUrl}
                    className="recognition-carousel-video"
                    autoPlayWhenVisible={true}
                    showDurationBadge={true}
                  />
                ) : (
                  <button
                    type="button"
                    className="recognition-carousel-image-btn"
                    onClick={() => {
                      const imageOnlyMedia = recMedia.filter((item) => item.media_type === 'image');
                      const imageIndex = imageOnlyMedia.findIndex((item) => item.id === activeMedia.id);
                      if (imageIndex >= 0) openImageViewer(imageOnlyMedia, imageIndex);
                    }}
                  >
                    <img
                      src={activeMedia.fullUrl}
                      alt="Media del reconocimiento"
                      className="recognition-carousel-image"
                    />
                  </button>
                )}

                {recMedia.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="recognition-carousel-nav prev"
                      onClick={() => goToMedia(activeMediaIndex - 1)}
                      aria-label="Medio anterior"
                    >
                      {'\u2039'}
                    </button>
                    <button
                      type="button"
                      className="recognition-carousel-nav next"
                      onClick={() => goToMedia(activeMediaIndex + 1)}
                      aria-label="Siguiente medio"
                    >
                      {'\u203A'}
                    </button>
                  </>
                )}
              </div>

              {recMedia.length > 1 && (
                <div className="recognition-carousel-dots">
                  {recMedia.map((item, index) => (
                    <button
                      key={item.id || index}
                      type="button"
                      className={index === activeMediaIndex ? 'active' : ''}
                      onClick={() => goToMedia(index)}
                      aria-label={`Ver medio ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="social-post-actions-row">
            <button
              type="button"
              className={`post-icon-action ${userReactionMap[rec.id] ? 'is-reaction-active' : ''}`}
              onClick={(event) => {
                if (event.target.closest('.post-action-count')) {
                  setReactionPanelSignalById((prev) => ({
                    ...prev,
                    [rec.id]: (prev[rec.id] || 0) + 1,
                  }));
                  return;
                }
                handleLoveRecognition(rec.id);
              }}
              disabled={Boolean(reactingIds[rec.id])}
              title="Reaccionar"
            >
              <LucideIcon name="heart" size={22} />
              <span className="post-action-count">{reactionTotal}</span>
            </button>

            <button
              type="button"
              className="post-icon-action"
              title="Comentarios"
              onClick={() => {
                recognitionRefs.current[rec.id]?.querySelector('.comments-toggle-btn')?.click();
              }}
            >
              <LucideIcon name="comment" size={22} />
              <span className="post-action-count">{commentCount}</span>
            </button>

            <button
              type="button"
              className="post-icon-action"
              onClick={() => setRepostCandidate(rec)}
              title="Repostear en tu perfil"
            >
              <LucideIcon name="repeat" size={22} />
              <span className="post-action-count">{repostCount}</span>
            </button>

            <button
              type="button"
              className="post-icon-action"
              onClick={() => handleShareRecognition(rec)}
              title="Compartir enlace"
            >
              <LucideIcon name="share" size={22} />
            </button>

            <button
              type="button"
              className={`post-icon-action save ${favoriteIds[rec.id] ? 'is-favorite' : ''}`}
              onClick={() => handleFavoriteToggle(rec.id)}
              disabled={Boolean(favoritingIds[rec.id])}
              title="Guardar"
            >
              <LucideIcon name="bookmark" size={22} />
            </button>
          </div>

          <ReactionBar
            recId={rec.id}
            userId={user?.id}
            initialTotals={reactionTotals[rec.id]}
            initialUserReaction={userReactionMap[rec.id]}
            initialUsers={reactionUsersMap[rec.id]}
            openPanelSignal={reactionPanelSignalById[rec.id] || 0}
            closeSignal={location.key}
            hideMainButton
            onReactionChange={(recognitionId, nextTotals, nextUsers, nextUserReaction) => {
              setReactionTotals((prev) => ({ ...prev, [recognitionId]: nextTotals }));
              setReactionUsersMap((prev) => ({ ...prev, [recognitionId]: nextUsers }));
              setUserReactionMap((prev) => ({ ...prev, [recognitionId]: nextUserReaction }));
            }}
            resolveImageUrl={resolveImageUrl}
            openUserProfile={openUserProfile}
          />

          <RecognitionComments
            recognitionId={rec.id}
            currentUserId={user?.id}
            recognition={rec}
            resolveImageUrl={resolveImageUrl}
            onOpenProfile={openUserProfile}
            onCommentAdded={(recognitionId) => {
              setRecognitions((prev) =>
                prev.map((item) =>
                  Number(item.id) === Number(recognitionId)
                    ? { ...item, comment_count: Number(item.comment_count || 0) + 1 }
                    : item
                )
              );
            }}
            onCommentDeleted={(recognitionId, deletedCount = 1) => {
              setRecognitions((prev) =>
                prev.map((item) =>
                  Number(item.id) === Number(recognitionId)
                    ? {
                        ...item,
                        comment_count: Math.max(0, Number(item.comment_count || 0) - Number(deletedCount || 1)),
                      }
                    : item
                )
              );
            }}
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
            {['moderator', 'admin', 'super_admin'].includes(user?.system_role) && (
              <button
                type="button"
                className="nav-social-action-btn"
                onClick={() => navigate('/admin')}
                title="Panel administrativo"
                aria-label="Abrir panel administrativo"
              >
                <span className="nav-social-action-icon"><ShieldCheck size={20} /></span>
              </button>
            )}
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
              <span className="nav-social-action-icon"><LucideIcon name="grid" size={20} /></span>
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
              <span className="nav-social-action-icon"><LucideIcon name="message" size={20} /></span>
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
              hasStory={storyUserIds.has(Number(user?.id))}
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
                hasStory={storyUserIds.has(Number(user?.id))}
              />
              <span>{displayName || user?.fullname || 'Mi perfil'}</span>
            </button>

            <button type="button" className="social-rail-item" onClick={() => setShowRecognitionComposer(true)}>
              <span className="social-rail-icon"><LucideIcon name="sparkle" size={18} /></span>
              Crear reconocimiento
            </button>
            <button type="button" className="social-rail-item" onClick={() => navigate('/usuarios')}>
              <span className="social-rail-icon"><LucideIcon name="users" size={18} /></span>
              Comunidad
            </button>
            <button type="button" className="social-rail-item" onClick={() => setShowCreateStoryModal(true)}>
              <span className="social-rail-icon"><LucideIcon name="square" size={18} /></span>
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
                hasStory={storyUserIds.has(Number(user?.id))}
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
                <LucideIcon name="image" size={18} />
              </button>
              <button type="button" className="social-composer-action" onClick={() => setShowRecognitionComposer(true)}>
                <LucideIcon name="sparkle" size={18} />
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

      {reportCandidate && (
        <div
          className="tec-report-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tec-report-title"
          onMouseDown={(event) => event.target === event.currentTarget && setReportCandidate(null)}
        >
          <form className="tec-report-modal" onSubmit={handleSubmitReport}>
            <button type="button" className="tec-report-close" onClick={() => setReportCandidate(null)} aria-label="Cerrar">
              {'\u00d7'}
            </button>
            <span className="tec-report-icon"><LucideIcon name="flag" size={24} /></span>
            <h2 id="tec-report-title">Reportar publicaci{`\u00f3`}n</h2>
            <p>El equipo de moderaci{`\u00f3`}n revisar{`\u00e1`} el contenido y su contexto. El autor no sabr{`\u00e1`} qui{`\u00e9`}n envi{`\u00f3`} el reporte.</p>

            <div className="tec-report-preview">
              <strong>{reportCandidate.sender_name}</strong>
              <span>{reportCandidate.message}</span>
            </div>

            <fieldset>
              <legend>{`\u00bf`}Por qu{`\u00e9`} quieres reportarlo?</legend>
              {[
                ['harassment', 'Acoso, insultos o amenazas'],
                ['inappropriate', 'Contenido inapropiado'],
                ['impersonation', 'Suplantaci\u00f3n de identidad'],
                ['spam', 'Spam o contenido repetitivo'],
                ['false_information', 'Informaci\u00f3n falsa'],
                ['personal_information', 'Expone informaci\u00f3n personal'],
                ['other', 'Otro motivo'],
              ].map(([value, label]) => (
                <label key={value} className={reportForm.reason === value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reportForm.reason === value}
                    onChange={(event) => setReportForm((current) => ({ ...current, reason: event.target.value }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>

            <label className="tec-report-details">
              Informaci{`\u00f3`}n adicional <small>Opcional, excepto en “Otro motivo”</small>
              <textarea
                value={reportForm.details}
                onChange={(event) => setReportForm((current) => ({ ...current, details: event.target.value }))}
                placeholder="Ayuda al moderador a entender lo ocurrido..."
                maxLength={1000}
                required={reportForm.reason === 'other'}
              />
            </label>

            <div className="tec-report-actions">
              <button type="button" onClick={() => setReportCandidate(null)}>Cancelar</button>
              <button type="submit" disabled={!reportForm.reason || submittingReport}>
                {submittingReport ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </form>
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
                  <LucideIcon name={isMessengerExpanded ? 'shrink' : 'expand'} size={20} />
                </button>
                <button type="button" onClick={() => setShowMessengerPanel(false)}><LucideIcon name="x" size={20} /></button>
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
                      <span className={`tec-chat-avatar ${storyUserIds.has(Number(conversation.other_user_id)) ? 'has-story-ring' : ''}`}>
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
                      <time>{formatChatTime(conversation.last_message_at || conversation.updated_at)}</time>
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
                        <span className={`tec-chat-avatar header ${storyUserIds.has(Number(activeChat.other_user_id)) ? 'has-story-ring' : ''}`}>
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
                            {formatPresenceText(onlineUsers[activeChat.other_user_id])}
                          </small>
                        </div>
                      </div>
                      <div className="tec-chat-call-actions">
                        <button type="button" title="Llamada de voz"><LucideIcon name="phone" size={18} /></button>
                        <button type="button" title="Videollamada"><LucideIcon name="video" size={18} /></button>
                        <button type="button" title="Info"><LucideIcon name="info" size={18} /></button>
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
                            <time className="tec-chat-bubble-time">
                              {formatChatTime(message.created_at)}
                            </time>
                            {Number(message.sender_id) !== Number(user?.id) && (
                              <button
                                type="button"
                                className="tec-chat-report-message"
                                onClick={() => setReportingChatMessage(message)}
                                title="Reportar mensaje"
                              >
                                <LucideIcon name="flag" size={13} /> Reportar
                              </button>
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
                        <LucideIcon name="image" size={18} />
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
                        <LucideIcon name="mic" size={18} />
                      </button>
                      <button type="button" onClick={() => setShowChatExtras((prev) => !prev)}>
                        <LucideIcon name="smile" size={18} />
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
      {reportingChatMessage && (
        <ReportDialog
          targetType="chat_message"
          targetId={reportingChatMessage.id}
          title="Reportar mensaje"
          author={reportingChatMessage.sender_name || activeChat?.other_user_name || 'Usuario'}
          preview={reportingChatMessage.content || `Mensaje con archivo ${reportingChatMessage.message_type || ''}`}
          onClose={() => setReportingChatMessage(null)}
          onSuccess={(message) => setAppToast({ type: 'success', message })}
        />
      )}
    </>
  ) : null;

  return (
   <div className={`App ${darkMode ? 'dark' : ''} ${hideAvatarFrames ? 'hide-avatar-frames' : ''}`}>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to={['moderator', 'admin', 'super_admin'].includes(user.system_role) ? '/admin' : '/'} replace /> : <LoginPage onLoginSuccess={handleAuthSuccess} />
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
          path="/admin"
          element={
            user ? (
              <AdminPage
                currentUser={user}
                onBackToFeed={() => navigate('/')}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

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
                activeStoryUserIds={Array.from(storyUserIds)}
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
        activeStoryUserIds={Array.from(storyUserIds)}
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

      {repostCandidate && (
        <div className="repost-modal-overlay" onClick={() => setRepostCandidate(null)}>
          <section className="repost-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="repost-close-btn" onClick={() => setRepostCandidate(null)}>
              {'\u00D7'}
            </button>
            <h2>Repostear en tu perfil</h2>
            <textarea
              value={repostComment}
              onChange={(event) => setRepostComment(event.target.value)}
              placeholder="Agrega un comentario o repostea tal cual..."
            />
            <div className="repost-preview-card">
              <div className="repost-preview-header">
                <strong>{repostCandidate.sender_name}</strong>
                <span>reconocio a</span>
                <strong>{repostCandidate.receiver_name}</strong>
              </div>
              <p>{repostCandidate.message}</p>
              {Array.isArray(repostCandidate.media) && repostCandidate.media[0] && (
                <div className="repost-preview-media">
                  {repostCandidate.media[0].media_type === 'video' ? (
                    <video src={resolveImageUrl(repostCandidate.media[0].media_url)} controls />
                  ) : (
                    <img src={resolveImageUrl(repostCandidate.media[0].media_url)} alt="Vista previa del repost" />
                  )}
                </div>
              )}
            </div>
            <div className="repost-modal-actions">
              <button type="button" onClick={() => setRepostComment('')}>
                Repostear sin comentario
              </button>
              <button type="button" className="primary" onClick={handleSubmitRepost}>
                Repostear
              </button>
            </div>
          </section>
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

      {appToast && (
        <div className={`tec-app-toast ${appToast.type || 'success'}`} role="status">
          <span>{appToast.message}</span>
          {appToast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                appToast.onAction?.();
                setAppToast(null);
              }}
            >
              {appToast.actionLabel}
            </button>
          )}
          <button type="button" className="tec-app-toast-close" onClick={() => setAppToast(null)}>
            {'\u00D7'}
          </button>
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
          {'\u2191'}
        </button>
      )}
    </div>
  );
}

export default App;

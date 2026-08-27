import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE } from '../../constants/api';
import { colors } from '../../constants/colors';
import { fontSize, spacing, radius, fontWeight, shadow } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import { resolveImageUrl } from '../utils/getInitials';
import { authenticatedFetch } from '../../utils/authenticatedFetch';

const CATEGORIES = [
  { key: 'Colaboración', icon: '🤝' },
  { key: 'Académico',    icon: '📚' },
  { key: 'Liderazgo',    icon: '⭐' },
  { key: 'Creatividad',  icon: '💡' },
];

export default function SendScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [category, setCategory] = useState('Colaboración');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [mediaUri, setMediaUri] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [mediaName, setMediaName] = useState(null);

  // Leer params cada vez que cambian (multimedia o usuario preseleccionado)
  useEffect(() => {
    if (params?.receiverName && params?.receiverId) {
      setSelectedUser({
        id: params.receiverId,
        display_name: params.receiverName,
        profile_image_url: params.receiverImage || null,
      });
      setSearch(params.receiverName);
    }
    if (params?.mediaUri) {
      setMediaUri(params.mediaUri);
      setMediaType(params.mediaType || 'image');
      setMediaName(params.mediaName || null);
    }
  }, [params?.mediaUri, params?.receiverId]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length < 2 || selectedUser) {
        setSearchResults([]);
        return;
      }
      try {
        setSearching(true);
        const res = await authenticatedFetch(
          `${API_BASE}/api/users/search?q=${encodeURIComponent(search)}`
        );
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); } catch { data = { error: text }; }
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearch(user.display_name || user.fullname);
    setSearchResults([]);
    setFeedback({ type: '', text: '' });
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearch('');
    setSearchResults([]);
  };

  const handleSend = async () => {
    setFeedback({ type: '', text: '' });

    if (!selectedUser) {
      setFeedback({ type: 'error', text: 'Selecciona un compañero para reconocer.' });
      return;
    }
    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Escribe un mensaje de reconocimiento.' });
      return;
    }

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('sender_id', String(user?.id || ''));
      formData.append('receiver_id', selectedUser.id);
      formData.append('message', message.trim());
      formData.append('category', category);
      if (mediaUri) {
        formData.append('recognitionMedia', {
          uri: mediaUri,
          type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          name: mediaName || `media_${Date.now()}`,
        });
      }

      const res = await authenticatedFetch(`${API_BASE}/api/recognitions/send`, {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { data = { error: text }; }

      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Error al enviar.' });
        return;
      }

      setSelectedUser(null);
      setSearch('');
      setMessage('');
      setCategory('Colaboración');
      // Volver al feed después de 1 segundo
      setTimeout(() => router.replace('/(tabs)/feed'), 1000);

    } catch (err) { 
      console.error('Error completo:', JSON.stringify(err));
      console.error('Message:', err.message);
      setFeedback({
      type: 'error',
      text: `Error: ${err.message || 'desconocido'}`,
  });
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <View style={styles.pageHeader}>
          <Text style={styles.kicker}>Reconocimiento positivo</Text>
          <Text style={styles.title}>Motiva a alguien</Text>
          <Text style={styles.subtitle}>
            Haz visible el esfuerzo y talento de tu comunidad TSJ.
          </Text>
        </View>

        {/* Feedback */}
        {feedback.text ? (
          <View style={[
            styles.feedbackBox,
            feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
          ]}>
            <Text style={[
              styles.feedbackText,
              feedback.type === 'error' ? styles.feedbackErrorText : styles.feedbackSuccessText,
            ]}>
              {feedback.text}
            </Text>
          </View>
        ) : null}

        {/* Buscar usuario */}
        <View style={styles.section}>
          <Text style={styles.label}>Buscar compañero</Text>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Nombre, correo..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                if (selectedUser) setSelectedUser(null);
                setFeedback({ type: '', text: '' });
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={handleClearUser}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {searching && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginTop: spacing.sm }}
            />
          )}

          {/* Resultados búsqueda */}
          {!selectedUser && searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectUser(u)}
                >
                  <Avatar
                    imageUrl={resolveImageUrl(u.profile_image_url, API_BASE)}
                    name={u.display_name || u.fullname}
                    size={38}
                  />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>
                      {u.display_name || u.fullname}
                    </Text>
                    <Text style={styles.searchResultEmail}>{u.email}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Usuario seleccionado */}
          {selectedUser && (
            <View style={styles.selectedUser}>
              <Avatar
                imageUrl={resolveImageUrl(selectedUser.profile_image_url, API_BASE)}
                name={selectedUser.display_name || selectedUser.fullname}
                size={46}
              />
              <View style={styles.selectedUserInfo}>
                <Text style={styles.selectedUserName}>
                  {selectedUser.display_name || selectedUser.fullname}
                </Text>
                <Text style={styles.selectedUserEmail}>{selectedUser.email}</Text>
              </View>
              <TouchableOpacity onPress={handleClearUser} style={styles.clearUserBtn}>
                <Text style={styles.clearUserBtnText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Categoría */}
        <View style={styles.section}>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryCard,
                  category === cat.key && styles.categoryCardActive,
                ]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  category === cat.key && styles.categoryLabelActive,
                ]}>
                  {cat.key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mensaje */}
        <View style={styles.section}>
          <Text style={styles.label}>Tu mensaje</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Escribe algo inspirador..."
            placeholderTextColor={colors.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{message.length} caracteres</Text>
        </View>

        {/* Preview multimedia adjunta */}
        {mediaUri && (
          <View style={styles.mediaPreview}>
            <Image
              source={{ uri: mediaUri }}
              style={styles.mediaPreviewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.mediaRemoveBtn}
              onPress={() => setMediaUri(null)}
            >
              <Text style={styles.mediaRemoveText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.mediaTypeBadge}>
              <Text style={styles.mediaTypeBadgeText}>
                {mediaType === 'video' ? '🎥 Video' : '🖼️ Imagen'}
              </Text>
            </View>
          </View>
        )}

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.sendBtnText}>Enviar reconocimiento ✨</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },

  // Header
  pageHeader: {
    marginBottom: spacing.xl,
  },
  kicker: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.black,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSoft,
    lineHeight: 22,
  },

  // Feedback
  feedbackBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  feedbackSuccess: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  feedbackText: { fontSize: fontSize.sm },
  feedbackErrorText: { color: colors.error },
  feedbackSuccessText: { color: colors.success },

  // Secciones
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  // Búsqueda
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text },
  clearBtn: { fontSize: fontSize.sm, color: colors.textSoft, paddingLeft: spacing.sm },

  searchResults: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultInfo: { flex: 1 },
  searchResultName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  searchResultEmail: {
    fontSize: fontSize.xs,
    color: colors.textSoft,
    marginTop: 2,
  },

  // Usuario seleccionado
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedUserInfo: { flex: 1 },
  selectedUserName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  selectedUserEmail: {
    fontSize: fontSize.xs,
    color: colors.textSoft,
    marginTop: 2,
  },
  clearUserBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearUserBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSoft,
    fontWeight: fontWeight.medium,
  },

  // Categorías
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: '45%',
  },
  categoryCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  categoryIcon: { fontSize: 18 },
  categoryLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSoft,
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },

  // Textarea
  textarea: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Botón
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadow.md,
  },
  sendBtnDisabled: { opacity: 0.7 },
  mediaPreview: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    height: 180,
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mediaRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaRemoveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  mediaTypeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mediaTypeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sendBtnText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});

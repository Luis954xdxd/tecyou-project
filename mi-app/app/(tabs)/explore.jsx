// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { API_BASE } from '../../constants/api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/Avatar';
import { colors } from '../../constants/colors';
import { fontSize, spacing, radius, fontWeight, shadow } from '../../constants/theme';
import { resolveImageUrl } from '../utils/getInitials';

export default function ExploreScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  const fetchUsers = useCallback(async () => {
    try {
      const url = `${API_BASE}/api/users/all?currentUserId=${user?.id}`;
      console.log("📡 Fetching:", url);
      const res = await fetch(url);
      const text = await res.text();
      console.log("📥 Respuesta:", text.substring(0, 300));
      const data = JSON.parse(text);  // parsear manualmente para mejor error
      const filtered = data.filter((u) => u.id !== user?.id);
      setUsers(filtered);
      const map = {};
      filtered.forEach((u) => { map[u.id] = u.is_following; });
      setFollowingMap(map);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { 
    if (user?.id) fetchUsers(); 
  }, [fetchUsers, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const handleFollow = async (targetId) => {
    const isFollowing = followingMap[targetId];
    setFollowingMap(prev => ({ ...prev, [targetId]: !isFollowing }));
    try {
      await fetch(`${API_BASE}/api/users/${targetId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_id: user?.id }),
      });
    } catch {
      setFollowingMap(prev => ({ ...prev, [targetId]: isFollowing }));
    }
  };

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.display_name || u.fullname || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header y buscador FUERA del FlatList para no perder foco */}
      <View style={styles.topSection}>
        <View style={styles.pageHeader}>
          <Text style={styles.kicker}>Comunidad TSJ</Text>
          <Text style={styles.title}>Explorar</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar usuarios..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>
          {search ? `${filtered.length} resultado(s)` : 'Todos los usuarios'}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isFollowing={followingMap[item.id]}
            onFollow={() => handleFollow(item.id)}
            currentUserId={user?.id}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>Prueba con otro nombre o correo.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
}

function UserCard({ user, isFollowing, onFollow, currentUserId }) {
  const avatarUrl = resolveImageUrl(user.profile_image_url, API_BASE);
  const isOwnProfile = Number(user.id) === Number(currentUserId);

  return (
    <View style={styles.card}>
      <Avatar imageUrl={avatarUrl} name={user.display_name || user.fullname} size={50} radius={14} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{user.display_name || user.fullname}</Text>
        <Text style={styles.cardEmail}>{user.email}</Text>
        {user.bio ? (
          <Text style={styles.cardBio} numberOfLines={2}>{user.bio}</Text>
        ) : null}
        {user.tags?.length > 0 && (
          <View style={styles.tagsRow}>
            {user.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {!isOwnProfile && (
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={onFollow}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Siguiendo' : 'Seguir'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.bg, gap: spacing.md,
  },
  loadingText: { color: colors.textSoft, fontSize: fontSize.sm },

  pageHeader: { marginBottom: spacing.lg },
  kicker: {
    fontSize: fontSize.xs, fontWeight: fontWeight.black,
    color: colors.secondary, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxxl, fontWeight: fontWeight.black,
    color: colors.text, letterSpacing: -0.5,
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.md, height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text },
  clearBtn: { fontSize: fontSize.sm, color: colors.textSoft, paddingLeft: spacing.sm },

  sectionLabel: {
    fontSize: fontSize.sm, color: colors.textSoft, marginBottom: spacing.sm,
  },

  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.md,
    ...shadow.sm,
  },
  cardInfo: { flex: 1 },
  cardName: {
    fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 2,
  },
  cardEmail: { fontSize: fontSize.xs, color: colors.textSoft, marginBottom: spacing.xs },
  cardBio: { fontSize: fontSize.sm, color: colors.textSoft, lineHeight: 18, marginBottom: spacing.xs },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.primarySoft, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  tagText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium },

  followBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.primary, backgroundColor: colors.primary,
    alignSelf: 'flex-start',
  },
  followingBtn: {
    backgroundColor: 'transparent', borderColor: colors.border,
  },
  followBtnText: {
    fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.white,
  },
  followingBtnText: { color: colors.textSoft },

  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.text, marginBottom: spacing.sm,
  },
  emptyText: { fontSize: fontSize.md, color: colors.textSoft, textAlign: 'center' },
});

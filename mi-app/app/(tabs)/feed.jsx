// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFeed } from '../../hooks/useFeed';
import RecognitionCard from '../../components/RecognitionCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import FAB from '../../components/FAB';
import { colors } from '../../constants/colors';
import { fontSize, spacing, radius, fontWeight } from '../../constants/theme';

const CATEGORIES = ['Todas', 'Colaboración', 'Académico', 'Liderazgo', 'Creatividad'];

export default function FeedScreen() {
  const { recognitions, loading, error, fetchFeed } = useFeed();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [refreshing, setRefreshing] = useState(false);

  // Recargar feed cada vez que esta pantalla vuelve a estar visible
  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, [fetchFeed]);

  const filtered = recognitions.filter((rec) => {
    const matchesCategory = selectedCategory === 'Todas' || rec.category === selectedCategory;
    const matchesSearch = !search.trim() ||
      rec.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
      rec.receiver_name?.toLowerCase().includes(search.toLowerCase()) ||
      rec.message?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderHeader = () => (
    <View>
      <View style={styles.pageHeader}>
        <Text style={styles.kicker}>Muro de la comunidad</Text>
        <Text style={styles.title}>Reconocimientos</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o mensaje..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.filtersRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {!loading && (
        <Text style={styles.resultsCount}>
          {filtered.length} reconocimiento{filtered.length !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  if (loading && !refreshing) return <LoadingSpinner fullScreen message="Cargando reconocimientos..." />;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchFeed}>
          <Text style={styles.retryBtnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <RecognitionCard recognition={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🌟</Text>
            <Text style={styles.emptyTitle}>Sin reconocimientos</Text>
            <Text style={styles.emptyText}>
              {search || selectedCategory !== 'Todas'
                ? 'Prueba cambiando los filtros.'
                : 'Sé el primero en reconocer a alguien.'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: spacing.lg, paddingBottom: 140 },
  pageHeader: { marginBottom: spacing.lg },
  kicker: {
    fontSize: fontSize.xs, fontWeight: fontWeight.black,
    color: colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs,
  },
  title: { fontSize: fontSize.xxxl, fontWeight: fontWeight.black, color: colors.text, letterSpacing: -0.5 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.md, height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text },
  clearBtn: { fontSize: fontSize.sm, color: colors.textSoft, paddingLeft: spacing.sm },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm - 2,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSoft },
  filterChipTextActive: { color: colors.white },
  resultsCount: { fontSize: fontSize.sm, color: colors.textSoft, marginBottom: spacing.md },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  errorText: { fontSize: fontSize.md, color: colors.error, textAlign: 'center', marginBottom: spacing.lg },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  retryBtnText: { color: colors.white, fontWeight: fontWeight.bold, fontSize: fontSize.md },
  emptyContainer: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.md, color: colors.textSoft, textAlign: 'center' },
});

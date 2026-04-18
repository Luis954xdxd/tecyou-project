import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { fontSize, spacing, radius } from '../constants/theme';

const CATEGORY_ICONS = {
  Colaboración: '🤝',
  Académico:    '📚',
  Liderazgo:    '⭐',
  Creatividad:  '💡',
};

/**
 * Componente CategoryBadge — chip de categoría de reconocimiento
 *
 * Props:
 *   category — nombre de la categoría
 *   size     — 'sm' | 'md' (default: 'md')
 */
export default function CategoryBadge({ category, size = 'md' }) {
  const meta = colors.categories[category] || {
    bg: '#f1f5ff',
    text: '#5b4bc4',
    dot: '#5b4bc4',
  };

  const icon = CATEGORY_ICONS[category] || '✨';
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.icon, isSmall && styles.iconSm]}>{icon}</Text>
      <Text style={[styles.label, { color: meta.text }, isSmall && styles.labelSm]}>
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: fontSize.md,
  },
  iconSm: {
    fontSize: fontSize.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontSize: fontSize.xs,
  },
});

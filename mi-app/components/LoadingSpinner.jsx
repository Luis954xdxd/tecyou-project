import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { fontSize, spacing } from '../constants/theme';

/**
 * Componente LoadingSpinner — indicador de carga
 *
 * Props:
 *   message — texto opcional debajo del spinner
 *   size    — 'small' | 'large' (default: 'large')
 *   color   — color del spinner (default: primary)
 *   fullScreen — si ocupa toda la pantalla (default: false)
 */
export default function LoadingSpinner({
  message,
  size = 'large',
  color = colors.primary,
  fullScreen = false,
}) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSoft,
    textAlign: 'center',
  },
});

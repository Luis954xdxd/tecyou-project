import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { getInitials } from '../app/utils/getInitials';

/**
 * Componente Avatar — muestra foto de perfil o iniciales
 *
 * Props:
 *   imageUrl  — URL de la imagen (opcional)
 *   name      — nombre del usuario (para iniciales)
 *   size      — tamaño en px (default: 44)
 *   radius    — radio de borde (default: 'circle' = tamaño/2)
 *   style     — estilos adicionales
 */
export default function Avatar({ imageUrl, name, size = 44, radius, style }) {
  const borderRadius = radius !== undefined ? radius : size / 2;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, containerStyle, style]}
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
});
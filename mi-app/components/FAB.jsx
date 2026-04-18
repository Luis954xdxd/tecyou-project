// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../constants/colors';
import { fontSize, spacing, radius, fontWeight } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FAB() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setVisible(true);
    setOpen(true);
    Animated.parallel([
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 55,
        friction: 10,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = (callback) => {
    Animated.parallel([
      Animated.spring(animation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 12,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setVisible(false);
      if (callback) callback();
    });
  };

  const toggle = () => {
    if (open) closeMenu();
    else openMenu();
  };

  // Acción: Reconocer — va directo a send
  const handleReconocer = () => {
    closeMenu(() => {
      setTimeout(() => router.push('/(tabs)/send'), 50);
    });
  };

  // Acción: Subir multimedia — abre galería del celular
  const handleMultimedia = async () => {
    closeMenu(async () => {
      try {
        // Pedir permisos
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Necesitamos acceso a tu galería para subir multimedia.',
            [{ text: 'Entendido' }]
          );
          return;
        }

        // Abrir galería — permite imágenes y videos
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: false,
          quality: 0.85,
          allowsMultipleSelection: false,
          videoMaxDuration: 60,
        });

        if (!result.canceled && result.assets?.length > 0) {
          const asset = result.assets[0];
          // Navegar a send pasando el archivo seleccionado
          router.push({
            pathname: '/(tabs)/send',
            params: {
              mediaUri: asset.uri,
              mediaType: asset.type || 'image',
              mediaName: asset.fileName || `media_${Date.now()}`,
            },
          });
        }
      } catch (err) {
        console.error('Error abriendo galería:', err);
        Alert.alert('Error', 'No se pudo abrir la galería.');
      }
    });
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const fabScale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.92, 1],
  });

  const ACTIONS = [
    { key: 'media',      label: 'Subir multimedia', onPress: handleMultimedia },
    { key: 'recognize',  label: 'Reconocer',        onPress: handleReconocer },
  ];

  return (
    <>
      {visible && (
        <Animated.View
          style={[styles.fullOverlay, { opacity: overlayOpacity }]}
          pointerEvents={open ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={toggle}
          />
        </Animated.View>
      )}

      <View style={styles.container} pointerEvents="box-none">
        {visible && ACTIONS.map((action, index) => {
          const offset = (ACTIONS.length - index) * 80;
          const translateY = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -offset],
          });
          const opacity = animation.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 0, 1],
          });
          const scale = animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.75, 1],
          });

          return (
            <Animated.View
              key={action.key}
              style={[
                styles.actionRow,
                { transform: [{ translateY }, { scale }], opacity },
              ]}
              pointerEvents={open ? 'auto' : 'none'}
            >
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <Animated.View style={{ transform: [{ scale: fabScale }] }}>
          <TouchableOpacity
            style={[styles.fab, open && styles.fabOpen]}
            onPress={toggle}
            activeOpacity={0.85}
          >
            <Animated.Text
              style={[styles.fabIcon, { transform: [{ rotate: rotation }] }]}
            >
              +
            </Animated.Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fullOverlay: {
    position: 'absolute',
    top: -300,
    left: -500,
    width: SCREEN_WIDTH + 500,
    height: SCREEN_HEIGHT + 600,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    zIndex: 98,
  },
  container: {
    position: 'absolute',
    bottom: 72,
    right: spacing.lg,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  fabOpen: {
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.white,
    shadowOpacity: 0.1,
  },
  fabIcon: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '300',
    lineHeight: 40,
    marginTop: -2,
  },
  actionRow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  actionBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 190,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
});

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Modal, Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import Avatar from './Avatar';
import CategoryBadge from './CategoryBadge';
import { colors } from '../constants/colors';
import { fontSize, spacing, radius, shadow, fontWeight } from '../constants/theme';
import { formatRelativeDate } from '../app/utils/formatDate';
import { resolveImageUrl } from '../app/utils/getInitials';
import { API_BASE } from '../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function MediaItem({ item, onPressImage }) {
  const url = resolveImageUrl(item.media_url, API_BASE);
  const isVideo = item.media_type === 'video';
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (isVideo) {
    return (
      <TouchableOpacity
        style={styles.mediaItemFull}
        activeOpacity={0.9}
        onPress={() => setPlaying(!playing)}
      >
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={styles.mediaVideo}
          resizeMode={ResizeMode.COVER}
          shouldPlay={playing}
          isLooping
          useNativeControls={playing}
        />
        {!playing && (
          <View style={styles.videoOverlay}>
            <View style={styles.playBtn}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.mediaItemFull}
      onPress={() => onPressImage(url)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: url }} style={styles.mediaImage} resizeMode="cover" />
    </TouchableOpacity>
  );
}

export default function RecognitionCard({ recognition: rec, onPressUser }) {
  const [lightboxImage, setLightboxImage] = useState(null);

  const senderAvatar = resolveImageUrl(rec.sender_profile_image, API_BASE);
  const receiverAvatar = resolveImageUrl(rec.receiver_profile_image, API_BASE);

  const mediaItems = Array.isArray(rec.media)
    ? rec.media.filter(m => m && m.media_url)
    : [];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <CategoryBadge category={rec.category} size="sm" />
        <Text style={styles.date}>{formatRelativeDate(rec.created_at)}</Text>
      </View>

      <View style={styles.body}>
        {/* Sender */}
        <View style={styles.userRow}>
          <Avatar imageUrl={senderAvatar} name={rec.sender_name} size={40} />
          <View style={styles.userInfo}>
            <TouchableOpacity onPress={() => onPressUser?.(rec.sender_id)}>
              <Text style={styles.userName}>{rec.sender_name}</Text>
            </TouchableOpacity>
            <Text style={styles.userRole}>reconoció a</Text>
          </View>
        </View>

        {/* Receiver */}
        <View style={styles.userRow}>
          <Avatar imageUrl={receiverAvatar} name={rec.receiver_name} size={40} />
          <TouchableOpacity onPress={() => onPressUser?.(rec.receiver_id)}>
            <Text style={[styles.userName, styles.receiverName]}>
              {rec.receiver_name}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mensaje */}
        <View style={styles.messageBox}>
          <Text style={styles.message}> {String(rec.message)}</Text>
        </View>

        {/* Multimedia */}
        {mediaItems.length > 0 && (
          <View style={styles.mediaGrid}>
            {mediaItems.map((item, index) => (
              <MediaItem
                key={index}
                item={item}
                onPressImage={setLightboxImage}
              />
            ))}
          </View>
        )}
      </View>

      {/* Lightbox imagen */}
      <Modal
        visible={!!lightboxImage}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxImage(null)}
      >
        <TouchableOpacity
          style={styles.lightbox}
          activeOpacity={1}
          onPress={() => setLightboxImage(null)}
        >
          <Image
            source={{ uri: lightboxImage }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightboxImage(null)}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  date: { fontSize: fontSize.xs, color: colors.textSoft },
  body: { gap: spacing.sm },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  receiverName: { color: colors.secondary },
  userRole: { fontSize: fontSize.sm, color: colors.textSoft },
  messageBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  mediaGrid: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  mediaItemFull: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaVideo: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  playIcon: { fontSize: 22, color: '#fff', marginLeft: 4 },
  lightbox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 },
  lightboxClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

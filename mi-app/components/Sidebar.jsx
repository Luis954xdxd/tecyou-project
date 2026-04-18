import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';
import { fontSize, spacing, radius, fontWeight } from '../constants/theme';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.82;

function NavIcon({ name }) {
  const icons = {
    home:   '⌂',
    send:   '✦',
    moon:   '◐',
    sun:    '○',
    logout: '→',
  };
  return (
    <View style={iconStyles.wrap}>
      <Text style={iconStyles.icon}>{icons[name] || '•'}</Text>
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20, color: colors.text },
});

export default function Sidebar({
  onClose, user, onLogout, darkMode, onToggleDark,
}) {
  const router = useRouter();

  const handleNav = (route) => {
    onClose();
    setTimeout(() => router.push(route), 200);
  };

  const initials = (user?.display_name || user?.fullname || 'U')
    .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <View style={styles.sidebar}>
      {/* Perfil */}
      <View style={styles.profileSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>
          {user?.display_name || user?.fullname || 'Usuario'}
        </Text>
        <Text style={styles.userHandle}>
          @{(user?.email || '').split('@')[0]}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user?.following_count ?? 0}</Text>
            <Text style={styles.statLabel}> Siguiendo</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user?.followers_count ?? 0}</Text>
            <Text style={styles.statLabel}> Seguidores</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Navegación */}
      <View style={styles.navSection}>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNav('/(tabs)/feed')}>
          <NavIcon name="home" />
          <Text style={styles.navLabel}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNav('/(tabs)/send')}>
          <NavIcon name="send" />
          <Text style={styles.navLabel}>Reconocer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* Dark mode toggle */}
      <View style={styles.darkModeRow}>
        <View style={styles.darkModeLeft}>
          <NavIcon name={darkMode ? 'sun' : 'moon'} />
          <Text style={styles.navLabel}>{darkMode ? 'Modo claro' : 'Modo oscuro'}</Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={onToggleDark}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {/* Cerrar sesión al fondo */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { onClose(); onLogout(); }}>
          <NavIcon name="logout" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 56,
    paddingBottom: 32,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  profileSection: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.text,
    marginBottom: 2,
  },
  userHandle: {
    fontSize: fontSize.md,
    color: colors.textSoft,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textSoft,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.xl,
  },
  navSection: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 4,
    borderRadius: radius.full,
  },
  navLabel: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 4,
    marginHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  darkModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  logoutText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
});

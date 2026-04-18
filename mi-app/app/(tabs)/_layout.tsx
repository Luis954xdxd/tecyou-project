// @ts-nocheck
import React, { useRef, useState, createContext, useContext } from 'react';
import { Tabs } from 'expo-router';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { fontSize, spacing } from '../../constants/theme';
import Sidebar from '../../components/Sidebar.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';

const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.82;
const SWIPE_THRESHOLD = SIDEBAR_WIDTH * 0.35;

export const SidebarContext = createContext({ openSidebar: () => {} });
export const useSidebar = () => useContext(SidebarContext);

function TabsHeader({ title, onOpenSidebar, user }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={onOpenSidebar} style={styles.avatarBtn}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.display_name || user?.fullname || 'U')
              .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

export default function TabsLayout() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('¡Tec! ¡you!');
  const [darkMode, setDarkMode] = useState(true);

  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const sidebarOpenRef = useRef(false);

  const openSidebar = () => {
    sidebarOpenRef.current = true;
    setSidebarOpen(true);
    Animated.spring(translateX, {
      toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
    }).start();
  };

  const closeSidebar = () => {
    Animated.spring(translateX, {
      toValue: -SIDEBAR_WIDTH, useNativeDriver: true, tension: 65, friction: 11,
    }).start(() => {
      sidebarOpenRef.current = false;
      setSidebarOpen(false);
    });
  };

  const handleLogout = async () => {
    closeSidebar();
    await logout();
    router.replace('/login');
  };

  const openGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX(10)
    .failOffsetY([-20, 20])
    .onStart((e) => {
      if (sidebarOpenRef.current || e.x > 60) return;
      setSidebarOpen(true);
      translateX.setValue(-SIDEBAR_WIDTH);
    })
    .onUpdate((e) => {
      if (e.x > 60 && e.translationX < 10) return;
      translateX.setValue(Math.min(0, -SIDEBAR_WIDTH + e.translationX));
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD || e.velocityX > 400) {
        openSidebar();
      } else {
        Animated.spring(translateX, {
          toValue: -SIDEBAR_WIDTH, useNativeDriver: true, tension: 65, friction: 11,
        }).start(() => {
          sidebarOpenRef.current = false;
          setSidebarOpen(false);
        });
      }
    });

  const closeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX(-10)
    .failOffsetY([-20, 20])
    .onStart(() => {
      if (!sidebarOpenRef.current) return;
      translateX.stopAnimation();
    })
    .onUpdate((e) => {
      if (!sidebarOpenRef.current) return;
      translateX.setValue(Math.min(0, e.translationX));
    })
    .onEnd((e) => {
      if (!sidebarOpenRef.current) return;
      if (e.translationX < -(SWIPE_THRESHOLD * 0.5) || e.velocityX < -400) {
        closeSidebar();
      } else {
        Animated.spring(translateX, {
          toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
        }).start();
      }
    });

  const combinedGesture = Gesture.Simultaneous(openGesture, closeGesture);

  return (
    <SidebarContext.Provider value={{ openSidebar }}>
      <GestureHandlerRootView style={styles.container}>
        <TabsHeader title={currentTitle} onOpenSidebar={openSidebar} user={user} />

        <GestureDetector gesture={combinedGesture}>
          <View style={styles.content}>
            <Tabs
              screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSoft,
                tabBarLabelStyle: { fontSize: fontSize.xs, fontWeight: '600' },
              }}
              screenListeners={{
                focus: (e) => {
                  const name = e.target?.split('-')[0];
                  if (name === 'feed') setCurrentTitle('¡Tec! ¡you!');
                  if (name === 'explore') setCurrentTitle('Explorar');
                },
              }}
            >
              <Tabs.Screen
                name="feed"
                options={{
                  tabBarLabel: 'Inicio',
                  tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⌂</Text>,
                }}
              />
              <Tabs.Screen
                name="explore"
                options={{
                  tabBarLabel: 'Explorar',
                  tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>◎</Text>,
                }}
              />
              <Tabs.Screen name="send" options={{ href: null }} />
              <Tabs.Screen name="index" options={{ href: null }} />
            </Tabs>
          </View>
        </GestureDetector>

        {sidebarOpen && (
          <View style={styles.sidebarWrapper}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeSidebar} />
            <Animated.View style={[styles.sidebarPanel, { transform: [{ translateX }] }]}>
              <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
                user={user}
                onLogout={handleLogout}
                darkMode={darkMode}
                onToggleDark={() => setDarkMode(p => !p)}
              />
            </Animated.View>
          </View>
        )}
      </GestureHandlerRootView>
    </SidebarContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatarBtn: { padding: 2 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  tabBar: {
    backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1,
    height: 64, paddingBottom: 8, paddingTop: 6,
  },
  sidebarWrapper: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 999 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sidebarPanel: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_WIDTH },
});

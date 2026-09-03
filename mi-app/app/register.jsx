import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE } from '../constants/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async () => {
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          profile_visibility: profileVisibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrarse.');
        return;
      }

      setSuccess(data.message || 'Cuenta creada correctamente.');
      setTimeout(() => router.replace('/login'), 1800);

    } catch (err) {
      setError('No se pudo conectar con el servidor. ¿Está encendido el backend?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>TY</Text>
          </View>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Solo correos institucionales del TSJ</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registro</Text>
          <Text style={styles.cardSubtitle}>
            La contraseña debe tener 8+ caracteres, una mayúscula y un carácter especial.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo institucional</Text>
            <TextInput
              style={styles.input}
              placeholder="za220112453@zapopan.tecmm.edu.mx"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de perfil</Text>
            {[
              ['public', 'Pública', 'Todos pueden ver lo que publicas.'],
              ['private', 'Privada', 'Solo tú puedes ver lo que publicaste.'],
              ['restricted', 'Restringida', 'Solo tus seguidores y personas que sigues pueden verlo.'],
            ].map(([value, title, description]) => (
              <TouchableOpacity
                key={value}
                style={[styles.visibilityOption, profileVisibility === value && styles.visibilityOptionActive]}
                onPress={() => setProfileVisibility(value)}
              >
                <View style={[styles.visibilityRadio, profileVisibility === value && styles.visibilityRadioActive]} />
                <View style={styles.visibilityCopy}>
                  <Text style={styles.visibilityTitle}>{title}</Text>
                  <Text style={styles.visibilityDescription}>{description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.linkText}>
              ¿Ya tienes cuenta? <Text style={styles.linkTextBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#5d6778',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18212f',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#5d6778',
    marginBottom: 24,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#fff3f3',
    borderColor: '#f0cccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#15803d',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 18,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#d9e1f2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f6f8fc',
  },
  visibilityOptionActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#e8efff',
  },
  visibilityRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94a3b8',
  },
  visibilityRadioActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#1e3a8a',
  },
  visibilityCopy: { flex: 1 },
  visibilityTitle: { color: '#18212f', fontWeight: '700', fontSize: 14 },
  visibilityDescription: { color: '#5d6778', fontSize: 12, marginTop: 2, lineHeight: 17 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18212f',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f6f8fc',
    borderWidth: 1,
    borderColor: '#d9e1f2',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: '#18212f',
  },
  btnPrimary: {
    backgroundColor: '#1e3a8a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#5d6778',
  },
  linkTextBold: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
});

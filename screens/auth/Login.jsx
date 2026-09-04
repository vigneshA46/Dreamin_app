import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, AntDesign } from '@expo/vector-icons';

import { apiRequest } from '../../services/api';
import { useUser } from '../../context/UserContext';

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  label: '#b1adac',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  border: '#E7E9F0',
  bg: '#FFFFFF',
};

export default function Login({ navigation }) {
  const { fetchUser } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const loginHandler = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);

      // LOGIN
      await apiRequest('POST', '/api/auth/login', {
        email: email.trim(),
        password,
      });

      // GET CURRENT USER
      await fetchUser();

      Alert.alert('Success', 'Logged in successfully');
    } catch (error) {
      console.error('Login failed:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Feather name="activity" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>
              Dreamin <Text style={styles.logoTextAccent}>Algo</Text>
            </Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your trading account</Text>

          {/* Email / Mobile */}
          <Text style={styles.fieldLabel}>Email / Mobile</Text>
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color={COLORS.textGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter email or mobile"
              placeholderTextColor={COLORS.textGray}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Password</Text>
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color={COLORS.textGray} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={10}>
              <Feather
                name={showPassword ? 'eye' : 'eye-off'}
                size={18}
                color={COLORS.textGray}
              />
            </TouchableOpacity>
          </View>

          {/* Remember me / Forgot password */}
          <View style={styles.rowBetween}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              hitSlop={8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Feather name="check" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation?.navigate?.('ForgotPassword')}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && { opacity: 0.7 }]}
            onPress={loginHandler}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'LOGIN'}
            </Text>
          </TouchableOpacity>

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          {/* <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
            <AntDesign name="google" size={18} color="#EA4335" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity> */}

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('CreateAccount')}>
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  logoTextAccent: {
    color: COLORS.blue,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 28,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 28,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.blue,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.blue,
  },
  rememberText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.blue,
  },
  loginButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    height: 54,
    marginBottom: 32,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginLeft: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
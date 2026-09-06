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
import { Feather } from '@expo/vector-icons';

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginHandler = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing fields',
        'Please enter both email and password'
      );
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(
        'Agreement Required',
        'Please agree to the Terms & Conditions and Privacy Policy to continue.'
      );
      return;
    }

    try {
      setLoading(true);

      await apiRequest('POST', '/api/auth/login', {
        email: email.trim(),
        password,
      });

      await fetchUser();

      Alert.alert(
        'Success',
        'Logged in successfully'
      );
    } catch (error) {
      console.error('Login failed:', error);

      Alert.alert(
        'Login Failed',
        error.message || 'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo */}
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Feather
                name="activity"
                size={20}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.logoText}>
              Dreamin{' '}
              <Text style={styles.logoTextAccent}>
                Algo
              </Text>
            </Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>
            Welcome back
          </Text>

          <Text style={styles.subheading}>
            Sign in to your trading account
          </Text>

          {/* Email */}
          <Text style={styles.fieldLabel}>
            Email
          </Text>

          <View style={styles.inputWrapper}>
            <Feather
              name="mail"
              size={18}
              color={COLORS.textGray}
              style={styles.inputIcon}
            />

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
          <Text
            style={[
              styles.fieldLabel,
              { marginTop: 18 },
            ]}
          >
            Password
          </Text>

          <View style={styles.inputWrapper}>
            <Feather
              name="lock"
              size={18}
              color={COLORS.textGray}
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textGray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword((v) => !v)
              }
              hitSlop={10}
            >
              <Feather
                name={
                  showPassword
                    ? 'eye'
                    : 'eye-off'
                }
                size={18}
                color={COLORS.textGray}
              />
            </TouchableOpacity>
          </View>

          {/* Remember Me / Forgot Password */}
          <View style={styles.rowBetween}>

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() =>
                setRememberMe((v) => !v)
              }
              hitSlop={8}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe &&
                    styles.checkboxChecked,
                ]}
              >
                {rememberMe && (
                  <Feather
                    name="check"
                    size={12}
                    color="#FFFFFF"
                  />
                )}
              </View>

              <Text style={styles.rememberText}>
                Remember me
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              onPress={() =>
                navigation?.navigate?.(
                  'ForgotPassword'
                )
              }
            >
              <Text style={styles.linkText}>
                Forgot Password?
              </Text>
            </TouchableOpacity> */}

          </View>

          {/* Terms & Privacy Agreement */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() =>
              setAgreedToTerms((v) => !v)
            }
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms &&
                  styles.checkboxChecked,
              ]}
            >
              {agreedToTerms && (
                <Feather
                  name="check"
                  size={12}
                  color="#FFFFFF"
                />
              )}
            </View>

            <Text style={styles.termsText}>
              I agree to the{' '}

              <Text
                style={styles.termsLink}
                onPress={() =>
                  navigation.navigate('Terms')
                }
              >
                Terms & Conditions
              </Text>

              {' '}and{' '}

              <Text
                style={styles.termsLink}
                onPress={() =>
                  navigation.navigate('Privacy')
                }
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading && {
                opacity: 0.7,
              },
            ]}
            onPress={loginHandler}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginButtonText}>
              {loading
                ? 'Logging in...'
                : 'LOGIN'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />

            <Text style={styles.dividerText}>
              OR
            </Text>

            <View style={styles.dividerLine} />
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>

            <TouchableOpacity
              onPress={() =>
                    navigation.navigate(
                        "Signup"
                      )
                  }
            >
              <Text style={styles.footerLink}>
                Create Account
              </Text>
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
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 35,
    paddingBottom: 30,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 42,
  },

  logoMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },

  logoTextAccent: {
    color: COLORS.blue,
  },

  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  subheading: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 32,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  inputWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: COLORS.textDark,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D4D8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  rememberText: {
    fontSize: 12,
    color: COLORS.textGray,
  },

  linkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },

  /* Terms & Privacy */

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -4,
    marginBottom: 22,
  },

  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textGray,
  },

  termsLink: {
    color: COLORS.blue,
    fontWeight: '700',
  },

  /* Login */

  loginButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Divider */

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    fontSize: 11,
    color: COLORS.textGray,
    marginHorizontal: 12,
    fontWeight: '600',
  },

  /* Footer */

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerText: {
    fontSize: 13,
    color: COLORS.textGray,
  },

  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
  },
});
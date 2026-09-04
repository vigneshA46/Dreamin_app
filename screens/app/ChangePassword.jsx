import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import { apiRequest } from '../../services/api';

// Keep this in sync with your AppNavigator.jsx
const BASE_TAB_BAR_HEIGHT = 75;

const COLORS = {
  navy: '#0F1B3D',
  navyCard: '#101B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
};

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  visible,
  onToggleVisible,
  returnKeyType = 'next',
  onSubmitEditing,
  inputRef,
  editable = true,
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textGray}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
        />

        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleVisible}
          hitSlop={8}
        >
          <Feather
            name={visible ? 'eye-off' : 'eye'}
            size={18}
            color={COLORS.textGray}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePassword({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleChangePassword = async () => {
    if (loading) return;

    // validation
    if (!currentPassword || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match');
      return;
    }

    if (password === currentPassword) {
      Alert.alert(
        'Same password',
        'New password must be different from the current password'
      );
      return;
    }

    try {
      setLoading(true);

      // NOTE: the web app only sends `password`.
      // `currentPassword` is included so the backend can verify it if supported.
      await apiRequest('POST', '/api/auth/change-password', {
        currentPassword,
        password,
      });

      // reset fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Password Updated',
        'Your password has been changed successfully',
        [{ text: 'OK', onPress: () => navigation?.goBack?.() }]
      );
    } catch (err) {
      console.error('Error changing password:', err);

      Alert.alert('Update Failed', err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation?.goBack?.()}
          hitSlop={8}
        >
          <View style={styles.backCircle}>
            <Feather name="chevron-left" size={20} color={COLORS.textDark} />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Change Password</Text>

        <View style={styles.headerIconButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarHeight + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PasswordField
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            visible={showCurrent}
            onToggleVisible={() => setShowCurrent((prev) => !prev)}
            onSubmitEditing={() => newPasswordRef.current?.focus()}
            editable={!loading}
          />

          <PasswordField
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={setNewPassword}
            visible={showNew}
            onToggleVisible={() => setShowNew((prev) => !prev)}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            inputRef={newPasswordRef}
            editable={!loading}
          />

          <PasswordField
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm((prev) => !prev)}
            returnKeyType="done"
            onSubmitEditing={handleChangePassword}
            inputRef={confirmPasswordRef}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
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

  flex: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    height: 50,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    paddingVertical: 0,
  },

  eyeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButton: {
    marginTop: 8,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
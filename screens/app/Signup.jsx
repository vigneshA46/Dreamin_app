import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
};

function InputField({ label, icon, secureToggle, ...props }) {
  const [secure, setSecure] = React.useState(!!props.secureTextEntry);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Feather name={icon} size={16} color={COLORS.textGray} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.textGray}
          autoCapitalize="none"
          {...props}
          secureTextEntry={props.secureTextEntry ? secure : false}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setSecure((v) => !v)} hitSlop={8}>
            <Feather name={secure ? 'eye-off' : 'eye'} size={16} color={COLORS.textGray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function Signup({ navigation }) {
  const [fullname, setFullname] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [signupSuccess, setSignupSuccess] = React.useState(false);

  const handleSignup = async () => {
    if (!fullname.trim() || !email.trim() || !mobileNumber.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms & Conditions and Privacy Policy');
      return;
    }

    try {
      setLoading(true);

      const response = await apiRequest('POST', '/api/auth/signup', {
        email,
        password,
        fullname,
        mobile_number: mobileNumber,
      });

      setSignupSuccess(true);

      Alert.alert('Success', response?.message || 'Contact admin for Verification');
    } catch (error) {
      Alert.alert('Signup failed', error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Feather name="activity" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>
              Dreamin <Text style={styles.brandTextAccent}>Algo</Text>
            </Text>
          </View>

          {!signupSuccess ? (
            <>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your algorithmic trading journey</Text>

              <InputField
                label="Full Name"
                icon="user"
                placeholder="Enter full name"
                value={fullname}
                onChangeText={setFullname}
              />

              <InputField
                label="Email"
                icon="mail"
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <InputField
                label="Mobile"
                icon="phone"
                placeholder="+91 98765 43210"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
              />

              <InputField
                label="Password"
                icon="lock"
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                secureToggle
              />

              <InputField
                label="Confirm Password"
                icon="lock"
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                secureToggle
              />

              
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
              
              
              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.successCard}>
              <View style={styles.successAvatar}>
                <Feather name="check-circle" size={30} color={COLORS.green} />
              </View>

              <Text style={styles.successTitle}>Verification Required</Text>
              <Text style={styles.successBody}>
                Your account has been created successfully.{'\n'}
                Please contact admin for verification.
              </Text>

              <View style={styles.contactRow}>
                <Feather name="phone" size={16} color={COLORS.blue} />
                <Text style={styles.contactText}>+91 9080058704</Text>
              </View>

              <View style={styles.contactRow}>
                <Feather name="mail" size={16} color={COLORS.blue} />
                <Text style={styles.contactText}>dreaminalgodevelopmement@gmail.com</Text>
              </View>

              <TouchableOpacity
                style={styles.backToLoginButton}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate?.('Login')}
              >
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },

  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  brandTextAccent: { color: COLORS.blue },

  title: { fontSize: 24, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.textGray, marginBottom: 24 },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textGray, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.textDark },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, marginBottom: 24 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  termsText: { flex: 1, fontSize: 12, color: COLORS.textGray, lineHeight: 18 },
  termsLink: { color: COLORS.blue, fontWeight: '600' },

  submitButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 13, color: COLORS.textGray },
  footerLink: { fontSize: 13, color: COLORS.blue, fontWeight: '700' },

  // Success state
  successCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  successAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  successBody: {
    fontSize: 13,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  contactText: { fontSize: 13, color: COLORS.textDark, marginLeft: 8, fontWeight: '600' },
  backToLoginButton: {
    marginTop: 12,
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToLoginText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

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

/*
  To show real logos, copy the images from the web project into the app
  (e.g. src/assets/brokers/) and set `logo`:

    logo: require('../../assets/brokers/dhan.png'),

  When `logo` is null the broker's initial is shown instead.
*/
const BROKERS = [
  /* {
    key: 'dhan',
    name: 'Dhan',
    url: 'https://login.dhan.co/',
    tint: '#E8F1FF',
    accent: '#2F6FED',
    logo: null,
  },
  {
    key: 'angelone',
    name: 'Angel One',
    url: 'https://www.angelone.in/signup/register',
    tint: '#FFE6E6',
    accent: '#DC2626',
    logo: null,
  },
  {
    key: 'aliceblue',
    name: 'Alice Blue',
    url: 'https://aliceblueonline.com/open-demat-account',
    tint: '#E3F6FB',
    accent: '#0891B2',
    logo: null,
  },
  {
    key: 'zerodha',
    name: 'Zerodha',
    url: 'https://signup.zerodha.com/',
    tint: '#E6F7EC',
    accent: '#16A34A',
    logo: null,
  }, */
  {
    key: 'zebu',
    name: 'Zebu',
    url: 'https://oa.zebuetrade.com/',
    tint: '#FFF1E0',
    accent: '#EA580C',
    logo: null,
  },
];

const STEPS = [
  'Choose a broker from the partners listed below.',
  "Complete the broker's online KYC and account opening.",
  'Come back and connect the broker in your Profile to start deploying strategies.',
];

async function openLink(url) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening link:', error);
    Alert.alert('Unable to open', 'Please try again later.');
  }
}

export default function DematAccount({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

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

        <Text style={styles.headerTitle}>Demat Account</Text>

        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRO */}
        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Feather name="briefcase" size={22} color="#FFFFFF" />
          </View>

          <Text style={styles.introTitle}>Open a free Demat account</Text>

          <Text style={styles.introText}>
            Open a free Demat account with our supported partners and connect
            it to start trading with automated strategies.
          </Text>
        </View>

        {/* PARTNERS */}
        <Text style={styles.sectionTitle}>Supported Partners</Text>

        <View style={styles.grid}>
          {BROKERS.map((broker) => (
            <TouchableOpacity
              key={broker.key}
              style={styles.brokerCard}
              activeOpacity={0.75}
              onPress={() => openLink(broker.url)}
            >
              <View style={[styles.brokerLogoBox, { backgroundColor: broker.tint }]}>
                {broker.logo ? (
                  <Image
                    source={broker.logo}
                    style={styles.brokerLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[styles.brokerInitial, { color: broker.accent }]}>
                    {broker.name.charAt(0)}
                  </Text>
                )}
              </View>

              <Text style={styles.brokerName} numberOfLines={1}>
                {broker.name}
              </Text>

              <View style={styles.brokerLinkRow}>
                <Text style={styles.brokerLinkText}>Open account</Text>
                <Feather name="external-link" size={12} color={COLORS.blue} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* HOW IT WORKS */}
        <Text style={styles.sectionTitle}>How it works</Text>

        <View style={styles.stepsCard}>
          {STEPS.map((step, index) => (
            <View
              key={step}
              style={[
                styles.stepRow,
                index !== STEPS.length - 1 && styles.stepRowBorder,
              ]}
            >
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>

              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          You will be redirected to the broker's website. Account opening is
          handled entirely by the broker.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    paddingTop: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 12,
  },

  introCard: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  introTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },

  introText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#B7BFD6',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  brokerCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },

  brokerLogoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },

  brokerLogo: {
    width: 48,
    height: 48,
  },

  brokerInitial: {
    fontSize: 24,
    fontWeight: '700',
  },

  brokerName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },

  brokerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  brokerLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.blue,
  },

  stepsCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },

  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },

  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textDark,
  },

  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textGray,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
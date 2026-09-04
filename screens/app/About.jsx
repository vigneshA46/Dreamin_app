import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

// Keep this in sync with your AppNavigator.jsx
const BASE_TAB_BAR_HEIGHT = 75;

const APP_NAME = 'Dreamin Algo';
const APP_VERSION = '1.0.0';

// Update these to your real links
const WEBSITE_URL = 'https://dreamintraders.in';
const SUPPORT_EMAIL = 'support@dreamintraders.in';
const CONTACT_EMAIL = 'dreaminalgo@gmail.com';

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

const KEY_FEATURES = [
  'Strategy Marketplace',
  'Multiple Broker Support',
  'Real-time P&L Tracking',
  'Detailed Analytics & Reports',
  'Secure Token-based System',
];

const HIGHLIGHTS = [
  {
    icon: 'shield',
    title: 'Security First',
    description:
      'We prioritize your safety with encrypted systems, secure APIs, and token-based authentication to ensure your trading data remains protected.',
  },
  {
    icon: 'cpu',
    title: 'Future Ready',
    description:
      'Our platform is evolving with AI-driven strategy optimization, predictive analytics, and advanced backtesting tools.',
  },
];

async function openLink(url) {
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error('Error opening link:', error);
    Alert.alert('Unable to open', 'Please try again later.');
  }
}

export default function About({ navigation }) {
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

        <Text style={styles.headerTitle}>About</Text>

        <View style={styles.headerIconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* BRAND */}
        <View style={styles.brandSection}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Feather name="trending-up" size={26} color="#FFFFFF" />
            </View>

            <Text style={styles.brandName}>
              Dreamin <Text style={styles.brandNameAccent}>Algo</Text>
            </Text>
          </View>

          <Text style={styles.tagline}>Algorithmic trading made simple.</Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        {/* ABOUT THE PLATFORM */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About the Platform</Text>

          <Text style={styles.cardBody}>
            {APP_NAME} is a premium algorithmic trading and strategy
            marketplace platform designed for Indian retail traders. Deploy
            automated trading strategies across NSE, BSE, and MCX with your
            preferred broker.
          </Text>
        </View>

        {/* WHAT WE DO */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What We Do</Text>

          <Text style={styles.cardBody}>
            We simplify algorithmic trading by enabling users to deploy
            strategies, monitor trades in real-time, and learn trading
            concepts — all without coding.
          </Text>
        </View>

        {/* OUR MISSION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>

          <Text style={styles.cardBody}>
            To democratize algorithmic trading by making professional-grade
            automated strategies accessible to every retail trader in India.
          </Text>
        </View>

        {/* KEY FEATURES */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Features</Text>

          <View style={styles.featureList}>
            {KEY_FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Feather name="check" size={12} color={COLORS.green} />
                </View>

                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* HIGHLIGHTS (Security / Future) */}
        {HIGHLIGHTS.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.highlightRow}>
              <View style={styles.highlightIcon}>
                <Feather name={item.icon} size={20} color="#FFFFFF" />
              </View>

              <View style={styles.highlightText}>
                <Text style={styles.cardTitle}>{item.title}</Text>

                <Text style={styles.cardBody}>{item.description}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Join the Future of Trading</Text>

          <Text style={styles.ctaText}>
            Automate your strategies, reduce emotional decisions, and trade
            smarter with our platform.
          </Text>
        </View>

        {/* LINKS */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink(WEBSITE_URL)}
            activeOpacity={0.75}
          >
            <Text style={styles.linkButtonText}>Website</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.75}
          >
            <Text style={styles.linkButtonText}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => openLink(`mailto:${CONTACT_EMAIL}`)}
            activeOpacity={0.75}
          >
            <Text style={styles.linkButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
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
  },

  brandSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  brandNameAccent: {
    color: COLORS.blue,
  },

  tagline: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textGray,
  },

  versionBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textGray,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textGray,
  },

  featureList: {
    marginTop: 4,
    gap: 12,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EAF9EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
  },

  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },

  highlightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  highlightText: {
    flex: 1,
  },

  ctaSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },

  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },

  ctaText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textGray,
    textAlign: 'center',
  },

  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },

  linkButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
  },

  linkButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
});
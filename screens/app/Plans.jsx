import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Image,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

const BASE_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : 54;

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  gold: '#F59E0B',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
  overlay: 'rgba(15,27,42,0.5)',
};

// Same plan set as web's `plans` array (Planandpricing.jsx)
const PLANS = [
  {
    name: 'Starter',
    tokens: 7,
    originalPrice: 539,
    price: 490,
    discount: '10% OFF',
    features: ['7 Strategy Actions', 'Create / Deploy / Backtest', 'Basic Support'],
  },
  {
    name: 'Trader Pack',
    tokens: 20,
    originalPrice: 1540,
    price: 1400,
    discount: '10% OFF',
    features: ['20 Strategy Actions', 'Create / Deploy / Backtest', 'Priority Support'],
  },
  {
    name: 'Trader Pack',
    tokens: 30,
    originalPrice: 2210,
    price: 2100,
    discount: '10% OFF',
    features: ['30 Strategy Actions', 'Create / Deploy / Backtest', 'Priority Support'],
  },
  {
    name: 'Pro',
    tokens: 50,
    originalPrice: 3850,
    price: 3500,
    discount: '10% OFF',
    features: [
      '50 Strategy Actions',
      'All Features Access',
      'Priority Support',
      'Faster Execution',
    ],
    isBestValue: true,
  },
  {
    name: 'Advanced',
    tokens: 100,
    originalPrice: 7700,
    price: 7000,
    discount: '10% OFF',
    features: ['100 Strategy Actions', 'All Features Access', 'Priority Support'],
  },
];

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function PlanCard({ plan, onOrder }) {
  return (
    <View style={[styles.planCard, plan.isBestValue && styles.planCardBest]}>
      {plan.isBestValue && (
        <View style={styles.bestValueBadge}>
          <Feather name="star" size={10} color="#FFFFFF" />
          <Text style={styles.bestValueBadgeText}>MOST POPULAR</Text>
        </View>
      )}

      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={styles.planTokens}>{plan.tokens} Strategy Tokens</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceOld}>{formatINR(plan.originalPrice)}</Text>
        <View style={styles.discountPill}>
          <Text style={styles.discountPillText}>{plan.discount}</Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceNew}>{formatINR(plan.price)}</Text>
        <Text style={styles.priceGst}>Excluding GST</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.featuresList}>
        {plan.features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <View style={styles.featureCheck}>
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.orderButton, plan.isBestValue && styles.orderButtonBest]}
        activeOpacity={0.85}
        onPress={() => onOrder(plan)}
      >
        <Text
          style={[styles.orderButtonText, plan.isBestValue && styles.orderButtonTextBest]}
        >
          Order Now
        </Text>
        <Feather
          name="arrow-right"
          size={14}
          color={plan.isBestValue ? '#FFFFFF' : COLORS.navy}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function Plans({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  const [selectedPlan, setSelectedPlan] = React.useState(null);
  const [qrVisible, setQrVisible] = React.useState(false);
  const [showContactMessage, setShowContactMessage] = React.useState(false);

  const openOrder = (plan) => {
    setSelectedPlan(plan);
    setShowContactMessage(false);
    setQrVisible(true);
  };

  const closeOrder = () => {
    setQrVisible(false);
    setShowContactMessage(false);
    setSelectedPlan(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation?.goBack?.()}
          hitSlop={8}
        >
          <Feather name="chevron-left" size={22} color={COLORS.textDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Plans & Pricing</Text>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            1 TOKEN = 1 STRATEGY ACTION · CREATE / DEPLOY / BACKTEST / SIGNAL
          </Text>
        </View>

        {PLANS.map((plan, index) => (
          <PlanCard key={`${plan.name}-${index}`} plan={plan} onOrder={openOrder} />
        ))}

        <Text style={styles.disclaimer}>
          <Text style={{ fontWeight: '700', color: COLORS.textDark }}>Note: </Text>
          Tokens are deducted per strategy action. GST & payment gateway charges may apply.
        </Text>
      </ScrollView>

      {/* Payment QR modal — same flow as web: show QR, "I've Paid" reveals contact info */}
      <Modal visible={qrVisible} animationType="slide" transparent onRequestClose={closeOrder}>
        <Pressable style={styles.modalOverlay} onPress={closeOrder}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Your Payment</Text>
              <TouchableOpacity onPress={closeOrder} hitSlop={8}>
                <Feather name="x" size={20} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Scan the QR code using GPay / UPI to complete your payment.
            </Text>

            <View style={styles.qrWrap}>
              {/* Replace with your actual QR asset path */}
              <Image
                source={require('../../assets/qrcode.jpeg')}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              style={styles.paidButton}
              activeOpacity={0.85}
              onPress={() => setShowContactMessage(true)}
            >
              <Text style={styles.paidButtonText}>I've Paid</Text>
            </TouchableOpacity>

            {showContactMessage && (
              <View style={styles.contactMessageBox}>
                <Text style={styles.contactMessageText}>
                  Contact admin — send screenshot on WhatsApp to confirm payment and receive
                  tokens.
                </Text>
                <Text style={styles.contactNumbers}>
                  +91 9787675597 / +91 9080058704
                </Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  infoBanner: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  infoBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  planCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardBest: {
    borderColor: COLORS.navy,
    borderWidth: 1.5,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 14,
    right: 0,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  bestValueBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },

  planName: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 2 },
  planTokens: { fontSize: 12, color: COLORS.textGray, marginBottom: 10 },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  priceOld: { fontSize: 12, color: COLORS.textGray, textDecorationLine: 'line-through', marginRight: 8 },
  discountPill: { backgroundColor: '#E9F0FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  discountPillText: { fontSize: 11, fontWeight: '700', color: COLORS.blue },
  priceNew: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginRight: 8 },
  priceGst: { fontSize: 10, color: COLORS.textGray, marginLeft: 'auto' },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },

  featuresList: { marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  featureText: { fontSize: 13, color: COLORS.textDark, fontWeight: '500' },

  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 12,
    height: 46,
  },
  orderButtonBest: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  orderButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  orderButtonTextBest: { color: '#FFFFFF' },

  disclaimer: {
    fontSize: 12,
    color: COLORS.textGray,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 18,
  },

  // QR modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  modalSubtitle: { fontSize: 13, color: COLORS.textGray, textAlign: 'center', marginBottom: 20 },

  qrWrap: { alignItems: 'center', marginBottom: 20 },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  paidButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', backgroundColor: "#000000" },

  contactMessageBox: { marginTop: 16 },
  contactMessageText: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 8,
  },
  contactNumbers: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.blue,
    textAlign: 'center',
  },
});
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

// Keep in sync with the tabBarStyle height/paddingTop/paddingBottom set in AppNavigator.jsx
const BASE_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : 54;

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  red: '#EF4444',
  label: '#E0673C',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
  tokenBg: '#E9F0FF',
  iconBg: '#EEF2FF',
};

// Replace with real values from your API / store / auth context.
const user = {
  name: 'Vignesh',
  email: 'vignesh@email.com',
  tokens: 375,
};

const stats = {
  activeStrategies: 2,
  totalTrades: 46,
  winRate: 65,
};

const ACCOUNT_ITEMS = [
  {
    icon: 'link-2',
    title: 'Broker & Exchange',
    subtitle: 'Manage connected brokers',
    screen: 'Broker',
  },
  {
    icon: 'credit-card',
    title: 'Demat Account',
    subtitle: 'View account details',
    screen: 'DematAccount',
  },
  {
    icon: 'lock',
    title: 'Change Password',
    subtitle: 'Update your password',
    screen: 'ChangePassword',
  },
];

const INFO_ITEMS = [
  {
    icon: 'info',
    title: 'About Dreamin Algo',
    subtitle: 'Platform information',
    screen: 'About',
  },
  {
    icon: 'book-open',
    title: 'Tutorials',
    subtitle: 'Learn how to use the app',
    screen: 'Tutorials',
  },
  {
    icon: 'shield',
    title: 'Privacy Policy',
    subtitle: 'Data & privacy',
    screen: 'Privacy',
    danger: true,
  },
];

function ListRow({ icon, title, subtitle, danger, onPress }) {
  return (
    <TouchableOpacity style={styles.listRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.listIconWrap}>
        <Feather name={icon} size={16} color={danger ? COLORS.label : COLORS.blue} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.listTitle, danger && { color: COLORS.label }]}>{title}</Text>
        <Text style={styles.listSubtitle}>{subtitle}</Text>
      </View>

      <Feather name="chevron-right" size={18} color={COLORS.textGray} />
    </TouchableOpacity>
  );
}

export default function Profile({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Profile</Text>

        {/* User card */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
          </View>

          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Tokens row */}
        <View style={styles.tokensRow}>
          <View style={styles.tokenPill}>
            <Text style={styles.tokenPillText}>{user.tokens} Tokens</Text>
          </View>

          <TouchableOpacity style={styles.buyMoreButton} activeOpacity={0.85}>
            <Feather name="plus" size={13} color={COLORS.navy} />
            <Text style={styles.buyMoreText}>Buy More</Text>
          </TouchableOpacity>
        </View>

        {/* Stat grid */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.activeStrategies}</Text>
            <Text style={styles.statLabel}>Active Strategies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalTrades}</Text>
            <Text style={styles.statLabel}>Total Trades</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.green }]}>
              {stats.winRate}%
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>

        {/* Account section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.listGroup}>
          {ACCOUNT_ITEMS.map((item, index) => (
            <React.Fragment key={item.title}>
            <ListRow
              {...item}
              onPress={() => navigation.getParent()?.navigate(item.screen)}
            />

              {index < ACCOUNT_ITEMS.length - 1 && (
              <View style={styles.rowDivider} />
              )}
            </React.Fragment>
        ))}
        </View>

        {/* Information section */}
        <Text style={styles.sectionLabel}>INFORMATION</Text>
        <View style={styles.listGroup}>
          {INFO_ITEMS.map((item, index) => (
            <React.Fragment key={item.title}>
            <ListRow
              {...item}
              onPress={() => navigation.getParent()?.navigate(item.screen)}
            />

              {index < INFO_ITEMS.length - 1 && (
              <View style={styles.rowDivider} />
              )}
              </React.Fragment>
))}
        </View>

        {/* Logout — not in the reference screenshot but standard on a profile
            screen; remove if you have it living elsewhere (e.g. a settings screen). */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85}>
          <Feather name="log-out" size={16} color={COLORS.red} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 20,
  },

  // User row
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.blue,
  },

  // Tokens
  tokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenPill: {
    backgroundColor: COLORS.tokenBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  tokenPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
  },
  buyMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buyMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginLeft: 4,
  },

  // Stat grid
  statRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textGray,
    textAlign: 'center',
  },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGray,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  listGroup: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  listIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 60,
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    height: 50,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.red,
    marginLeft: 8,
  },
});
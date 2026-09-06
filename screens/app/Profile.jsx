import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import { apiRequest } from '../../services/api';
import { useUser } from '../../context/UserContext';

// Keep in sync with the tabBarStyle height/paddingTop/paddingBottom
const BASE_TAB_BAR_HEIGHT =
  Platform.OS === 'ios' ? 60 : 54;

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
    icon: 'dollar-sign',
    title: 'Plans & Pricing',
    subtitle: 'Explore our plans',
    screen: 'Plans',
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
  {
    icon: 'file-text',
    title: 'Terms & Conditions',
    subtitle: 'Terms of use',
    screen: 'Terms',
  },
  
];

function ListRow({
  icon,
  title,
  subtitle,
  danger,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.listRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.listIconWrap}>
        <Feather
          name={icon}
          size={16}
          color={
            danger
              ? COLORS.label
              : COLORS.blue
          }
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.listTitle,
            danger && {
              color: COLORS.label,
            },
          ]}
        >
          {title}
        </Text>

        <Text style={styles.listSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Feather
        name="chevron-right"
        size={18}
        color={COLORS.textGray}
      />
    </TouchableOpacity>
  );
}

export default function Profile({ navigation }) {
  const insets = useSafeAreaInsets();

  const {logout} = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const tabBarHeight =
    BASE_TAB_BAR_HEIGHT + insets.bottom;

  /* =========================
     FETCH LOGGED-IN USER
  ========================= */

  const fetchUser = async () => {
    try {
      setLoading(true);

      const res = await apiRequest(
        'POST',
        '/api/users/me'
      );

      console.log(
        'PROFILE USER:',
        res
      );

      setUser(res);
    } catch (error) {
      console.log(
        'PROFILE USER ERROR:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <StatusBar style="dark" />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={COLORS.blue}
          />
        </View>
      </SafeAreaView>
    );
  }

  /* =========================
     USER FALLBACK
  ========================= */

  const userName =
    user?.fullname || 'User';

  const userEmail =
    user?.email || '-';

  const userPhone =
    user?.mobile_number ||
    user?.mobile ||
    user?.phone ||
    '-';

  const userTokens =
    user?.tokens ?? 0;

  const avatarLetter =
    userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              tabBarHeight + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* =========================
            HEADER
        ========================= */}

        <Text style={styles.headerTitle}>
          Profile
        </Text>

        {/* =========================
            USER
        ========================= */}

        <View style={styles.userRow}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {avatarLetter}
            </Text>
          </View>

          <View style={styles.userDetails}>

            <Text style={styles.userName}>
              {userName}
            </Text>

            <Text style={styles.userEmail}>
              {userEmail}
            </Text>

           {/*  <View style={styles.phoneRow}>
              <Feather
                name="phone"
                size={12}
                color={COLORS.textGray}
              />

              <Text style={styles.userPhone}>
                {userPhone}
              </Text>
            </View> */}

          </View>

        </View>

        {/* =========================
            TOKENS
        ========================= */}

        <View style={styles.tokensRow}>

          <View style={styles.tokenPill}>
            <Text style={styles.tokenPillText}>
              {userTokens} Tokens
            </Text>
          </View>

          <TouchableOpacity
            style={styles.buyMoreButton}
            activeOpacity={0.85}
            onPress={() =>navigation.getParent()?.navigate('Plans')}
          >
            <Feather
              name="plus"
              size={13}
              color={COLORS.navy}
            />

            <Text style={styles.buyMoreText}>
              Buy More
            </Text>
          </TouchableOpacity>

        </View>

        {/* =========================
            ACCOUNT
        ========================= */}

        <Text style={styles.sectionLabel}>
          ACCOUNT
        </Text>

        <View style={styles.listGroup}>

          {ACCOUNT_ITEMS.map(
            (item, index) => (
              <React.Fragment
                key={item.title}
              >

                <ListRow
                  {...item}
                  onPress={() =>
                    navigation
                      .getParent()
                      ?.navigate(
                        item.screen
                      )
                  }
                />

                {index <
                  ACCOUNT_ITEMS.length - 1 && (
                  <View
                    style={
                      styles.rowDivider
                    }
                  />
                )}

              </React.Fragment>
            )
          )}

        </View>

        {/* =========================
            INFORMATION
        ========================= */}

        <Text style={styles.sectionLabel}>
          INFORMATION
        </Text>

        <View style={styles.listGroup}>

          {INFO_ITEMS.map(
            (item, index) => (
              <React.Fragment
                key={item.title}
              >

                <ListRow
                  {...item}
                  onPress={() =>
                    navigation
                      .getParent()
                      ?.navigate(
                        item.screen
                      )
                  }
                />

                {index <
                  INFO_ITEMS.length - 1 && (
                  <View
                    style={
                      styles.rowDivider
                    }
                  />
                )}

              </React.Fragment>
            )
          )}

        </View>

        {/* =========================
            LOGOUT
        ========================= */}

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Feather
            name="log-out"
            size={16}
            color={COLORS.red}
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        <Modal
  visible={logoutModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setLogoutModalVisible(false)}
>
  <View style={styles.modalOverlay}>

    <View style={styles.logoutModal}>

      {/* Icon */}
      <View style={styles.logoutIconContainer}>
        <Feather
          name="log-out"
          size={24}
          color={COLORS.red}
        />
      </View>

      {/* Title */}
      <Text style={styles.logoutModalTitle}>
        Logout
      </Text>

      {/* Description */}
      <Text style={styles.logoutModalMessage}>
        Are you sure you want to logout from your account?
      </Text>

      {/* Buttons */}
      <View style={styles.logoutModalButtons}>

        <TouchableOpacity
          style={styles.cancelButton}
          activeOpacity={0.8}
          onPress={() => setLogoutModalVisible(false)}
        >
          <Text style={styles.cancelButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmLogoutButton}
          activeOpacity={0.8}
          onPress={async () => {
            setLogoutModalVisible(false);
            await logout();
          }}
        >
          <Text style={styles.confirmLogoutText}>
            Logout
          </Text>
        </TouchableOpacity>

      </View>

    </View>

  </View>
</Modal>

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

  /* =========================
     USER
  ========================= */

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

  userDetails: {
    flex: 1,
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
    marginBottom: 4,
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  userPhone: {
    fontSize: 12,
    color: COLORS.textGray,
    marginLeft: 5,
  },

  /* =========================
     TOKENS
  ========================= */

  tokensRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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

  /* =========================
     SECTION
  ========================= */

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

  /* =========================
     LOGOUT
  ========================= */

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

  /* =========================
     LOADING
  ========================= */

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 24,
},

logoutModal: {
  width: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: 22,
  padding: 24,
  alignItems: 'center',
},

logoutIconContainer: {
  width: 54,
  height: 54,
  borderRadius: 27,
  backgroundColor: '#FFF1F2',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
},

logoutModalTitle: {
  fontSize: 20,
  fontWeight: '800',
  color: COLORS.text,
  marginBottom: 8,
},

logoutModalMessage: {
  fontSize: 14,
  lineHeight: 21,
  color: COLORS.gray,
  textAlign: 'center',
  marginBottom: 24,
},

logoutModalButtons: {
  flexDirection: 'row',
  width: '100%',
  gap: 10,
},

cancelButton: {
  flex: 1,
  height: 46,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  alignItems: 'center',
  justifyContent: 'center',
},

cancelButtonText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#374151',
},

confirmLogoutButton: {
  flex: 1,
  height: 46,
  borderRadius: 12,
  backgroundColor: COLORS.red,
  alignItems: 'center',
  justifyContent: 'center',
},

confirmLogoutText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#FFFFFF',
},
});
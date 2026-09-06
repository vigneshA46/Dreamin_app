import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../../services/api';


const COLORS = {
  background: '#F7F8FA',
  white: '#FFFFFF',
  textDark: '#111827',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  green: '#16A34A',
  greenBg: '#ECFDF3',
  red: '#EF4444',
  redBg: '#FEF2F2',
  blue: '#2563EB',
  blueBg: '#EFF6FF',
  navy: '#0B1020',
};

const BROKERS = [
  /* {
    name: 'Dhan',
    key: 'dhan',
    initial: 'D',
    available: true,
  },
  {
    name: 'Zerodha',
    key: 'zerodha',
    initial: 'Z',
    available: true,
  },
  {
    name: 'Alice Blue',
    key: 'aliceblue',
    initial: 'A',
    available: true,
  },
  {
    name: 'Angel One',
    key: 'angelone',
    initial: 'A',
    available: false,
  }, */
  {
    name: 'Zebu',
    key: 'zebumynt',
    initial: 'Z',
    available: true,
  },
];

export default function Brokers({ navigation }) {
  const [userBroker, setUserBroker] = useState([]);
  const [loading, setLoading] = useState(true);

  const [connectModal, setConnectModal] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);

  const [credentialsModal, setCredentialsModal] = useState(false);
  const [selectedConnectedBroker, setSelectedConnectedBroker] =
    useState(null);

  const [form, setForm] = useState({});
  const [editedCredentials, setEditedCredentials] = useState({});

  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // --------------------------------------------------
  // FETCH BROKERS
  // --------------------------------------------------

  const fetchBrokers = async () => {
    try {
      setLoading(true);

      const res = await apiRequest('GET', '/api/broker/');

      setUserBroker(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log('Fetch brokers failed:', err);

      Alert.alert(
        'Error',
        err?.message || 'Unable to fetch broker details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const normalizeBrokerName = (name) => {
    return name.toLowerCase().replace(/\s/g, '');
  };

  const getConnectedBroker = (brokerKey) => {
    return userBroker.find(
      (broker) =>
        broker.broker_name?.toLowerCase() ===
        brokerKey.toLowerCase()
    );
  };

  const isBrokerConnected = (brokerKey) => {
    return !!getConnectedBroker(brokerKey);
  };

  // --------------------------------------------------
  // FORM
  // --------------------------------------------------

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCredential = (field, value) => {
    setEditedCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // --------------------------------------------------
  // OPEN CONNECT
  // --------------------------------------------------

  const openConnectModal = (broker) => {
    if (!broker.available) {
      return;
    }

    setSelectedBroker(broker);
    setForm({});
    setConnectModal(true);
  };

  // --------------------------------------------------
  // CONNECT BROKER
  // --------------------------------------------------

  const handleConnect = async () => {
    if (!selectedBroker) return;

    try {
      setSaving(true);

      const payload = {
        brokerName: normalizeBrokerName(selectedBroker.name),
        credentials: form,
      };

      console.log('Broker payload:', payload);

      const response = await apiRequest(
        'POST',
        '/api/broker',
        payload
      );

      if (response?.broker) {
        setUserBroker((prev) => [
          ...prev,
          response.broker,
        ]);
      } else {
        await fetchBrokers();
      }

      setConnectModal(false);
      setSelectedBroker(null);
      setForm({});

      Alert.alert(
        'Connected',
        `${selectedBroker.name} connected successfully`
      );
    } catch (err) {
      console.log('Connect broker failed:', err);

      Alert.alert(
        'Connection Failed',
        err?.message || 'Unable to connect broker'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // MANAGE CREDENTIALS
  // --------------------------------------------------

  const openManage = (broker) => {
    setSelectedConnectedBroker(broker);
    setEditedCredentials(broker.credentials || {});
    setCredentialsModal(true);
  };

  const handleUpdateCredentials = async () => {
    if (!selectedConnectedBroker) return;

    try {
      setSaving(true);

      await apiRequest(
        'PATCH',
        `/api/broker/${selectedConnectedBroker.id}/credentials`,
        {
          credentials: editedCredentials,
        }
      );

      setUserBroker((prev) =>
        prev.map((broker) =>
          broker.id === selectedConnectedBroker.id
            ? {
                ...broker,
                credentials: editedCredentials,
              }
            : broker
        )
      );

      setCredentialsModal(false);

      Alert.alert(
        'Updated',
        'Broker credentials updated successfully'
      );
    } catch (err) {
      console.log('Update credentials failed:', err);

      Alert.alert(
        'Update Failed',
        err?.message || 'Unable to update credentials'
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DISCONNECT
  // --------------------------------------------------

  const handleDisconnect = (broker) => {
    Alert.alert(
      'Disconnect Broker',
      `Are you sure you want to disconnect ${broker.broker_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectBroker(broker),
        },
      ]
    );
  };

  const disconnectBroker = async (broker) => {
    try {
      setDisconnecting(true);

      await apiRequest(
        'DELETE',
        `/api/broker/${broker.id}`
      );

      setUserBroker((prev) =>
        prev.filter((item) => item.id !== broker.id)
      );

      Alert.alert(
        'Disconnected',
        `${broker.broker_name} disconnected successfully`
      );
    } catch (err) {
      console.log('Disconnect failed:', err);

      Alert.alert(
        'Error',
        err?.message || 'Unable to disconnect broker'
      );
    } finally {
      setDisconnecting(false);
    }
  };

  // --------------------------------------------------
  // BROKER FORM
  // --------------------------------------------------

  const renderBrokerForm = () => {
    if (!selectedBroker) return null;

    switch (selectedBroker.key) {
      case 'dhan':
        return (
          <>
            <InputField
              label="Client ID"
              value={form.clientId}
              onChangeText={(value) =>
                handleChange('clientId', value)
              }
            />

            <InputField
              label="Access Token"
              value={form.access_token}
              onChangeText={(value) =>
                handleChange('access_token', value)
              }
              secure
            />
          </>
        );

      case 'zerodha':
        return (
          <>
            <InputField
              label="API Key"
              value={form.apikey}
              onChangeText={(value) =>
                handleChange('apikey', value)
              }
            />

            <InputField
              label="API Secret"
              value={form.apisecret}
              onChangeText={(value) =>
                handleChange('apisecret', value)
              }
              secure
            />

            <InputField
              label="Token"
              value={form.token}
              onChangeText={(value) =>
                handleChange('token', value)
              }
              secure
            />
          </>
        );

      case 'aliceblue':
        return (
          <>
            <InputField
              label="User ID"
              value={form.userId}
              onChangeText={(value) =>
                handleChange('userId', value)
              }
            />

            <InputField
              label="API Key"
              value={form.apiKey}
              onChangeText={(value) =>
                handleChange('apiKey', value)
              }
            />

            <InputField
              label="App Code"
              value={form.appCode}
              onChangeText={(value) =>
                handleChange('appCode', value)
              }
              secure
            />
          </>
        );

      case 'zebumynt':
        return (
          <>
            <InputField
              label="User ID"
              value={form.uid}
              onChangeText={(value) =>
                handleChange('uid', value)
              }
            />

            <InputField
              label="Password"
              value={form.password}
              onChangeText={(value) =>
                handleChange('password', value)
              }
              secure
            />

            <InputField
              label="TOTP / 2 Factor"
              value={form.factor2}
              onChangeText={(value) =>
                handleChange('factor2', value)
              }
            />

            <InputField
              label="API Key"
              value={form.apiKey}
              onChangeText={(value) =>
                handleChange('apiKey', value)
              }
            />
          </>
        );

      default:
        return (
          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonText}>
              Broker connection coming soon.
            </Text>
          </View>
        );
    }
  };

  // --------------------------------------------------
  // EDIT CREDENTIALS
  // --------------------------------------------------

  const renderCredentialInputs = () => {
    const entries = Object.entries(
      editedCredentials || {}
    );

    if (entries.length === 0) {
      return (
        <Text style={styles.noCredentials}>
          No credentials available.
        </Text>
      );
    }

    return entries.map(([key, value]) => (
      <InputField
        key={key}
        label={formatLabel(key)}
        value={String(value ?? '')}
        onChangeText={(newValue) =>
          handleEditCredential(key, newValue)
        }
        secure={
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token')
        }
      />
    ));
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator
          size="small"
          color={COLORS.navy}
        />

        <Text style={styles.loadingText}>
          Loading brokers...
        </Text>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
          hitSlop={8}
        >
          <Feather
            name="chevron-left"
            size={20}
            color={COLORS.textDark}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Broker & Exchange
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CONNECTED BROKER */}

        {userBroker.length > 0 && (
          <View style={styles.section}>
            {userBroker.map((broker, index) => (
            <View
                key={broker.id}
                style={[
                    styles.connectedCard,
                    index < userBroker.length - 1 && styles.connectedCardGap,
                ]}
                >
                <View style={styles.connectedTop}>
                  <View style={styles.brokerIdentity}>
                    <View style={styles.brokerLogo}>
                      <Text style={styles.brokerLogoText}>
                        {broker.broker_name
                          ?.charAt(0)
                          ?.toUpperCase()}
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.brokerName}>
                        {formatBrokerName(
                          broker.broker_name
                        )}
                      </Text>

                      <Text style={styles.activeText}>
                        Account: Active
                      </Text>
                    </View>
                  </View>

                  <View style={styles.connectedBadge}>
                    <View style={styles.connectedDot} />

                    <Text style={styles.connectedText}>
                      Connected
                    </Text>
                  </View>
                </View>

                <View style={styles.connectedActions}>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => openManage(broker)}
                  >
                    <Text style={styles.manageText}>
                      Manage
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={() =>
                      handleDisconnect(broker)
                    }
                    disabled={disconnecting}
                  >
                    <Text style={styles.disconnectText}>
                      Disconnect
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ADD BROKER */}

        <View style={styles.addBrokerSection}>
          <Text style={styles.sectionLabel}>
            ADD BROKER
          </Text>

          <View style={styles.brokerList}>
            {BROKERS.map((broker, index) => {
              const connected = isBrokerConnected(
                broker.key
              );

              return (
                <View
                  key={broker.key}
                  style={[
                    styles.brokerRow,
                    index === BROKERS.length - 1 &&
                      styles.lastBrokerRow,
                  ]}
                >
                  <View style={styles.brokerIdentity}>
                    <View
                      style={[
                        styles.smallLogo,
                        !broker.available &&
                          styles.smallLogoDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.smallLogoText,
                          !broker.available &&
                            styles.smallLogoTextDisabled,
                        ]}
                      >
                        {broker.initial}
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={[
                          styles.listBrokerName,
                          !broker.available &&
                            styles.disabledText,
                        ]}
                      >
                        {broker.name}
                      </Text>

                      <Text
                        style={[
                          styles.availabilityText,
                          !broker.available &&
                            styles.comingSoonTextSmall,
                        ]}
                      >
                        {connected
                          ? 'Connected'
                          : broker.available
                          ? 'Available'
                          : 'Coming Soon'}
                      </Text>
                    </View>
                  </View>

                  {connected ? (
                    <View style={styles.connectedSmallBadge}>
                      <Text
                        style={
                          styles.connectedSmallBadgeText
                        }
                      >
                        Connected
                      </Text>
                    </View>
                  ) : broker.available ? (
                    <TouchableOpacity
                      style={styles.connectButton}
                      onPress={() =>
                        openConnectModal(broker)
                      }
                    >
                      <Text style={styles.connectButtonText}>
                        Connect
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.soonButton}>
                      <Text style={styles.soonButtonText}>
                        Soon
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* SECURITY INFORMATION */}

        <View style={styles.securityBox}>
          <View style={styles.securityIcon}>
            <Feather
              name="shield"
              size={16}
              color={COLORS.blue}
            />
          </View>

          <Text style={styles.securityText}>
            Your broker credentials are securely handled
            using OAuth and are never stored or displayed
            in the app.
          </Text>
        </View>
      </ScrollView>

      {/* CONNECT MODAL */}

      <Modal
        visible={connectModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setConnectModal(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Connect {selectedBroker?.name}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter your broker credentials
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (!saving) {
                    setConnectModal(false);
                  }
                }}
              >
                <Feather
                  name="x"
                  size={22}
                  color={COLORS.textGray}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderBrokerForm()}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  saving && styles.buttonDisabled,
                ]}
                onPress={handleConnect}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Connect Broker
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MANAGE CREDENTIALS MODAL */}

      <Modal
        visible={credentialsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setCredentialsModal(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Manage Broker
                </Text>

                <Text style={styles.modalSubtitle}>
                  {selectedConnectedBroker?.broker_name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (!saving) {
                    setCredentialsModal(false);
                  }
                }}
              >
                <Feather
                  name="x"
                  size={22}
                  color={COLORS.textGray}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {renderCredentialInputs()}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  saving && styles.buttonDisabled,
                ]}
                onPress={handleUpdateCredentials}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Update Credentials
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// INPUT COMPONENT
// --------------------------------------------------

function InputField({
  label,
  value,
  onChangeText,
  secure = false,
}) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value || ''}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        placeholder={`Enter ${label}`}
        placeholderTextColor={COLORS.textLight}
      />
    </View>
  );
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function formatBrokerName(name) {
  if (!name) return '';

  const names = {
    dhan: 'Dhan',
    zerodha: 'Zerodha',
    aliceblue: 'Alice Blue',
    zebumynt: 'Zebu',
    angelone: 'Angel One',
    flattrade: 'Flattrade',
    upstox: 'Upstox',
  };

  return (
    names[name.toLowerCase()] ||
    name.charAt(0).toUpperCase() + name.slice(1)
  );
}

function formatLabel(key) {
  const labels = {
    apiKey: 'API Key',
    apiSecret: 'API Secret',
    apikey: 'API Key',
    apisecret: 'API Secret',
    access_token: 'Access Token',
    clientId: 'Client ID',
    userId: 'User ID',
    uid: 'User ID',
    appCode: 'App Code',
    factor2: 'TOTP / 2 Factor',
    password: 'Password',
    token: 'Token',
    redirectUri: 'Redirect URI',
  };

  return (
    labels[key] ||
    key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },

  section: {
    marginBottom: 20,
  },

  connectedCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 14,
  },

  connectedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  brokerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brokerLogo: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  brokerLogoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  brokerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  activeText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },

  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 6,
  },

  connectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green,
  },

  connectedActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  manageButton: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  manageText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },

  disconnectButton: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disconnectText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.red,
  },

  addBrokerSection: {
    marginBottom: 20,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B95A5',
    marginBottom: 10,
    marginLeft: 2,
    letterSpacing: 0.3,
  },

  brokerList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },

  brokerRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F3',
  },

  lastBrokerRow: {
    borderBottomWidth: 0,
  },

  smallLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  smallLogoDisabled: {
    backgroundColor: '#F6F7F8',
  },

  smallLogoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  smallLogoTextDisabled: {
    color: '#AEB5BF',
  },

  listBrokerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },

  availabilityText: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },

  comingSoonTextSmall: {
    color: '#AEB5BF',
  },

  disabledText: {
    color: '#9CA3AF',
  },

  connectButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  connectedSmallBadge: {
    backgroundColor: COLORS.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  connectedSmallBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
  },

  soonButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  soonButtonText: {
    color: '#B3B8C0',
    fontSize: 10,
    fontWeight: '600',
  },

  securityBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.blueBg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },

  securityIcon: {
    marginRight: 8,
    marginTop: 1,
  },

  securityText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: '#3567B4',
  },

  // MODAL

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
  },

  modalSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 4,
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 13,
    fontSize: 14,
    color: COLORS.textDark,
    backgroundColor: '#FAFAFB',
  },

  primaryButton: {
    height: 46,
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  comingSoonBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 9,
    padding: 15,
    marginBottom: 15,
  },

  comingSoonText: {
    fontSize: 13,
    color: COLORS.textGray,
    textAlign: 'center',
  },

  noCredentials: {
    fontSize: 13,
    color: COLORS.textGray,
    marginBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textGray,
  },
  connectedCardGap: {
    marginBottom: 12,
  },
});
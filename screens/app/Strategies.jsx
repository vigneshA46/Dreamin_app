import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SectionList,
  FlatList,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import DeploymentSuccess from './Deploymentsuccess';
import { apiRequest } from "../../services/api";
import { Alert } from 'react-native'; // add to your existing react-native import line


const BASE_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : 54;

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
  overlay: 'rgba(15,27,42,0.5)',
};

const MULTIPLIERS = Array.from({ length: 20 }, (_, i) => `${i + 1}x`);
const DEPLOYMENT_TYPES = ['Paper', 'Live Auto'];
const BROKERS = ['AngelOne', 'Zebu Mynt'];

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

// Same logic as web isCurrentTimeBetween
function isCurrentTimeBetween(startTime, endTime) {
  if (!startTime || !endTime) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function groupByCategory(items) {
  return items.reduce((acc, item) => {
    const categoryName = item.category || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {});
}

// Simple reusable pressable dropdown used inside the deploy modal.
function Dropdown({ label, value, options, onSelect, placeholder = 'Select' }) {
  const [open, setOpen] = React.useState(false);

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TouchableOpacity
        style={styles.dropdownField}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.85}
      >
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textGray} />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdownMenu}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            nestedScrollEnabled
            style={{ maxHeight: 220 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownMenuItem}
                onPress={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownMenuItemText,
                    item === value && { color: COLORS.blue, fontWeight: '700' },
                  ]}
                >
                  {item}
                </Text>
                {item === value && <Feather name="check" size={14} color={COLORS.blue} />}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

// Deploy Strategy modal
// ⚠️ Placeholder submit logic — real deploy endpoint/payload unknown until
// DeployStrategyModal.jsx (web) is shared. Swap handleDeploy's body for a
// real apiRequest('POST', ...) call once confirmed.

// Deploy Strategy modal — wired to real /api/deployments + /api/broker/userbase
function DeployModal({ strategy, visible, onClose, onDeploySuccess }) {
  const [multiplier, setMultiplier] = React.useState('1x');
  const [deploymentType, setDeploymentType] = React.useState('LIVE AUTO');
  const [broker, setBroker] = React.useState(''); // holds broker_account_id
  const [brokers, setBrokers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch broker accounts once on mount (mirrors web's useEffect on modal mount)
  React.useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const res = await apiRequest('GET', '/api/broker/userbase');
        setBrokers(res || []);
      } catch (err) {
        console.log('brokers error', err);
      }
    };
    fetchBrokers();
  }, []);

  // Reset form each time a new strategy is opened.
  React.useEffect(() => {
    if (visible) {
      setMultiplier('1x');
      setDeploymentType('LIVE AUTO');
      setBroker('');
    }
  }, [visible, strategy]);

  if (!strategy) return null;

  const deployStrategy = async (strategyId, type, brokerId, multiplierValue) => {
    if (loading) return;

    if (type !== 'paper' && brokerId === '') {
      Alert.alert('Broker Required', 'Please select a broker account');
      return;
    }

    try {
      setLoading(true);

      const res = await apiRequest('POST', '/api/deployments', {
        strategy_id: strategyId,
        type,
        broker_account_id: brokerId,
        multiplier: multiplierValue,
      });

      console.log('deploy response', res);

      if (!res.success) {
        Alert.alert('Deployment Failed', res.message || 'Something went wrong');
        return;
      }

      onDeploySuccess({
        strategyName: strategy.name,
        broker: type === 'paper' ? 'Paper Trading' : type,
        exchange: 'NSE',
        capital: formatINR(strategy.capital_required),
        lots: multiplierValue,
        status: 'ACTIVE',
      });

      onClose();
    } catch (err) {
      console.log(err);
      Alert.alert('Server Error', err.message || 'Failed to deploy strategy');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = () => {
    let type = 'paper';
    let brokerId = '';

    if (deploymentType === 'LIVE AUTO') {
      const selectedBroker = brokers.find((b) => b.id === broker);
      type = selectedBroker?.broker_name || '';
      brokerId = broker;
    }

    const multiplierValue = parseInt(multiplier, 10);

    deployStrategy(strategy.id, type, brokerId, multiplierValue);
  };

  const canDeploy =
    !loading && (deploymentType !== 'LIVE AUTO' || !!broker);

  const brokerOptions = brokers.map((b) => b.broker_name);
  const selectedBrokerLabel = brokers.find((b) => b.id === broker)?.broker_name || '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        if (!loading) onClose();
      }}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => {
          if (!loading) onClose();
        }}
      >
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{strategy.name}</Text>
            <TouchableOpacity onPress={() => !loading && onClose()} hitSlop={8} disabled={loading}>
              <Feather name="x" size={20} color={loading ? COLORS.textGray : COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <Dropdown
            label="MULTIPLIER"
            value={multiplier}
            options={MULTIPLIERS}
            onSelect={setMultiplier}
          />

          <Dropdown
            label="DEPLOYMENT TYPE"
            value={deploymentType}
            options={DEPLOYMENT_TYPES}
            onSelect={setDeploymentType}
          />

          {deploymentType === 'LIVE AUTO' && (
            <Dropdown
              label="BROKER"
              value={selectedBrokerLabel}
              options={brokerOptions}
              onSelect={(label) => {
                const match = brokers.find((b) => b.broker_name === label);
                setBroker(match?.id || '');
              }}
              placeholder="Select broker"
            />
          )}

          <TouchableOpacity
            style={[styles.deployConfirmButton, !canDeploy && { opacity: 0.4 }]}
            disabled={!canDeploy}
            onPress={handleDeploy}
            activeOpacity={0.85}
          >
            <Text style={styles.deployConfirmText}>
              {loading ? 'DEPLOYING...' : 'DEPLOY STRATEGY'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function Strategies({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  const [query, setQuery] = React.useState('');
  const [expandedId, setExpandedId] = React.useState(null);
  const [deployTarget, setDeployTarget] = React.useState(null);
  const [deploymentResult, setDeploymentResult] = React.useState(null);

  const [strategies, setStrategies] = React.useState([]);
  const [todayDeployment, setTodayDeployment] = React.useState([]);

  const fetchStrategies = React.useCallback(async (userId) => {
    try {
      const response = await apiRequest('GET', `/api/stratergy/user/${userId}`);
      const sorted = (response?.strategies || []).sort(
        (a, b) => Number(a.state_id) - Number(b.state_id)
      );
      setStrategies(sorted);
    } catch (err) {
      console.log('strategies error', err);
    }
  }, []);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await apiRequest('POST', '/api/users/me');
      if (res?.id) fetchStrategies(res.id);
    } catch (err) {
      console.log('user error', err);
    }
  }, [fetchStrategies]);

  const fetchTodayDeployment = React.useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/deployments/user/today');
      setTodayDeployment(res || []);
    } catch (err) {
      console.log('deployments error', err);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
    fetchTodayDeployment();
  }, [fetchUser, fetchTodayDeployment]);

  const deployedStrategyIds = React.useMemo(
    () => new Set(todayDeployment.map((d) => d.strategy_id)),
    [todayDeployment]
  );

  const filteredStrategies = React.useMemo(() => {
    if (!query.trim()) return strategies;
    const q = query.trim().toLowerCase();
    return strategies.filter(
      (s) =>
        s.state_id?.toString().toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q)
    );
  }, [strategies, query]);

  const sections = React.useMemo(() => {
    const grouped = groupByCategory(filteredStrategies);
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [filteredStrategies]);

  if (deploymentResult) {
    return (
      <DeploymentSuccess
        deployment={deploymentResult}
        onViewDeployment={() => {
          setDeploymentResult(null);
        }}
        onGoToDashboard={() => {
          setDeploymentResult(null);
          navigation?.navigate?.('Home');
        }}
      />
    );
  }

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

        <Text style={styles.headerTitle}>Strategies</Text>

        <View style={{ width: 32 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: tabBarHeight + 24,
        }}
        ListHeaderComponent={
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={COLORS.textGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search strategies by name, ID or category..."
              placeholderTextColor={COLORS.textGray}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        }
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: COLORS.textGray, paddingVertical: 24 }}>
            No matching strategies found.
          </Text>
        }
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Feather name="folder" size={16} color={COLORS.textGray} />
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionCountPill}>
              <Text style={styles.sectionCountText}>{data.length}</Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isDeployed = deployedStrategyIds.has(item.id);
          const isRunning = isCurrentTimeBetween(item.starting_time, item.ending_time);
          const isDisabled = isDeployed || isRunning;
          const description = item.description || '';
          const isLong = description.length > 120;

          return (
            <View style={styles.strategyCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <View style={styles.rowBetween}>
                  <View style={styles.rowStart}>
                    <Text style={styles.strategyIndex}>ID: {item.state_id || 'N/A'}</Text>
                  </View>

                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textGray}
                  />
                </View>

                <Text style={styles.strategyTitle}>{item.name}</Text>
                {!!description && (
                  <Text style={styles.strategyDescription} numberOfLines={isExpanded ? undefined : 1}>
                    {isExpanded || !isLong ? description : `${description.slice(0, 120)}...`}
                  </Text>
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.divider} />

                  <Text style={styles.capitalLabel}>Required Capital</Text>
                  <Text style={styles.capitalValue}>{formatINR(item.capital_required)}</Text>

                  <TouchableOpacity
                    style={[styles.deployButton, isDisabled && { backgroundColor: COLORS.border }]}
                    activeOpacity={isDisabled ? 1 : 0.85}
                    disabled={isDisabled}
                    onPress={() => setDeployTarget(item)}
                  >
                    <Text
                      style={[
                        styles.deployButtonText,
                        isDisabled && { color: COLORS.textGray },
                      ]}
                    >
                      {isDeployed ? 'DEPLOYED' : isRunning ? 'RUNNING TIME' : 'DEPLOY STRATEGY'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
      />

      <DeployModal
        strategy={deployTarget}
        visible={!!deployTarget}
        onClose={() => setDeployTarget(null)}
        onDeploySuccess={setDeploymentResult}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  rowStart: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerIconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 4,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textDark, marginLeft: 8 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: 8,
  },
  sectionCountPill: {
    marginLeft: 8,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionCountText: { fontSize: 11, fontWeight: '700', color: COLORS.textGray },

  strategyCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  strategyIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGray,
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  strategyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginTop: 8, lineHeight: 19 },
  strategyDescription: { fontSize: 12, color: COLORS.textGray, marginTop: 4 },

  expandedSection: { marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  capitalLabel: { fontSize: 11, color: COLORS.textGray, marginBottom: 4 },
  capitalValue: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 14 },
  deployButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deployButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  // Deploy modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textGray, marginBottom: 8 },
  readonlyField: { backgroundColor: COLORS.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  readonlyFieldText: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },

  dropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownValue: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  dropdownPlaceholder: { fontSize: 14, color: COLORS.textGray },
  dropdownMenu: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, marginTop: 6, overflow: 'hidden' },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownMenuItemText: { fontSize: 13, color: COLORS.textDark },

  deployConfirmButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deployConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
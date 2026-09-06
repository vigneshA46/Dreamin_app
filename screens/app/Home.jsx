import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

import TradesModal from './TradesModal';
import StrategyStatisticsModal from './StrategyStatisticsModal';
import StrategyCard from "../../components/StrategyCard";
import { apiRequest } from "../../services/api";
import { useMarketWebSocket } from "../../hooks/useMarketWebSocket";
import LiveStrategyStatisticsModal from './LiveStrategyStatisticsModal';

const BASE_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 60 : 54;

const COLORS = {
  navy: '#0F1B3D',
  navyCard: '#101B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  red: '#EF4444',
  purple: '#8B5CF6',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
  tokenBg: '#E9F0FF',
};

function formatINR(value) {
  const num = Number(value ?? 0);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  return `${sign}₹${abs.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;
  const liveData = useMarketWebSocket();

  // 'pt' = "Live Market" tab (all strategies, paper/backtest style)
  // 'deployed' = "Deployed" tab (today's active deployments)
  const [tab, setTab] = React.useState('pt');
  const [refreshing, setRefreshing] = React.useState(false);

  const [user, setUser] = React.useState({});
  const [notifications, setNotifications] = React.useState([]);
  const [strategies, setStrategies] = React.useState([]);
  const [overallPnl, setOverallPnl] = React.useState(0);
  const [todayDeployment, setTodayDeployment] = React.useState([]);

  const [expandedId, setExpandedId] = React.useState(null);
  const [dates, setDates] = React.useState({});
  const [dateWisePnL, setDateWisePnL] = React.useState({});
  const [selectedDate, setSelectedDate] = React.useState({});
  const [legs, setLegs] = React.useState({});
  const [legPnls, setLegPnls] = React.useState({});
  const [cumulativePnl, setCumulativePnl] = React.useState({});

  const [statsModalVisible, setStatsModalVisible] = React.useState(false);
  const [statistics, setStatistics] = React.useState({});

  const [selectedLeg, setSelectedLeg] = React.useState(null);
  const [tradesData, setTradesData] = React.useState([]);

    // Paper-trade stats ('pt' tab)
  const [paperStats, setPaperStats] = React.useState(null);
  const [paperStatsVisible, setPaperStatsVisible] = React.useState(false);

  // Live stats ('deployed' tab)
  const [liveStats, setLiveStats] = React.useState(null);
  const [liveStatsVisible, setLiveStatsVisible] = React.useState(false);

  const fetchPaperStatistics = React.useCallback(async (strategyId) => {
    try {
      const res = await apiRequest('GET', `/api/statistics?strategy_id=${strategyId}`);
      setPaperStats(res);
      setPaperStatsVisible(true);
    } catch (err) {
      console.log('paper statistics error', err);
    }
  }, []);

  const fetchLiveStatistics = React.useCallback(async (strategyId) => {
    try {
      const res = await apiRequest(
        'GET',
        `/api/realtradegroups/getstatistics?strategy_id=${strategyId}`
      );
      setLiveStats(res);
      setLiveStatsVisible(true);
    } catch (err) {
      console.log('live statistics error', err);
    }
  }, []);

  /* ---------- Fetchers ---------- */

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await apiRequest('GET', '/api/notifications');
      setNotifications(res?.data || []);
    } catch (err) {
      console.log('notifications error', err);
    }
  }, []);

  const fetchStrategies = React.useCallback(async (userId) => {
    try {
      const res = await apiRequest('GET', `/api/stratergy/user/${userId}`);
      const sorted = (res?.strategies || []).sort(
        (a, b) => Number(a.state_id) - Number(b.state_id)
      );
      setStrategies(sorted);
      setOverallPnl(res?.overall_pnl ?? 0);
    } catch (err) {
      console.log('strategies error', err);
    }
  }, []);

  const fetchUser = React.useCallback(async () => {
    try {
      const res = await apiRequest('POST', '/api/users/me');
      setUser(res || {});
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

  const refreshTodayDeployments = React.useCallback(async () => {
  try {
    const res = await apiRequest(
      'GET',
      '/api/deployments/user/today'
    );

    setTodayDeployment(res || []);
  } catch (err) {
    console.log('refresh deployments error', err);
  }
}, []);

const handleExitStrategy = React.useCallback(
  (deployment) => {
    if (!deployment?.id) {
      Alert.alert('Error', 'Deployment ID not found');
      return;
    }

    Alert.alert(
      'Exit Strategy',
      'Are you sure you want to exit this strategy?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(
                'POST',
                `/api/deployments/userdep/stopdep/${deployment.id}`
              );

              Alert.alert(
                'Success',
                'Strategy exited successfully'
              );

              await refreshTodayDeployments();
            } catch (err) {
              console.log('exit strategy error', err);

              Alert.alert(
                'Error',
                err?.message || 'Failed to exit strategy'
              );
            }
          },
        },
      ]
    );
  },
  [refreshTodayDeployments]
);

const handleDeleteStrategy = React.useCallback(
  (strategy, deployment) => {
    if (!strategy?.id) {
      Alert.alert('Error', 'Strategy ID not found');
      return;
    }

    if (!deployment?.broker_account_id) {
      Alert.alert(
        'Error',
        'Broker account ID not found'
      );
      return;
    }

    Alert.alert(
      'Delete Strategy',
      'Are you sure you want to delete this strategy?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(
                'POST',
                `/api/deployments/stopdeployment?strategy_id=${strategy.id}&broker_account_id=${deployment.broker_account_id}`
              );

              Alert.alert(
                'Deleted',
                'Strategy deleted successfully'
              );

              await refreshTodayDeployments();
            } catch (err) {
              console.log('delete strategy error', err);

              Alert.alert(
                'Error',
                err?.message || 'Failed to delete strategy'
              );
            }
          },
        },
      ]
    );
  },
  [refreshTodayDeployments]
  );

  const isStrategyRunning = React.useCallback(
  (strategy) => {
    if (!strategy?.starting_time || !strategy?.ending_time) {
      return false;
    }

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] =
      String(strategy.starting_time)
        .slice(0, 5)
        .split(':')
        .map(Number);

    const [endHour, endMinute] =
      String(strategy.ending_time)
        .slice(0, 5)
        .split(':')
        .map(Number);

    const startMinutes =
      startHour * 60 + startMinute;

    const endMinutes =
      endHour * 60 + endMinute;

    // Normal same-day strategy
    if (startMinutes <= endMinutes) {
      return (
        currentMinutes >= startMinutes &&
        currentMinutes <= endMinutes
      );
    }

    // Cross-midnight strategy
    return (
      currentMinutes >= startMinutes ||
      currentMinutes <= endMinutes
    );
  },
  []
  );

  const fetchDatesForStrategy = React.useCallback(async (strategyId) => {
    try {
      const res = await apiRequest('GET', `/api/tradelegs/dates/${strategyId}`);
      const data = res?.data || [];
      const formattedDates = data.map((d) => d.date);

      const pnlMap = {};
      data.forEach((d) => {
        pnlMap[d.date] = parseFloat(d.total_pnl || 0);
      });

      setDates((prev) => ({ ...prev, [strategyId]: formattedDates }));
      setDateWisePnL((prev) => ({ ...prev, [strategyId]: pnlMap }));

      if (data.length > 0) {
        const latestDate = data[0].date;
        setSelectedDate((prev) => ({ ...prev, [strategyId]: latestDate }));
        fetchLegsByDate(strategyId, latestDate);
      }
    } catch (err) {
      console.log('dates error', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLegsByDate = React.useCallback(async (strategyId, date) => {
    try {
      const res = await apiRequest(
        'POST',
        `/api/tradelegs/stratergy/detailled/?strategy_id=${strategyId}&date=${date}`
      );
      setLegs((prev) => ({ ...prev, [strategyId]: res.legs }));
      setLegPnls((prev) => ({ ...prev, [strategyId]: res.leg_pnls }));
      setCumulativePnl((prev) => ({ ...prev, [strategyId]: res.cumulative_pnl }));
    } catch (err) {
      console.log('legs error', err);
    }
  }, []);

  const fetchTradesByToken = React.useCallback(async (strategyId, date, token) => {
    try {
      const res = await apiRequest(
        'GET',
        `/api/paperlogger/event/by-token?date=${date}&token=${token}&strategy_id=${strategyId}`
      );
      // Map API fields -> shape TradesModal already expects
      const formatted = (res?.data || []).map((t) => ({
        side: t.leg_name,
        timestamp: new Date(t.timestamp).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
        }),
        eventType: t.event_type,
        symbol: t.symbol,
        qty: t.quantity,
        price: t.price,
        pnl: parseFloat(t.pnl || 0),
        cumPnl: parseFloat(t.cum_pnl || 0),
      }));
      setTradesData(formatted);
    } catch (err) {
      console.log('trades error', err);
    }
  }, []);

  const fetchStatistics = React.useCallback(async (strategyId) => {
    try {
      const res = await apiRequest('GET', `/api/statistics?strategy_id=${strategyId}`);
      setStatistics(res);
      setStatsModalVisible(true);
    } catch (err) {
      console.log('statistics error', err);
    }
  }, []);

  /* ---------- Initial load ---------- */

  const loadAll = React.useCallback(async () => {
    await Promise.all([fetchUser(), fetchNotifications(), fetchTodayDeployment()]);
  }, [fetchUser, fetchNotifications, fetchTodayDeployment]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  /* ---------- Derived data ---------- */

  const deploymentMap = React.useMemo(() => {
    const map = {};
    todayDeployment.forEach((d) => {
      if (!map[d.strategy_id]) map[d.strategy_id] = d;
      if (d.status === 'ACTIVE') map[d.strategy_id] = d;
    });
    return map;
  }, [todayDeployment]);

  const deployedStrategyIds = React.useMemo(
    () => new Set(todayDeployment.map((d) => d.strategy_id)),
    [todayDeployment]
  );

  const deployedStrategies = React.useMemo(
    () => strategies.filter((s) => deployedStrategyIds.has(s.id)),
    [strategies, deployedStrategyIds]
  );

    const totalPnl = React.useMemo(() => {
    let total = 0;
    Object.values(liveData).forEach((d) => {
      if (d?.pnl) total += Number(d.pnl);
    });
    return total;
  }, [liveData]);

  const displayOverallPnl = totalPnl ? totalPnl : Number(overallPnl);

  const visibleStrategies = tab === 'deployed' ? deployedStrategies : strategies;
  const activeStrategiesCount = deployedStrategies.filter(
    (s) => deploymentMap[s.id]?.status === 'ACTIVE'
  ).length;

  /* ---------- Handlers ---------- */

  const handleToggleExpand = (strategyId) => {
    if (expandedId === strategyId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(strategyId);
    if (!dates[strategyId]) {
      fetchDatesForStrategy(strategyId);
    }
  };

  const handleSelectLeg = (strategyId, leg) => {
    const date = selectedDate[strategyId];
    setSelectedLeg({ strategyId, leg, date });
    fetchTradesByToken(strategyId, date, leg.token);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Image
                source={require('../../assets/icon.png')}
                style={{
                  width: 25,
                  height: 25,
                  borderRadius: 6,
                  }}
                />
            </View>
            <Text style={styles.brandText}>
              Dreamin <Text style={styles.brandTextAccent}>Algo</Text>
            </Text>
          </View>

          <View style={styles.topBarRight}>
            <View style={styles.tokenPill}>
              <Feather name="award" size={12} color={COLORS.blue} />
              <Text style={styles.tokenPillText}>{user.tokens ?? 0} TOKENS</Text>
            </View>

            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={18} color={COLORS.textDark} />
              {notifications.length > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.fullname || 'U').charAt(0)}</Text>
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Welcome */}
        <Text style={styles.welcomeText}>Welcome back, {user.fullname || '—'}! 👋</Text>
        <Text style={styles.welcomeSubtext}>Track your algorithmic trading performance</Text>

        {/* Portfolio card */}
        <View style={styles.portfolioCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.portfolioLabel}>Overall P&L</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.portfolioDate}>
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.portfolioPnl,
              { color: Number(displayOverallPnl) >= 0 ? COLORS.green : COLORS.red },
            ]}
          >
            {formatINR(displayOverallPnl)}
          </Text>

          <View style={[styles.rowBetween, { marginTop: 6 }]}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* Stat grid */}

{/*         
        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active Strategies</Text>
            <Text style={[styles.statValue, { color: COLORS.blue }]}>
              {activeStrategiesCount}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overall P&L</Text>
            <Text
              style={[
                styles.statValue,
                { color: Number(displayOverallPnl) >= 0 ? COLORS.green : COLORS.red },
              ]}
            >
              {formatINR(displayOverallPnl)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Strategies</Text>
            <Text style={[styles.statValue, { color: COLORS.textDark }]}>
              {strategies.length}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tokens</Text>
            <Text style={[styles.statValue, { color: COLORS.purple }]}>
              {user.tokens ?? 0}
            </Text>
          </View>
        </View>
 */}

        {/* Strategy status */}
        <Text style={styles.sectionTitle}>Strategy Status</Text>

        <View style={styles.segmentControl}>
          <TouchableOpacity
            style={[styles.segmentButton, tab === 'pt' && styles.segmentButtonActive]}
            onPress={() => setTab('pt')}
          >
            <Text style={[styles.segmentText, tab === 'pt' && styles.segmentTextActive]}>
              Live Market
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, tab === 'deployed' && styles.segmentButtonActive]}
            onPress={() => setTab('deployed')}
          >
            <Text style={[styles.segmentText, tab === 'deployed' && styles.segmentTextActive]}>
              Deployed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Strategy list — this is the part that now actually changes per tab */}
        {visibleStrategies.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ color: COLORS.textGray }}>
              {tab === 'deployed' ? 'No strategies deployed today' : 'No strategies found'}
            </Text>
          </View>
        )}

        {visibleStrategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            mode={tab}
            expanded={expandedId === strategy.id}
            onToggleExpand={() => handleToggleExpand(strategy.id)}
            live={liveData[strategy.id]}
            deployment={deploymentMap[strategy.id]}

            /* Deployment actions */
            isDeployed={
              !!deploymentMap[strategy.id]
            }

            isRunning={isStrategyRunning(strategy)}

            onExitStrategy={() =>
              handleExitStrategy(
                deploymentMap[strategy.id]
                )
              }

            onDeleteStrategy={() =>
              handleDeleteStrategy(
              strategy,
              deploymentMap[strategy.id]
              )
              }

            dates={dates[strategy.id] || []}
            dateWisePnL={dateWisePnL[strategy.id] || {}}
            selectedDate={selectedDate[strategy.id]}

            onSelectDate={(date) => {
              setSelectedDate((prev) => ({
              ...prev,
              [strategy.id]: date,
              }));

              fetchLegsByDate(
              strategy.id,
              date
              );
              }}

              legs={legs[strategy.id] || []}
              legPnls={legPnls[strategy.id] || {}}
              cumulativePnl={cumulativePnl[strategy.id]}
                
              onSelectLeg={(leg) =>
                  handleSelectLeg(
                  strategy.id,
                  leg
                )
                }

            onViewStats={() =>
            tab === 'deployed'
              ? fetchLiveStatistics(strategy.id)
            : fetchPaperStatistics(strategy.id)
            }
            />
        ))}
      </ScrollView>

      <StrategyStatisticsModal
        visible={paperStatsVisible}
        onClose={() => setPaperStatsVisible(false)}
        statistics={paperStats}
      />

      <LiveStrategyStatisticsModal
        visible={liveStatsVisible}
        onClose={() => setLiveStatsVisible(false)}
        statistics={liveStats}
      />
      <TradesModal
        visible={!!selectedLeg}
        onClose={() => setSelectedLeg(null)}
        legLabel={selectedLeg ? `${selectedLeg.leg?.symbol} (${selectedLeg.leg?.leg})` : ''}
        trades={tradesData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
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
  topBarRight: { flexDirection: 'row', alignItems: 'center' },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.tokenBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 10,
  },
  tokenPillText: { fontSize: 11, fontWeight: '700', color: COLORS.blue, marginLeft: 4 },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.red,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  welcomeText: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  welcomeSubtext: { fontSize: 13, color: COLORS.textGray, marginBottom: 20 },
  portfolioCard: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  portfolioLabel: { fontSize: 13, color: '#B7BFD6', fontWeight: '600' },
  portfolioDate: { fontSize: 11, color: '#B7BFD6' },
  portfolioPnl: { fontSize: 32, fontWeight: '700', marginTop: 8 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 5 },
  livePillText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  statLabel: { fontSize: 12, color: COLORS.textGray, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginBottom: 12 },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  segmentButtonActive: { backgroundColor: COLORS.bg },
  segmentText: { fontSize: 13, fontWeight: '600', color: COLORS.textGray },
  segmentTextActive: { color: COLORS.textDark },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
 
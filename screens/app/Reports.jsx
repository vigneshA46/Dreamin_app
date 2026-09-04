import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
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

/* const RANGE_OPTIONS = [
  'All',
  'Today',
  'This Week',
  'This Month',
]; */

function formatINR(value) {
  const number = Number(value) || 0;
  const sign = number < 0 ? '-' : '+';

  return `${sign}₹${Math.abs(number).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date) {
  if (!date) return '-';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getRangeStart(range) {
  const now = new Date();

  if (range === 'Today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (range === 'This Week') {
    const start = new Date(now);
    const day = start.getDay();

    // Monday = start of week
    const difference = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - difference);
    start.setHours(0, 0, 0, 0);

    return start;
  }

  if (range === 'This Month') {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    start.setHours(0, 0, 0, 0);

    return start;
  }

  return null;
}

export default function Reports({ navigation }) {
  const insets = useSafeAreaInsets();

  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  const [range, setRange] = useState('All');

  const [strategies, setStrategies] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const [datewiseData, setDatewiseData] = useState([]);

  const [loadingDetails, setLoadingDetails] = useState(false);

  const [detailsVisible, setDetailsVisible] = useState(false);

  const [strategyFilterVisible, setStrategyFilterVisible] = useState(false);

  const [selectedStrategyFilter, setSelectedStrategyFilter] =
    useState('All Strategies');

  /*
  ============================================================
  FETCH USER STRATEGIES
  ============================================================
  */

  const fetchReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await apiRequest(
        'GET',
        '/api/reports/strategies'
      );

      if (res?.success) {
        setStrategies(res.strategies || []);
      } else {
        setStrategies([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);

      setStrategies([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /*
  ============================================================
  FETCH DATEWISE PNL
  ============================================================
  */

  const fetchDatewisePnl = async (strategyId) => {
    if (!strategyId) {
      setDatewiseData([]);
      return;
    }

    try {
      setLoadingDetails(true);

      const res = await apiRequest(
        'GET',
        `/api/reports/user/strategy/datewise-pnl/${strategyId}`
      );

      if (res?.success) {
        setDatewiseData(res.data || []);
      } else {
        setDatewiseData([]);
      }
    } catch (error) {
      console.error(
        'Error fetching datewise PNL:',
        error
      );

      setDatewiseData([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  /*
  ============================================================
  INITIAL LOAD
  ============================================================
  */

  useEffect(() => {
    fetchReports();
  }, []);

  /*
  ============================================================
  OPEN DETAILS
  ============================================================
  */

  const openDetails = async (strategy) => {
    setSelectedStrategy(strategy);
    setDatewiseData([]);
    setDetailsVisible(true);

    await fetchDatewisePnl(strategy.strategy_id);
  };

  /*
  ============================================================
  CLOSE DETAILS
  ============================================================
  */

  const closeDetails = () => {
    setDetailsVisible(false);
    setSelectedStrategy(null);
    setDatewiseData([]);
  };

  /*
  ============================================================
  FILTER STRATEGIES
  ============================================================
  */

  const filteredStrategies = useMemo(() => {
    let result = [...strategies];

    /*
      Strategy filter
    */

    if (selectedStrategyFilter !== 'All Strategies') {
      result = result.filter(
        (strategy) =>
          strategy.name === selectedStrategyFilter
      );
    }

    /*
      Date range filter

      The API shown in the web code returns overall_pnl
      without a date field, so range filtering cannot be
      correctly applied to the main strategy list.

      Therefore range buttons are currently UI-only.
      Datewise filtering is handled in the details view
      where trade_date is available.
    */

    return result;
  }, [
    strategies,
    selectedStrategyFilter,
  ]);

  /*
  ============================================================
  TOTAL PNL
  ============================================================
  */

  const totalPnl = useMemo(() => {
    return filteredStrategies.reduce((total, strategy) => {
      return (
        total +
        Number(strategy.overall_pnl || 0)
      );
    }, 0);
  }, [filteredStrategies]);

  /*
  ============================================================
  FILTER DATEWISE DATA
  ============================================================
  */

  const filteredDatewiseData = useMemo(() => {
    if (!datewiseData?.length) {
      return [];
    }

    const rangeStart = getRangeStart(range);

    if (!rangeStart) {
      return datewiseData;
    }

    return datewiseData.filter((row) => {
      if (!row.trade_date) {
        return true;
      }

      const date = new Date(row.trade_date);

      return date >= rangeStart;
    });
  }, [datewiseData, range]);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <StatusBar style="dark" />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation?.goBack?.()}
          hitSlop={8}
        >
          <Feather
            name="chevron-left"
            size={22}
            color={COLORS.textDark}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Reports
        </Text>

        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => fetchReports(true)}
          hitSlop={8}
        >
          <Feather
            name="refresh-cw"
            size={18}
            color={COLORS.textDark}
          />
        </TouchableOpacity>
      </View>

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

        {/* ====================================================
            RANGE
        ==================================================== */}
{/* 
        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => {
            const active = option === range;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.rangePill,
                  active &&
                    styles.rangePillActive,
                ]}
                onPress={() => setRange(option)}
              >
                <Text
                  style={[
                    styles.rangePillText,
                    active &&
                      styles.rangePillTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View> */}

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Total P&L
          </Text>

          <Text
            style={[
              styles.summaryPnl,
              {
                color:
                  totalPnl >= 0
                    ? COLORS.green
                    : COLORS.red,
              },
            ]}
          >
            {formatINR(totalPnl)}
          </Text>

          <View style={styles.summaryBottomRow}>
            <View>
              <Text style={styles.summaryStatLabel}>
                Strategies
              </Text>

              <Text style={styles.summaryStatValue}>
                {filteredStrategies.length}
              </Text>
            </View>

            <View style={styles.summaryRight}>
              <Text style={styles.summaryStatLabel}>
                Range
              </Text>

              <Text style={styles.summaryStatValue}>
                {range}
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            STRATEGY FILTER
        ==================================================== */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your Strategies
          </Text>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() =>
              setStrategyFilterVisible(true)
            }
          >
            <Feather
              name="filter"
              size={15}
              color={COLORS.blue}
            />

            <Text style={styles.filterButtonText}>
              Filter
            </Text>
          </TouchableOpacity>
        </View>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <View style={styles.centerLoader}>
            <ActivityIndicator
              size="large"
              color={COLORS.blue}
            />

            <Text style={styles.loadingText}>
              Loading reports...
            </Text>
          </View>
        )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          filteredStrategies.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Feather
                  name="bar-chart-2"
                  size={26}
                  color={COLORS.textGray}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No reports available
              </Text>

              <Text style={styles.emptyText}>
                Your strategy reports will appear
                here once data is available.
              </Text>
            </View>
          )}

        {/* ====================================================
            REPORT CARDS
        ==================================================== */}

        {!loading &&
          filteredStrategies.map(
            (strategy, index) => {
              const pnl = Number(
                strategy.overall_pnl || 0
              );

              const isProfit = pnl >= 0;

              return (
                <TouchableOpacity
                  key={
                    strategy.strategy_id ||
                    index
                  }
                  style={styles.reportCard}
                  activeOpacity={0.75}
                  onPress={() =>
                    openDetails(strategy)
                  }
                >
                  {/* Strategy + arrow */}

                  <View
                    style={styles.rowBetween}
                  >
                    <View
                      style={
                        styles.strategyTitleContainer
                      }
                    >
                      <Text
                        style={
                          styles.reportTitle
                        }
                        numberOfLines={2}
                      >
                        {strategy.name ||
                          'Unnamed Strategy'}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.detailsIcon
                      }
                    >
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={
                          COLORS.textGray
                        }
                      />
                    </View>
                  </View>

                  {/* PNL */}

                  <View
                    style={
                      styles.pnlContainer
                    }
                  >
                    <Text
                      style={
                        styles.pnlLabel
                      }
                    >
                      Overall P&L
                    </Text>

                    <Text
                      style={[
                        styles.reportPnl,
                        {
                          color: isProfit
                            ? COLORS.green
                            : COLORS.red,
                        },
                      ]}
                    >
                      {formatINR(pnl)}
                    </Text>
                  </View>

                  {/* Bottom */}

                  <View
                    style={
                      styles.cardBottomRow
                    }
                  >
                    <Text
                      style={
                        styles.reportSubStats
                      }
                    >
                      Tap to view date-wise P&L
                    </Text>

                    <View
                      style={[
                        styles.profitBadge,
                        {
                          backgroundColor:
                            isProfit
                              ? '#EAF9EF'
                              : '#FDECEC',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.profitBadgeText,
                          {
                            color: isProfit
                              ? COLORS.green
                              : COLORS.red,
                          },
                        ]}
                      >
                        {isProfit
                          ? 'Profit'
                          : 'Loss'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }
          )}

        {/* ====================================================
            REFRESHING
        ==================================================== */}

        {refreshing && (
          <View style={styles.refreshingContainer}>
            <ActivityIndicator
              size="small"
              color={COLORS.blue}
            />

            <Text
              style={
                styles.refreshingText
              }
            >
              Refreshing...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ======================================================
          STRATEGY FILTER MODAL
      ====================================================== */}

      <Modal
        visible={strategyFilterVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setStrategyFilterVisible(false)
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setStrategyFilterVisible(false)
          }
        >
          <Pressable
            style={styles.filterModal}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Select Strategy
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setStrategyFilterVisible(
                    false
                  )
                }
              >
                <Feather
                  name="x"
                  size={22}
                  color={
                    COLORS.textDark
                  }
                />
              </TouchableOpacity>
            </View>

            {/* All */}

            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => {
                setSelectedStrategyFilter(
                  'All Strategies'
                );

                setStrategyFilterVisible(
                  false
                );
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  selectedStrategyFilter ===
                    'All Strategies' &&
                    styles.filterOptionActive,
                ]}
              >
                All Strategies
              </Text>

              {selectedStrategyFilter ===
                'All Strategies' && (
                <Feather
                  name="check"
                  size={18}
                  color={COLORS.blue}
                />
              )}
            </TouchableOpacity>

            {/* Strategies */}

            {strategies.map(
              (strategy, index) => {
                const name =
                  strategy.name ||
                  `Strategy ${index + 1}`;

                const active =
                  selectedStrategyFilter ===
                  name;

                return (
                  <TouchableOpacity
                    key={
                      strategy.strategy_id ||
                      index
                    }
                    style={
                      styles.filterOption
                    }
                    onPress={() => {
                      setSelectedStrategyFilter(
                        name
                      );

                      setStrategyFilterVisible(
                        false
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        active &&
                          styles.filterOptionActive,
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>

                    {active && (
                      <Feather
                        name="check"
                        size={18}
                        color={
                          COLORS.blue
                        }
                      />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ======================================================
          DATEWISE DETAILS MODAL
      ====================================================== */}

      <Modal
        visible={detailsVisible}
        animationType="slide"
        transparent
        onRequestClose={closeDetails}
      >
        <View
          style={
            styles.detailsModalOverlay
          }
        >
          <View
            style={
              styles.detailsModal
            }
          >
            {/* Header */}

            <View
              style={
                styles.detailsHeader
              }
            >
              <View
                style={
                  styles.detailsHeaderText
                }
              >
                <Text
                  style={
                    styles.detailsTitle
                  }
                  numberOfLines={1}
                >
                  {selectedStrategy?.name ||
                    'Strategy Report'}
                </Text>

                <Text
                  style={
                    styles.detailsSubtitle
                  }
                >
                  Date-wise P&L
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.closeButton
                }
                onPress={closeDetails}
              >
                <Feather
                  name="x"
                  size={20}
                  color={
                    COLORS.textDark
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Range */}

            {/* <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.detailsRangeContainer
              }
            >
              {RANGE_OPTIONS.map(
                (option) => {
                  const active =
                    option === range;

                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.detailsRangePill,
                        active &&
                          styles.detailsRangePillActive,
                      ]}
                      onPress={() =>
                        setRange(
                          option
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.detailsRangeText,
                          active &&
                            styles.detailsRangeTextActive,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView> */}

            {/* Datewise data */}

            <ScrollView
              style={
                styles.detailsScroll
              }
              contentContainerStyle={
                styles.detailsScrollContent
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {loadingDetails ? (
                <View
                  style={
                    styles.detailsLoader
                  }
                >
                  <ActivityIndicator
                    size="large"
                    color={
                      COLORS.blue
                    }
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Loading P&L...
                  </Text>
                </View>
              ) : filteredDatewiseData.length ===
                0 ? (
                <View
                  style={
                    styles.noDetailsCard
                  }
                >
                  <Feather
                    name="calendar"
                    size={28}
                    color={
                      COLORS.textGray
                    }
                  />

                  <Text
                    style={
                      styles.noDetailsTitle
                    }
                  >
                    No data available
                  </Text>

                  <Text
                    style={
                      styles.noDetailsText
                    }
                  >
                    There is no P&L data for
                    the selected range.
                  </Text>
                </View>
              ) : (
                filteredDatewiseData.map(
                  (row, index) => {
                    const pnl = Number(
                      row.pnl || 0
                    );

                    const isProfit =
                      pnl >= 0;

                    return (
                      <View
                        key={
                          `${row.trade_date}-${index}`
                        }
                        style={
                          styles.dateRow
                        }
                      >
                        <View
                          style={
                            styles.dateRowLeft
                          }
                        >
                          <View
                            style={
                              styles.dateIcon
                            }
                          >
                            <Feather
                              name="calendar"
                              size={15}
                              color={
                                COLORS.blue
                              }
                            />
                          </View>

                          <View>
                            <Text
                              style={
                                styles.dateText
                              }
                            >
                              {formatDate(
                                row.trade_date
                              )}
                            </Text>

                            <Text
                              style={
                                styles.dateIndex
                              }
                            >
                              Day {index + 1}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.datePnl,
                            {
                              color:
                                isProfit
                                  ? COLORS.green
                                  : COLORS.red,
                            },
                          ]}
                        >
                          {formatINR(pnl)}
                        </Text>
                      </View>
                    );
                  }
                )
              )}
            </ScrollView>

            {/* Close */}

            <TouchableOpacity
              style={
                styles.closeDetailsButton
              }
              onPress={closeDetails}
            >
              <Text
                style={
                  styles.closeDetailsButtonText
                }
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /*
  ============================================================
  HEADER
  ============================================================
  */

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

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  /*
  ============================================================
  CONTENT
  ============================================================
  */

  scrollContent: {
    paddingHorizontal: 20,
  },

  /*
  ============================================================
  RANGE
  ============================================================
  */

  rangeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },

  rangePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },

  rangePillActive: {
    backgroundColor: COLORS.navy,
  },

  rangePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGray,
  },

  rangePillTextActive: {
    color: '#FFFFFF',
  },

  /*
  ============================================================
  SUMMARY
  ============================================================
  */

  summaryCard: {
    backgroundColor: COLORS.navyCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#B7BFD6',
    fontWeight: '600',
    marginBottom: 8,
  },

  summaryPnl: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 18,
  },

  summaryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryRight: {
    alignItems: 'flex-end',
  },

  summaryStatLabel: {
    fontSize: 11,
    color: '#B7BFD6',
    marginBottom: 4,
  },

  summaryStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /*
  ============================================================
  SECTION HEADER
  ============================================================
  */

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#EAF0FF',
    borderRadius: 10,
  },

  filterButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.blue,
  },

  /*
  ============================================================
  REPORT CARD
  ============================================================
  */

  reportCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  strategyTitleContainer: {
    flex: 1,
    marginRight: 10,
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    lineHeight: 20,
  },

  detailsIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pnlContainer: {
    marginTop: 14,
  },

  pnlLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 3,
    fontWeight: '600',
  },

  reportPnl: {
    fontSize: 20,
    fontWeight: '700',
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  reportSubStats: {
    fontSize: 10,
    color: COLORS.textGray,
  },

  profitBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },

  profitBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /*
  ============================================================
  LOADING / EMPTY
  ============================================================
  */

  centerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.textGray,
  },

  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 11,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 17,
  },

  refreshingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 8,
  },

  refreshingText: {
    fontSize: 11,
    color: COLORS.textGray,
  },

  /*
  ============================================================
  FILTER MODAL
  ============================================================
  */

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  filterModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '75%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  filterOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginRight: 10,
  },

  filterOptionActive: {
    color: COLORS.blue,
  },

  /*
  ============================================================
  DETAILS MODAL
  ============================================================
  */

  detailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  detailsModal: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    height: '88%',
    overflow: 'hidden',
  },

  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  detailsHeaderText: {
    flex: 1,
    marginRight: 10,
  },

  detailsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  detailsSubtitle: {
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailsRangeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },

  detailsRangePill: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailsRangePillActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },

  detailsRangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textGray,
  },

  detailsRangeTextActive: {
    color: '#FFFFFF',
  },

  detailsScroll: {
    flex: 1,
  },

  detailsScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  detailsLoader: {
    alignItems: 'center',
    paddingTop: 50,
  },

  noDetailsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    padding: 35,
    marginTop: 10,
  },

  noDetailsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 10,
  },

  noDetailsText: {
    fontSize: 11,
    color: COLORS.textGray,
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 17,
  },

  dateRow: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  dateIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EAF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  dateIndex: {
    fontSize: 10,
    color: COLORS.textGray,
    marginTop: 2,
  },

  datePnl: {
    fontSize: 14,
    fontWeight: '700',
  },

  closeDetailsButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
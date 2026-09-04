import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

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

function formatINR(value) {
  const num = Number(value ?? 0);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  return `${sign}₹${abs.toLocaleString('en-IN', {
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

// 'YYYY-MM-DD' -> 'DD-MM-YYYY'
function toDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function StrategyCard({
  strategy,
  mode, // 'pt' (Live Market / paper) | 'deployed'
  expanded,
  onToggleExpand,
  live, // liveData[strategy.id] from websocket, may be undefined
  dates = [], // dates[strategy.id]
  dateWisePnL = {}, // dateWisePnL[strategy.id]
  selectedDate, // selectedDate[strategy.id]
  onSelectDate, // (date) => void
  legs = [], // legs[strategy.id]
  legPnls = {}, // legPnls[strategy.id] keyed by token
  cumulativePnl, // cumulativePnl[strategy.id] — set only after expansion fetch
  onSelectLeg, // (leg) => void, opens TradesModal
  onViewStats, // () => void
}) {
  const [dateMenuOpen, setDateMenuOpen] = React.useState(false);

  // Same fallback chain as web StrategyRow.jsx / LiveStrategyRow.jsx:
  // live socket value (if strategy is running) > expanded-view cumulative pnl > default from strategy list payload
  const displayPnl = Number(live?.pnl ?? cumulativePnl ?? strategy.latest_cum_pnl ?? 0);
  const status = live?.status || 'CLOSED';
  const isToday = selectedDate === todayStr();

  return (
    <View style={styles.strategyCard}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.strategyName}>
            {strategy.name} - {strategy.state_id}
          </Text>
        </View>

        <View style={styles.rowStart}>
          <Text
            style={[
              styles.strategyStatus,
              { color: status === 'CLOSED' ? COLORS.textGray : COLORS.green },
            ]}
          >
            {status}
          </Text>

          <TouchableOpacity
            style={styles.chevronButton}
            onPress={onToggleExpand}
            hitSlop={8}
          >
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.blue}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.rowBetween, { marginTop: 14, alignItems: 'flex-end' }]}>
        <View>
          <Text
            style={[
              styles.strategyPnl,
              { color: displayPnl >= 0 ? COLORS.green : COLORS.red },
            ]}
          >
            {displayPnl >= 0 ? '+' : ''}
            {formatINR(displayPnl)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewStatsButton}
          activeOpacity={0.85}
          onPress={onViewStats}
        >
          <Text style={styles.viewStatsText}>View Stats</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />

          <Text style={styles.dateLabel}>Select Date</Text>

          <TouchableOpacity
            style={styles.dateDropdown}
            onPress={() => setDateMenuOpen((v) => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.dateDropdownText}>
              {selectedDate ? toDisplayDate(selectedDate) : 'Pick a date'}{' '}
              {selectedDate ? (
                <Text style={{ color: COLORS.green }}>
                  ({formatINR(dateWisePnL[selectedDate] ?? 0)})
                </Text>
              ) : null}
            </Text>
            <Feather
              name={dateMenuOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textGray}
            />
          </TouchableOpacity>

          {dateMenuOpen && (
            <View style={styles.dateMenu}>
              {dates.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.dateMenuItem}
                  onPress={() => {
                    onSelectDate(d);
                    setDateMenuOpen(false);
                  }}
                >
                  <Text style={styles.dateMenuItemText}>{toDisplayDate(d)}</Text>
                  <Text style={{ color: COLORS.green, fontSize: 12, fontWeight: '600' }}>
                    {formatINR(dateWisePnL[d] ?? 0)}
                  </Text>
                </TouchableOpacity>
              ))}
              {dates.length === 0 && (
                <Text style={{ padding: 12, color: COLORS.textGray, fontSize: 12 }}>
                  No dates available
                </Text>
              )}
            </View>
          )}

          <View style={styles.legsTable}>
            <View style={styles.legsHeaderRow}>
              <Text style={[styles.legsHeaderCell, { width: 24 }]}>#</Text>
              <Text style={[styles.legsHeaderCell, { flex: 1 }]}>Symbol</Text>
              <Text style={[styles.legsHeaderCell, styles.legsCellRight]}>LTP ₹</Text>
              <Text style={[styles.legsHeaderCell, styles.legsCellRight]}>P&L ₹</Text>
            </View>

            {legs.length > 0 ? (
              legs.map((leg, index) => {
                const legLive = mode === 'deployed' && isToday ? live : null;
                const ltp =
                  legLive != null
                    ? leg.leg === 'CE'
                      ? legLive.ce_ltp
                      : legLive.pe_ltp
                    : null;
                const legPnl =
                  legLive != null
                    ? leg.leg === 'CE'
                      ? legLive.ce_pnl
                      : legLive.pe_pnl
                    : legPnls?.[leg.token]?.pnl;

                return (
                  <TouchableOpacity
                    key={leg.token || leg.leg || index}
                    style={styles.legsRow}
                    activeOpacity={0.6}
                    onPress={() => onSelectLeg(leg)}
                  >
                    <Text style={[styles.legsCell, { width: 24, color: COLORS.textGray }]}>
                      {index + 1}
                    </Text>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.legSymbol}>{leg.symbol}</Text>
                      <Text style={styles.legType}>{leg.leg}</Text>
                    </View>

                    <Text style={[styles.legsCell, styles.legsCellRight]}>
                      {ltp != null ? ltp : '-'}
                    </Text>

                    <Text
                      style={[
                        styles.legsCell,
                        styles.legsCellRight,
                        {
                          color: (legPnl ?? 0) >= 0 ? COLORS.green : COLORS.red,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {legPnl != null ? Number(legPnl).toFixed(2) : '-'}
                    </Text>

                    <Feather
                      name="chevron-right"
                      size={14}
                      color={COLORS.textGray}
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ padding: 16, textAlign: 'center', color: COLORS.textGray }}>
                No legs found
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowStart: { flexDirection: 'row', alignItems: 'center' },
  strategyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  strategyName: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  strategyStatus: { fontSize: 11, fontWeight: '700', marginRight: 6 },
  chevronButton: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyPnl: { fontSize: 17, fontWeight: '700' },
  viewStatsButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  viewStatsText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  expandedSection: { marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  dateLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
  },
  dateDropdownText: { fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  dateMenu: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginTop: 6,
    overflow: 'hidden',
  },
  dateMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateMenuItemText: { fontSize: 13, color: COLORS.textDark },
  legsTable: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  legsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  legsHeaderCell: { fontSize: 11, fontWeight: '700', color: COLORS.textGray },
  legsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legsCell: { fontSize: 12, color: COLORS.textDark },
  legsCellRight: { width: 64, textAlign: 'right' },
  legSymbol: { fontSize: 12, fontWeight: '700', color: COLORS.blue },
  legType: { fontSize: 10, color: COLORS.textGray, marginTop: 1 },
});
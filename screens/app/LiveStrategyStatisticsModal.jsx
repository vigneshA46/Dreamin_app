import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  return `${sign}₹${Math.abs(num).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function LiveStrategyStatisticsModal({ visible, onClose, statistics }) {
  if (!statistics) return null;

  const daily = statistics?.daily || [];
  const strategy = statistics?.strategy || {};
  const capital = parseFloat(strategy.capital_required || 0);
  const datewisePnl = statistics?.datewise_pnl || [];

  const dayPnls = daily.length ? daily.map((d) => parseFloat(d.day_pnl)) : [0];
  const totalDays = dayPnls.length;
  const maxProfit = Math.max(...dayPnls);
  const maxLoss = Math.min(...dayPnls);
  const winDays = dayPnls.filter((p) => p > 0).length;
  const lossDays = dayPnls.filter((p) => p < 0).length;

  const totalPnl = parseFloat(statistics.summary?.total_pnl || 0);
  const totalTrades = parseInt(statistics.summary?.total_trades || 0, 10);

  const profits = dayPnls.filter((p) => p > 0);
  const losses = dayPnls.filter((p) => p < 0);
  const avgDaily = totalDays ? totalPnl / totalDays : 0;
  const avgProfitDays = profits.length ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
  const avgLossDays = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  const monthly = statistics?.monthly || [];
  const avgMonthly = monthly.length
    ? monthly.reduce((a, m) => a + parseFloat(m.monthly_return), 0) / monthly.length
    : 0;

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let winStreak = 0;
  let lossStreak = 0;
  dayPnls.forEach((p) => {
    if (p > 0) {
      winStreak++;
      lossStreak = 0;
    } else if (p < 0) {
      lossStreak++;
      winStreak = 0;
    } else {
      winStreak = 0;
      lossStreak = 0;
    }
    if (winStreak > maxWinStreak) maxWinStreak = winStreak;
    if (lossStreak > maxLossStreak) maxLossStreak = lossStreak;
  });

  // No Win Rate row here — LiveStrategyStatistics.jsx never computes it
  const detailedStats = [
    { label: 'Total Win Days', value: `${winDays}` },
    { label: 'Total Loss Days', value: `${lossDays}` },
    { label: 'Max Winning Streak', value: `${maxWinStreak}` },
    { label: 'Max Losing Streak', value: `${maxLossStreak}` },
    { label: 'Avg Monthly Profit', value: formatINR(avgMonthly), color: avgMonthly >= 0 ? COLORS.green : COLORS.red },
    { label: 'Total Profit', value: formatINR(totalPnl), color: totalPnl >= 0 ? COLORS.green : COLORS.red },
    { label: 'Max Profit (Day)', value: formatINR(maxProfit), color: COLORS.green },
    { label: 'Max Loss (Day)', value: formatINR(maxLoss), color: COLORS.red },
    { label: 'Avg Daily PnL', value: formatINR(avgDaily), color: avgDaily >= 0 ? COLORS.green : COLORS.red },
    { label: 'Avg Profit (Winning Days)', value: formatINR(avgProfitDays), color: COLORS.green },
    { label: 'Avg Loss (Losing Days)', value: formatINR(avgLossDays), color: COLORS.red },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Strategy Statistics</Text>
            <View style={styles.rowStart}>
              <TouchableOpacity style={styles.downloadButton} activeOpacity={0.85}>
                <Feather name="download" size={16} color={COLORS.blue} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeButton}>
                <Feather name="x" size={20} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Strategy Overview</Text>
            <View style={styles.sectionCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Strategy Name</Text>
                <Text style={styles.detailValueWrap} numberOfLines={2}>{strategy.name || '-'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Capital Required</Text>
                <Text style={styles.detailValue}>{formatINR(capital)}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>Total Trading Days</Text>
                <Text style={styles.detailValue}>{totalDays}</Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Total PnL</Text>
                <Text style={[styles.summaryCardValue, { color: totalPnl >= 0 ? COLORS.green : COLORS.red }]}>
                  {formatINR(totalPnl)}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Total Trading Days</Text>
                <Text style={styles.summaryCardValue}>{totalTrades}</Text>
              </View>
            </View>

            <View style={styles.cardRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Max Profit (Day)</Text>
                <Text style={[styles.summaryCardValue, { color: COLORS.green }]}>{formatINR(maxProfit)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>Max Loss (Day)</Text>
                <Text style={[styles.summaryCardValue, { color: COLORS.red }]}>{formatINR(maxLoss)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Date Wise P&L</Text>
            <View style={[styles.sectionCard, { marginBottom: 8 }]}>
              {datewisePnl.length > 0 ? (
                datewisePnl.map((item, index) => {
                  const pnl = Number(item.cum_pnl);
                  const dt = new Date(item.trade_date);
                  const dateLabel = dt.toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <View
                      key={index}
                      style={[styles.detailRow, index === datewisePnl.length - 1 && { borderBottomWidth: 0 }]}
                    >
                      <Text style={styles.detailLabel}>{dateLabel}</Text>
                      <View style={[styles.pnlBadge, { backgroundColor: pnl >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
                        <Text style={{ color: pnl >= 0 ? COLORS.green : COLORS.red, fontWeight: '700', fontSize: 12 }}>
                          {formatINR(pnl)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={{ padding: 16, textAlign: 'center', color: COLORS.textGray }}>
                  No date-wise data found
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Detailed Stats</Text>
            <View style={[styles.sectionCard, { marginBottom: 8 }]}>
              {detailedStats.map((s, index) => (
                <View
                  key={s.label}
                  style={[styles.detailRow, index === detailedStats.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.detailLabel}>{s.label}</Text>
                  <Text style={[styles.detailValue, s.color && { color: s.color }]}>{s.value}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', paddingTop: 44 },
  sheet: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  rowStart: { flexDirection: 'row', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  downloadButton: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#E9F0FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20 },
  cardRow: { flexDirection: 'row', marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 14, marginRight: 10,
  },
  summaryCardLabel: { fontSize: 11, color: COLORS.textGray, marginBottom: 6 },
  summaryCardValue: { fontSize: 17, fontWeight: '700', color: COLORS.textDark },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textDark, marginTop: 12, marginBottom: 10 },
  sectionCard: {
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  detailLabel: { fontSize: 12, color: COLORS.textGray, flexShrink: 1, marginRight: 10 },
  detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  detailValueWrap: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, flex: 1, textAlign: 'right' },
  pnlBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
});
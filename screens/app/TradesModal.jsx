import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, Pressable } from 'react-native';
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
  overlay: 'rgba(15,27,42,0.5)',
};

function formatSigned(value) {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Full-screen modal listing individual ENTRY/EXIT fills for a single leg,
 * mirroring the "Trades - CE" table from the web dashboard, adapted into
 * a scrollable card list for mobile rather than a wide table.
 *
 * `trades` shape: [{ side, timestamp, eventType: 'ENTRY' | 'EXIT', symbol, qty, price, pnl, cumPnl }]
 */
export default function TradesModal({ visible, onClose, legLabel, trades = [] }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Trades</Text>
            <Text style={styles.headerSubtitle}>{legLabel}</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeButton}>
            <Feather name="x" size={20} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={trades}
          keyExtractor={(item, index) => `${item.timestamp}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => (
            <View style={styles.tradeRow}>
              <View style={styles.tradeRowTop}>
                <View style={styles.rowStart}>
                  <Text style={styles.tradeIndex}>#{index + 1}</Text>
                  <View
                    style={[
                      styles.eventBadge,
                      item.eventType === 'ENTRY'
                        ? styles.eventBadgeEntry
                        : styles.eventBadgeExit,
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventBadgeText,
                        {
                          color:
                            item.eventType === 'ENTRY' ? COLORS.blue : COLORS.navy,
                        },
                      ]}
                    >
                      {item.eventType}
                    </Text>
                  </View>
                </View>

                <Text style={styles.tradeTimestamp}>{item.timestamp}</Text>
              </View>

              <View style={[styles.tradeRowBottom, { marginTop: 10 }]}>
                <View>
                  <Text style={styles.tradeMetaLabel}>Symbol</Text>
                  <Text style={styles.tradeMetaValue}>{item.symbol}</Text>
                </View>
                <View>
                  <Text style={styles.tradeMetaLabel}>Qty</Text>
                  <Text style={styles.tradeMetaValue}>{item.qty}</Text>
                </View>
                <View>
                  <Text style={styles.tradeMetaLabel}>Price</Text>
                  <Text style={styles.tradeMetaValue}>{item.price}</Text>
                </View>
              </View>

              <View style={[styles.tradeRowBottom, { marginTop: 10 }]}>
                <View>
                  <Text style={styles.tradeMetaLabel}>PnL</Text>
                  <Text
                    style={[
                      styles.tradePnl,
                      { color: item.pnl >= 0 ? COLORS.green : COLORS.red },
                    ]}
                  >
                    {formatSigned(item.pnl)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tradeMetaLabel}>Cum PnL</Text>
                  <Text
                    style={[
                      styles.tradePnl,
                      { color: item.cumPnl >= 0 ? COLORS.green : COLORS.red },
                    ]}
                  >
                    {formatSigned(item.cumPnl)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No trades recorded for this leg yet.</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
  },
  tradeRow: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
  },
  tradeRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tradeIndex: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textGray,
    marginRight: 8,
  },
  eventBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventBadgeEntry: {
    backgroundColor: '#E9F0FF',
  },
  eventBadgeExit: {
    backgroundColor: '#F1F2F6',
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tradeTimestamp: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  tradeRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeMetaLabel: {
    fontSize: 10,
    color: COLORS.textGray,
    marginBottom: 2,
  },
  tradeMetaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  tradePnl: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textGray,
    fontSize: 13,
    marginTop: 40,
  },
});
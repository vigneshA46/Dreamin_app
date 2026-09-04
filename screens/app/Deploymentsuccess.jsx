import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  greenBg: '#DCFCE7',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#FFFFFF',
  border: '#ECEEF3',
  goToDashboardText: '#E0673C',
};

/**
 * Presentational success screen shown after a strategy is deployed.
 *
 * Usage as a route (if wired into a Stack.Navigator):
 *   navigation.navigate('DeploymentSuccess', { deployment, onDone })
 *   -> read `route.params.deployment` instead of a `deployment` prop.
 *
 * Usage as an inline conditional render (current integration in Strategies.jsx):
 *   <DeploymentSuccess deployment={...} onViewDeployment={...} onGoToDashboard={...} />
 */
export default function DeploymentSuccess({
  deployment,
  onViewDeployment,
  onGoToDashboard,
}) {
  if (!deployment) return null;

  const {
    strategyName,
    broker,
    exchange,
    capital,
    lots,
    status = 'ACTIVE',
  } = deployment;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Feather name="check" size={36} color={COLORS.green} />
        </View>

        <Text style={styles.title}>Strategy Deployed!</Text>
        <Text style={styles.subtitle}>
          Your strategy is now ready to trade. It will automatically execute
          trades during market hours.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Strategy</Text>
            <Text
              style={[styles.detailValue, { color: COLORS.textDark }]}
              numberOfLines={1}
            >
              {strategyName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Broker</Text>
            <Text style={[styles.detailValue, { color: COLORS.blue }]}>{broker}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Exchange</Text>
            <Text style={[styles.detailValue, { color: COLORS.textDark }]}>
              {exchange}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Capital</Text>
            <Text style={[styles.detailValue, { color: COLORS.blue }]}>{capital}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Lots</Text>
            <Text style={[styles.detailValue, { color: COLORS.red }]}>{lots}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: COLORS.green }]}>{status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewDeploymentButton}
          activeOpacity={0.85}
          onPress={onViewDeployment}
        >
          <Text style={styles.viewDeploymentText}>View Deployment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashboardButton}
          activeOpacity={0.85}
          onPress={onGoToDashboard}
        >
          <Text style={styles.dashboardText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textGray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  detailsCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  viewDeploymentButton: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewDeploymentText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dashboardButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.goToDashboardText,
  },
});
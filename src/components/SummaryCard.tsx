import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrencyShort, formatGrowth } from '../utils/helpers';
import { COLORS } from '../theme';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  growth?: number;
  currencySymbol?: string;
  subtitle?: string;
}

export default function SummaryCard({
  title,
  amount,
  icon,
  color,
  growth,
  currencySymbol = 'Rp',
  subtitle,
}: SummaryCardProps) {
  const hasGrowth = growth !== undefined;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.iconBg, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        {hasGrowth && (
          <View style={[styles.growthBadge, { backgroundColor: growth >= 0 ? COLORS.successLight : COLORS.errorLight }]}>
            <Ionicons
              name={growth >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={growth >= 0 ? COLORS.success : COLORS.error}
            />
            <Text style={[styles.growthText, { color: growth >= 0 ? COLORS.success : COLORS.error }]}>
              {formatGrowth(growth)}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.amount}>{formatCurrencyShort(amount, currencySymbol)}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    gap: 2,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  title: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
});

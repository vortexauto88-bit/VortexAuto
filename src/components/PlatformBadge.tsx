import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Platform } from '../types';
import { COLORS } from '../theme';

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bgColor: string }> = {
  shopee: { label: 'Shopee', color: COLORS.shopee, bgColor: COLORS.shopeeLight },
  tiktok: { label: 'TikTok', color: '#FFFFFF', bgColor: COLORS.tiktok },
  offline: { label: 'Offline', color: COLORS.offline, bgColor: COLORS.offlineLight },
};

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md';
}

export default function PlatformBadge({ platform, size = 'sm' }: PlatformBadgeProps) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, size === 'md' && styles.badgeMd]}>
      <Text style={[styles.label, { color: config.color }, size === 'md' && styles.labelMd]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelMd: {
    fontSize: 13,
  },
});

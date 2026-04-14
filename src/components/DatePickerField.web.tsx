/**
 * Web DatePickerField — uses native HTML <input type="date">.
 * Metro bundler picks this file automatically on web platform.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { COLORS, SPACING } from '../theme';

interface Props {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
}

export default function DatePickerField({ label, value, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Parse as local date to avoid timezone offset issues
      const [y, m, d] = e.target.value.split('-').map(Number);
      onChange(new Date(y, m - 1, d));
    }
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <input
        type="date"
        value={format(value, 'yyyy-MM-dd')}
        onChange={handleChange}
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: '10px 14px',
          fontSize: 14,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.white,
          width: '100%',
          boxSizing: 'border-box',
          outline: 'none',
          fontFamily: 'inherit',
        } as React.CSSProperties}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
});

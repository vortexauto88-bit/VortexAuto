/**
 * Native DatePickerField — uses @react-native-community/datetimepicker.
 * On web, Metro automatically picks DatePickerField.web.tsx instead.
 */
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { COLORS, SPACING } from '../theme';

interface Props {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
}

export default function DatePickerField({ label, value, onChange }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.btn} onPress={() => setShow(true)}>
        <Text style={styles.btnText}>{format(value, 'd MMM yyyy', { locale: idLocale })}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={(_, date) => {
            setShow(Platform.OS === 'ios');
            if (date) onChange(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  btn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  btnText: { fontSize: 14, color: COLORS.textPrimary },
});

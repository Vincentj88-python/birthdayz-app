import { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { Label } from './Text';
import { colors, fonts, fontSize, borderRadius, spacing, minTapTarget } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Label style={styles.label}>{label}</Label>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.focused,
          error ? styles.errorBorder : undefined,
          style,
        ]}
        placeholderTextColor={colors.text.muted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && <Label style={styles.error}>{error}</Label>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: fonts.body.medium,
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: minTapTarget,
  },
  focused: {
    borderColor: colors.accent.red,
    borderWidth: 2,
  },
  errorBorder: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    marginTop: spacing.xs,
  },
});

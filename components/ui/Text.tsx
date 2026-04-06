import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors, fonts, fontSize as fontSizes } from '@/constants/theme';

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
}

export function Heading({ style, ...props }: CustomTextProps) {
  return <RNText style={[styles.heading, style]} {...props} />;
}

export function Body({ style, ...props }: CustomTextProps) {
  return <RNText style={[styles.body, style]} {...props} />;
}

export function Muted({ style, ...props }: CustomTextProps) {
  return <RNText style={[styles.muted, style]} {...props} />;
}

export function Label({ style, ...props }: CustomTextProps) {
  return <RNText style={[styles.label, style]} {...props} />;
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.heading.bold,
    fontSize: fontSizes.xxl,
    color: colors.text.primary,
  },
  body: {
    fontFamily: fonts.body.medium,
    fontSize: fontSizes.md,
    color: colors.text.primary,
    lineHeight: 24,
  },
  muted: {
    fontFamily: fonts.body.medium,
    fontSize: fontSizes.sm,
    color: colors.text.muted,
  },
  label: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
  },
});

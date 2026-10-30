import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'heading'
    | 'subtitle'
    | 'label'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

// Updated by AI.
export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'heading' && styles.heading,
        type === 'subtitle' && styles.subtitle,
        type === 'label' && styles.label,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'caption' && styles.caption,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

// Updated by AI.
const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 400,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 800,
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: 700,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 400,
  },
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
  },
  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: 400,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  linkPrimary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 600,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});

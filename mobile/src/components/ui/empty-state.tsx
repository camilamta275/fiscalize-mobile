import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Icons, type IconName } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  description?: string;
  icon?: IconName;
  title: string;
};

// Created by AI.
export function EmptyState({ description, icon = Icons.document, title }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
        <Icon color={theme.primary} name={icon} size={26} />
      </View>
      <ThemedText style={styles.centered} type="subtitle">
        {title}
      </ThemedText>
      {description ? (
        <ThemedText style={styles.centered} themeColor="mutedForeground" type="small">
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.pill,
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.one,
    width: 56,
  },
  centered: {
    textAlign: 'center',
  },
});

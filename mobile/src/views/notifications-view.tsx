import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Icons } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  listNotifications,
  markNotificationRead,
  type AppNotification,
} from '@/services/notification-service';

export function NotificationsView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const next = await listNotifications();
      setItems(next);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async (item: AppNotification) => {
    if (item.lida) return;
    await markNotificationRead(item.id);
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, lida: true } : entry
      )
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}> 
      <ScreenHeader onBack={() => router.back()} title="Notificações" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <ThemedText themeColor="mutedForeground" type="small">
            Carregando notificações...
          </ThemedText>
        ) : items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="subtitle">Nenhuma notificação</ThemedText>
            <ThemedText themeColor="mutedForeground" type="caption">
              Quando houver atualizações de status, elas aparecerão aqui.
            </ThemedText>
          </Card>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              onPress={() => void handlePress(item)}
              style={[styles.item, !item.lida && { borderColor: theme.primary, borderWidth: 1 }]}
              padded={false}>
              <View style={styles.itemHeader}>
                <View style={[styles.dot, { backgroundColor: item.lida ? theme.border : theme.primary }]} />
                <ThemedText type="smallBold">{item.titulo}</ThemedText>
              </View>
              <ThemedText style={styles.message} themeColor="mutedForeground" type="caption">
                {item.mensagem}
              </ThemedText>
              <ThemedText style={styles.meta} themeColor="mutedForeground" type="caption">
                {new Date(item.criadoem).toLocaleString('pt-BR')}
              </ThemedText>
              {!item.lida ? (
                <View style={styles.unreadRow}>
                  <Icon color={theme.primary} name={Icons.bell} size={14} />
                  <ThemedText themeColor="primary" type="caption">
                    Nova
                  </ThemedText>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: Spacing.two, padding: Spacing.three },
  emptyCard: { alignItems: 'flex-start', gap: Spacing.one },
  item: {
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  dot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  message: { marginBottom: Spacing.one },
  meta: { marginTop: Spacing.one },
  unreadRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
});

import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InlineMessage } from '@/components/ui/inline-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Icons } from '@/constants/icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getNotificationPreferences,
  registerPushToken,
  triggerNotificationTest,
  updateNotificationPreferences,
  type NotificationTestType,
} from '@/services/notification-service';

// Created by AI.
// Updated by AI.
export function NotificationSettingsView() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTest, setActiveTest] = useState<NotificationTestType | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'danger' | 'success' | 'warning'>('danger');

  // Created by AI.
  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const preferences = await getNotificationPreferences();
      setEnabled(preferences.enabled);
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : 'Não foi possível carregar as configurações.');
      setFeedbackTone('danger');
    } finally {
      setLoading(false);
    }
  }, []);

  // Created by AI.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPreferences();
  }, [loadPreferences]);

  // Created by AI.
  const changePreference = async (nextEnabled: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      const preferences = await updateNotificationPreferences(nextEnabled);
      setEnabled(preferences.enabled);
      if (preferences.enabled) {
        const registered = await registerPushToken(true);
        if (!registered) {
          setFeedback('A preferência foi ativada, mas este aparelho não está autorizado a receber push.');
          setFeedbackTone('warning');
          return;
        }
      }
      setFeedback(
        preferences.enabled
          ? 'Notificações ativadas para sua conta.'
          : 'Notificações desativadas em todos os aparelhos da sua conta.'
      );
      setFeedbackTone('success');
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : 'Não foi possível salvar a preferência.');
      setFeedbackTone('danger');
    } finally {
      setSaving(false);
    }
  };

  // Created by AI.
  // Updated by AI.
  const runTest = async (type: NotificationTestType) => {
    setActiveTest(type);
    setFeedback(null);
    try {
      const result = await triggerNotificationTest(type);
      if (result === 'permission_denied') {
        setFeedback('As notificações estão bloqueadas neste aparelho.');
        setFeedbackTone('warning');
        Alert.alert(
          'Notificações desativadas',
          'Ative as notificações do Fiscalize nas configurações do Android para executar os testes.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Abrir configurações', onPress: openSystemSettings },
          ]
        );
        return;
      }

      setFeedback('Notificação de teste enviada para este aparelho.');
      setFeedbackTone('success');
    } catch (caught) {
      setFeedback(caught instanceof Error ? caught.message : 'Não foi possível enviar o teste.');
      setFeedbackTone('danger');
    } finally {
      setActiveTest(null);
    }
  };

  // Created by AI.
  const openSystemSettings = () => {
    void Linking.openSettings().catch((caught: unknown) => {
      setFeedback(caught instanceof Error ? caught.message : 'Não foi possível abrir as configurações.');
      setFeedbackTone('danger');
    });
  };

  // Created by AI.
  const runDemandCreatedTest = () => void runTest('demand_created');

  // Created by AI.
  const runStatusUpdatedTest = () => void runTest('status_updated');

  // Created by AI.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader onBack={goBack} title="Notificações" />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>
        {feedback ? <InlineMessage message={feedback} tone={feedbackTone} /> : null}

        <Card style={styles.card}>
          <View style={styles.preferenceRow}>
            <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
              <Icon color={theme.primary} name={Icons.bell} size={19} />
            </View>
            <View style={styles.copy}>
              <ThemedText type="smallBold">Receber notificações</ThemedText>
              <ThemedText themeColor="mutedForeground" type="caption">
                Ao desativar, a conta deixa de receber notificações em todos os aparelhos.
              </ThemedText>
            </View>
            <Switch
              accessibilityLabel="Ativar notificações"
              disabled={loading || saving || enabled === null}
              onValueChange={changePreference}
              thumbColor={theme.card}
              trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
              value={enabled ?? false}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <ThemedText type="subtitle">Painel de testes (QA)</ThemedText>
          <ThemedText themeColor="mutedForeground" type="small">
            Envie push de teste para este aparelho. Os testes não criam nem alteram ocorrências.
          </ThemedText>
          {enabled === false ? (
            <ThemedText themeColor="mutedForeground" type="caption">
              Ative as notificações para habilitar os testes.
            </ThemedText>
          ) : null}
          <Button
            disabled={enabled !== true || loading || saving || activeTest !== null}
            icon={Icons.send}
            loading={activeTest === 'demand_created'}
            onPress={runDemandCreatedTest}
            title="Testar ocorrência registrada"
            variant="secondary"
          />
          <Button
            disabled={enabled !== true || loading || saving || activeTest !== null}
            icon={Icons.refresh}
            loading={activeTest === 'status_updated'}
            onPress={runStatusUpdatedTest}
            title="Testar atualização de status"
            variant="secondary"
          />
        </Card>
      </ScrollView>
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: Spacing.three, padding: Spacing.three },
  card: { gap: Spacing.two },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  icon: {
    alignItems: 'center',
    borderRadius: Radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, gap: Spacing.one, minWidth: 0 },
});

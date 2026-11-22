import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { request } from '@/services/api-client';
import { getDeviceIdentity } from '@/services/device-service';

export type AppNotification = {
  id: string;
  usuarioid: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  chamadoid: string | null;
  lida: boolean;
  criadoem: string;
  lida_em: string | null;
};

// Created by AI.
export type NotificationTestType = 'demand_created' | 'status_updated';

// Created by AI.
export type NotificationTestOutcome =
  | 'sent'
  | 'permission_denied'
  | 'permission_blocked';

// Created by AI.
/**
 * Estado da autorização de notificações no aparelho. `denied` ainda pode ser
 * perguntado de novo pelo sistema; `blocked` exige alteração em Ajustes.
 */
export type NotificationPermissionState = 'granted' | 'denied' | 'blocked';

// Created by AI.
export type NotificationPreferences = { enabled: boolean };

// Created by AI.
export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return request<NotificationPreferences>('/notifications/preferences');
}

// Created by AI.
export function updateNotificationPreferences(enabled: boolean): Promise<NotificationPreferences> {
  return request<NotificationPreferences>('/notifications/preferences', {
    method: 'PATCH',
    body: { enabled },
  });
}

// Created by AI.
async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificações',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (caught) {
    if (caught instanceof Error && caught.message.includes('NotificationsChannelsProvider')) {
      throw new Error(
        'A versão Android instalada não inclui o módulo atualizado de notificações. Recompile e instale o app com `npx expo run:android`.'
      );
    }
    throw caught;
  }
}

// Created by AI.
/**
 * Combina a permissão do sistema com o canal do Android para diferenciar
 * `denied` (o sistema ainda pode perguntar) de `blocked` (precisa dos Ajustes).
 */
export async function getNotificationPermissionState(
  promptForPermission = false
): Promise<NotificationPermissionState> {
  // Um canal silenciado desliga as notificações mesmo com a permissão concedida.
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync('default');
    if (channel?.importance === Notifications.AndroidImportance.NONE) {
      return 'blocked';
    }
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return 'granted';

  if (promptForPermission && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
    if (permission.granted) return 'granted';
  }

  return permission.canAskAgain ? 'denied' : 'blocked';
}

// Updated by AI.
/**
 * Desde o SDK 53, o Expo Go no Android não oferece push remoto. Nesse
 * ambiente nem o canal nem o token podem ser registrados, então a checagem
 * vem antes de qualquer chamada nativa: assim o app não mostra um erro de
 * "módulo desatualizado" que só um development build resolveria.
 */
export const isPushUnavailableInExpoGo =
  Platform.OS === 'android' && Constants.appOwnership === 'expo';

// Updated by AI.
export async function registerPushToken(promptForPermission = false): Promise<boolean> {
  if (isPushUnavailableInExpoGo) {
    if (promptForPermission) {
      throw new Error(
        'O push remoto no Android não está disponível no Expo Go. Use um development build para executar o teste.'
      );
    }
    return false;
  }

  await ensureAndroidNotificationChannel();

  const permission = await getNotificationPermissionState(promptForPermission);
  if (permission !== 'granted') {
    return false;
  }

  const preferences = await getNotificationPreferences();
  if (!preferences.enabled) {
    return false;
  }

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
  const { deviceId, deviceName } = await getDeviceIdentity();

  await request('/notifications/devices/push-token', {
    method: 'POST',
    body: {
      deviceId,
      deviceName,
      pushToken,
    },
  });

  return true;
}

// Created by AI.
// Updated by AI.
export async function triggerNotificationTest(
  type: NotificationTestType
): Promise<NotificationTestOutcome> {
  const registered = await registerPushToken(true);
  if (!registered) {
    const permission = await getNotificationPermissionState(false);
    if (permission === 'denied') {
      return 'permission_denied';
    }
    if (permission === 'blocked') {
      return 'permission_blocked';
    }

    throw new Error('Ative as notificações da sua conta para executar este teste.');
  }

  const { deviceId } = await getDeviceIdentity();
  await request<{ ok: boolean }>('/notifications/test', {
    method: 'POST',
    body: { deviceId, type },
  });

  return 'sent';
}

export function listNotifications(): Promise<AppNotification[]> {
  return request<AppNotification[]>('/notifications');
}

export function markNotificationRead(id: string): Promise<void> {
  return request<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

// Created by AI.
/**
 * Extrai o `chamadoId` de uma resposta de notificação, validando o payload e
 * exigindo o toque padrão (não uma ação secundária). Devolve `null` quando o
 * push não aponta para uma ocorrência.
 */
export function chamadoIdDaNotificacao(
  response: Notifications.NotificationResponse
): string | null {
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return null;
  }

  const chamadoId = response.notification.request.content.data?.chamadoId;
  return typeof chamadoId === 'string' && chamadoId.trim().length > 0 ? chamadoId : null;
}

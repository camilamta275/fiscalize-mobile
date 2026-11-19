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
export type NotificationTestOutcome = 'sent' | 'permission_denied';

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

// Updated by AI.
export async function registerPushToken(promptForPermission = false): Promise<boolean> {
  if (Platform.OS === 'android') {
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

    const channel = await Notifications.getNotificationChannelAsync('default');
    if (channel?.importance === Notifications.AndroidImportance.NONE) {
      return false;
    }
  }

  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted' && promptForPermission) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (permission.status !== 'granted') {
    return false;
  }

  const preferences = await getNotificationPreferences();
  if (!preferences.enabled) {
    return false;
  }

  if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
    if (promptForPermission) {
      throw new Error(
        'O push remoto no Android não está disponível no Expo Go. Use um development build para executar o teste.'
      );
    }
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
    const permission = await Notifications.getPermissionsAsync();
    const channel = Platform.OS === 'android'
      ? await Notifications.getNotificationChannelAsync('default')
      : null;
    if (
      permission.status !== 'granted' ||
      channel?.importance === Notifications.AndroidImportance.NONE
    ) {
      return 'permission_denied';
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

import * as Notifications from 'expo-notifications';

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

export async function registerPushToken(): Promise<boolean> {
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') {
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

export function listNotifications(): Promise<AppNotification[]> {
  return request<AppNotification[]>('/notifications');
}

export function markNotificationRead(id: string): Promise<void> {
  return request<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

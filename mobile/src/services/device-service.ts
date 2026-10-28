import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';

const DEVICE_ID_KEY = 'fiscalize.device-id';

export async function getDeviceIdentity(): Promise<{ deviceId: string; deviceName: string }> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    const randomUuid = globalThis.crypto?.randomUUID?.();
    if (!randomUuid) {
      throw new Error('Não foi possível gerar uma identificação segura para este dispositivo.');
    }
    deviceId = randomUuid;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }

  return {
    deviceId,
    deviceName: [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || 'Dispositivo móvel',
  };
}

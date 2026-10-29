import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

// Created by AI.
const DEVICE_ID_KEY = 'fiscalize.device-id';

/**
 * Service — provides the stable device identity used by the MFA flow. The
 * identifier is generated once and persisted in SecureStore; the backend only
 * ever stores its SHA-256 hash (`usuario_dispositivos.device_hash`).
 */

// Created by AI.
// Updated by AI.
export async function getDeviceIdentity(): Promise<{ deviceId: string; deviceName: string }> {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }

  return {
    deviceId,
    deviceName: [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || 'Dispositivo móvel',
  };
}

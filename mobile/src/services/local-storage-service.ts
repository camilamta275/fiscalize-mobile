import AsyncStorage from '@react-native-async-storage/async-storage';

// Created by AI.
export async function readJson<T>(key: string): Promise<T | null> {
  const serialized = await AsyncStorage.getItem(key);
  if (!serialized) return null;

  try {
    return JSON.parse(serialized) as T;
  } catch (caught) {
    throw new Error(`Cache local inválido para "${key}".`, { cause: caught });
  }
}

// Created by AI.
export async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Created by AI.
export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

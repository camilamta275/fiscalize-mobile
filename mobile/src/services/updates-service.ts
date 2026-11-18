import * as Updates from 'expo-updates';

// Created by AI.
export async function checkForRemoteUpdate(): Promise<boolean> {
  if (!Updates.isEnabled || Updates.isEmbeddedLaunch) return false;

  const update = await Updates.checkForUpdateAsync();
  if (!update.isAvailable) return false;

  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
  return true;
}

import * as Updates from 'expo-updates';
import Constants from 'expo-constants';

// Created by AI.
// Updated by AI.
export async function checkForRemoteUpdate(): Promise<boolean> {
  if (
    Constants.appOwnership === 'expo' ||
    !Updates.isEnabled ||
    Updates.isEmbeddedLaunch
  ) {
    return false;
  }

  const update = await Updates.checkForUpdateAsync();
  if (!update.isAvailable) return false;

  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
  return true;
}

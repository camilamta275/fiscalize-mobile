import { useCallback, useEffect, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';

/**
 * Persists a string under SecureStore and mirrors it as React state.
 *
 * `[isLoading, value]` starts as `[true, null]` because the read from
 * SecureStore is asynchronous — `session-context.tsx` uses `isLoading` to hold
 * the splash screen until it knows whether a token exists, instead of
 * flashing the sign-in screen first.
 */
export function useStorageState(key: string): [[boolean, string | null], (value: string | null) => void] {
  const [state, dispatch] = useReducer(
    (_state: [boolean, string | null], value: string | null): [boolean, string | null] => [
      false,
      value,
    ],
    [true, null]
  );

  useEffect(() => {
    SecureStore.getItemAsync(key).then((value) => dispatch(value));
  }, [key]);

  const setValue = useCallback(
    (value: string | null) => {
      dispatch(value);
      if (value == null) {
        SecureStore.deleteItemAsync(key);
      } else {
        SecureStore.setItemAsync(key, value);
      }
    },
    [key]
  );

  return [state, setValue];
}

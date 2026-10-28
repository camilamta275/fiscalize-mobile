import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { ApiError } from '@/models/api-error';
import type { Usuario } from '@/models/usuario';
import * as authService from '@/services/auth-service';
import { setAuthTokens, setTokenRotationHandler } from '@/services/api-client';
import { useStorageState } from '@/hooks/use-storage-state';
import { getDeviceIdentity } from '@/services/device-service';

/**
 * Context — the app's auth session, following the pattern in
 * https://docs.expo.dev/router/advanced/authentication/. `RootNavigator`
 * (src/app/_layout.tsx) reads `usuario` to guard the `(app)` group behind
 * `login`; `use-login-view-model.ts` calls `signIn`.
 */

// Updated by AI.
type SessionContextValue = {
  usuario: Usuario | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, senha: string) => Promise<boolean>;
  verifyMfa: (code: string) => Promise<void>;
  pendingMfa: { challengeToken: string; destination: string } | null;
  signOut: () => void;
  setUsuario: (usuario: Usuario) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const value = use(SessionContext);
  if (!value) {
    throw new Error('useSession must be used within a <SessionProvider />');
  }
  return value;
}

const TOKEN_KEY = 'fiscalize.token';
// Created by AI.
const REFRESH_TOKEN_KEY = 'fiscalize.refresh-token';

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isRestoringToken, token], setToken] = useStorageState(TOKEN_KEY);
  const [[isRestoringRefreshToken, storedRefreshToken], setStoredRefreshToken] =
    useStorageState(REFRESH_TOKEN_KEY);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isResolvingUsuario, setIsResolvingUsuario] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMfa, setPendingMfa] = useState<{
    challengeToken: string;
    destination: string;
  } | null>(null);

  // A restored token still needs its usuario — the token alone was never
  // shown to the user, so there's nothing to render until this resolves.
  useEffect(() => {
    if (isRestoringToken || isRestoringRefreshToken) return;

    if (!token) {
      setAuthTokens(null, storedRefreshToken);
      setUsuario(null);
      setIsResolvingUsuario(false);
      return;
    }

    setAuthTokens(token, storedRefreshToken);
    setTokenRotationHandler((nextToken, nextRefreshToken) => {
      if (!nextToken) {
        setToken(null);
        setStoredRefreshToken(null);
        setUsuario(null);
        return;
      }
      setToken(nextToken);
      setStoredRefreshToken(nextRefreshToken);
    });
    authService
      .me()
      .then(setUsuario)
      .catch(() => {
        // Expired or revoked — the refresh flow will have cleared both tokens.
        setAuthTokens(null, null);
        setToken(null);
        setStoredRefreshToken(null);
        setUsuario(null);
      })
      .finally(() => setIsResolvingUsuario(false));
  }, [
    isRestoringToken,
    isRestoringRefreshToken,
    token,
    storedRefreshToken,
    setToken,
    setStoredRefreshToken,
  ]);

  const signIn = async (email: string, senha: string): Promise<boolean> => {
    setError(null);
    try {
      const identity = await getDeviceIdentity();
      const result = await authService.login(email, senha, identity.deviceId, identity.deviceName);
      if ('mfaRequired' in result) {
        setPendingMfa(result);
        return false;
      }
      const { token: newToken, refreshToken: newRefreshToken, ...loggedInUsuario } = result;
      setAuthTokens(newToken, newRefreshToken);
      setToken(newToken);
      setStoredRefreshToken(newRefreshToken);
      setUsuario(loggedInUsuario);
      return true;
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : 'Erro inesperado ao entrar.';
      setError(message);
      throw caught;
    }
  };

  const verifyMfa = async (code: string) => {
    if (!pendingMfa) throw new Error('Nenhuma verificação pendente.');
    setError(null);
    try {
      const identity = await getDeviceIdentity();
      const { token: newToken, refreshToken: newRefreshToken, ...loggedInUsuario } =
        await authService.verifyOtp(pendingMfa.challengeToken, code, identity.deviceId);
      setAuthTokens(newToken, newRefreshToken);
      setToken(newToken);
      setStoredRefreshToken(newRefreshToken);
      setUsuario(loggedInUsuario);
      setPendingMfa(null);
    } catch (caught) {
      const message = caught instanceof ApiError ? caught.message : 'Código inválido.';
      setError(message);
      throw caught;
    }
  };

  const signOut = () => {
    authService.logout(storedRefreshToken).catch(() => {
      // The token is being discarded locally either way.
    });
    setAuthTokens(null, null);
    setToken(null);
    setStoredRefreshToken(null);
    setUsuario(null);
  };

  return (
    <SessionContext.Provider
      value={{
        usuario,
        isLoading: isRestoringToken || isRestoringRefreshToken || isResolvingUsuario,
        error,
        signIn,
        verifyMfa,
        pendingMfa,
        signOut,
        setUsuario,
      }}>
      {children}
    </SessionContext.Provider>
  );
}

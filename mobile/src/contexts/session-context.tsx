import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError } from '@/models/api-error';
import type { Usuario } from '@/models/usuario';
import * as authService from '@/services/auth-service';
import { setAuthTokens, setTokenRotationHandler } from '@/services/api-client';
import { useStorageState } from '@/hooks/use-storage-state';
import { getDeviceIdentity } from '@/services/device-service';
import { registerPushToken } from '@/services/notification-service';

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
  setUsuario: (usuario: Usuario | null) => void;
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
// Created by AI.
const USER_KEY = 'fiscalize.usuario';

// Updated by AI.
export function SessionProvider({ children }: PropsWithChildren) {
  const [[isRestoringToken, token], setToken] = useStorageState(TOKEN_KEY);
  const [[isRestoringRefreshToken, storedRefreshToken], setStoredRefreshToken] =
    useStorageState(REFRESH_TOKEN_KEY);
  const [[isRestoringUsuario, storedUsuario], setStoredUsuario] = useStorageState(USER_KEY);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isResolvingUsuario, setIsResolvingUsuario] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMfa, setPendingMfa] = useState<{
    challengeToken: string;
    destination: string;
  } | null>(null);

  // Created by AI.
  // Updated by AI.
  const persistUsuario = useCallback(
    (nextUsuario: Usuario | null) => {
      setUsuario(nextUsuario);
      setStoredUsuario(nextUsuario ? JSON.stringify(nextUsuario) : null);
    },
    [setStoredUsuario]
  );

  // A restored token still needs its usuario — the token alone was never
  // shown to the user, so there's nothing to render until this resolves.
  useEffect(() => {
    if (!usuario) return;
    // Falha ao registrar o push (sem Firebase/permissão/rede) não pode virar
    // promessa rejeitada sem tratamento; o app segue funcionando sem notificações.
    void registerPushToken().catch((caught: unknown) => {
      console.warn(
        '[Push] Não foi possível registrar o token de notificações.',
        caught instanceof Error ? caught.message : caught
      );
    });
  }, [usuario]);

  useEffect(() => {
    if (isRestoringToken || isRestoringRefreshToken || isRestoringUsuario) return;

    if (!token) {
      setAuthTokens(null, storedRefreshToken);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      persistUsuario(null);
      setIsResolvingUsuario(false);
      return;
    }

    setAuthTokens(token, storedRefreshToken);
    setTokenRotationHandler((nextToken, nextRefreshToken) => {
      if (!nextToken) {
        setToken(null);
        setStoredRefreshToken(null);
        persistUsuario(null);
        return;
      }
      setToken(nextToken);
      setStoredRefreshToken(nextRefreshToken);
    });
    authService
      .me()
      .then(persistUsuario)
      .catch((caught: unknown) => {
        const cachedUsuario = parseStoredUsuario(storedUsuario);
        if (caught instanceof ApiError && caught.isOffline && cachedUsuario) {
          persistUsuario(cachedUsuario);
          return;
        }
        // Expired or revoked — the refresh flow will have cleared both tokens.
        setAuthTokens(null, null);
        setToken(null);
        setStoredRefreshToken(null);
        persistUsuario(null);
      })
      .finally(() => setIsResolvingUsuario(false));
  }, [
    isRestoringToken,
    isRestoringRefreshToken,
    isRestoringUsuario,
    token,
    storedRefreshToken,
    storedUsuario,
    setToken,
    setStoredRefreshToken,
    persistUsuario,
  ]);

  // Updated by AI.
  const signIn = async (email: string, senha: string): Promise<boolean> => {
    setError(null);
    try {
      const identity = await getDeviceIdentity();
      const result = await authService.login(email, senha, identity.deviceId, identity.deviceName);
      if ('mfaRequired' in result) {
        setPendingMfa(result);
        return false;
      }
      const { token: newToken, refreshToken: newRefreshToken } = result;
      setAuthTokens(newToken, newRefreshToken);
      setToken(newToken);
      setStoredRefreshToken(newRefreshToken);
      persistUsuario(await authService.me());
      return true;
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : 'Erro inesperado ao entrar.';
      setError(message);
      throw caught;
    }
  };

  // Created by AI.
  // Updated by AI.
  const verifyMfa = async (code: string) => {
    if (!pendingMfa) throw new Error('Nenhuma verificação pendente.');
    setError(null);
    try {
      const identity = await getDeviceIdentity();
      const { token: newToken, refreshToken: newRefreshToken } =
        await authService.verifyOtp(pendingMfa.challengeToken, code, identity.deviceId);
      setAuthTokens(newToken, newRefreshToken);
      setToken(newToken);
      setStoredRefreshToken(newRefreshToken);
      persistUsuario(await authService.me());
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
    persistUsuario(null);
  };

  return (
    <SessionContext.Provider
      value={{
        usuario,
        isLoading:
          isRestoringToken ||
          isRestoringRefreshToken ||
          isRestoringUsuario ||
          isResolvingUsuario,
        error,
        signIn,
        verifyMfa,
        pendingMfa,
        signOut,
        setUsuario: persistUsuario,
      }}>
      {children}
    </SessionContext.Provider>
  );
}

// Created by AI.
function parseStoredUsuario(value: string | null): Usuario | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as Usuario;
  } catch {
    return null;
  }
}

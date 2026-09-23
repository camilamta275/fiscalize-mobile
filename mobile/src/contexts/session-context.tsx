import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { ApiError } from '@/models/api-error';
import type { Usuario } from '@/models/usuario';
import * as authService from '@/services/auth-service';
import { setAuthToken } from '@/services/api-client';
import { useStorageState } from '@/hooks/use-storage-state';

/**
 * Context — the app's auth session, following the pattern in
 * https://docs.expo.dev/router/advanced/authentication/. `RootNavigator`
 * (src/app/_layout.tsx) reads `usuario` to guard the `(app)` group behind
 * `login`; `use-login-view-model.ts` calls `signIn`.
 */

type SessionContextValue = {
  usuario: Usuario | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => void;
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

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isRestoringToken, token], setToken] = useStorageState(TOKEN_KEY);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isResolvingUsuario, setIsResolvingUsuario] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A restored token still needs its usuario — the token alone was never
  // shown to the user, so there's nothing to render until this resolves.
  useEffect(() => {
    if (isRestoringToken) return;

    if (!token) {
      setUsuario(null);
      setIsResolvingUsuario(false);
      return;
    }

    setAuthToken(token);
    authService
      .me()
      .then(setUsuario)
      .catch(() => {
        // Expired or revoked — the stored token is no longer good for anything.
        setAuthToken(null);
        setToken(null);
        setUsuario(null);
      })
      .finally(() => setIsResolvingUsuario(false));
  }, [isRestoringToken, token, setToken]);

  const signIn = async (email: string, senha: string) => {
    setError(null);
    try {
      const { token: newToken, ...loggedInUsuario } = await authService.login(email, senha);
      setAuthToken(newToken);
      setToken(newToken);
      setUsuario(loggedInUsuario);
    } catch (caught) {
      const message =
        caught instanceof ApiError ? caught.message : 'Erro inesperado ao entrar.';
      setError(message);
      throw caught;
    }
  };

  const signOut = () => {
    authService.logout().catch(() => {
      // The token is being discarded locally either way.
    });
    setAuthToken(null);
    setToken(null);
    setUsuario(null);
  };

  return (
    <SessionContext.Provider
      value={{
        usuario,
        isLoading: isRestoringToken || isResolvingUsuario,
        error,
        signIn,
        signOut,
      }}>
      {children}
    </SessionContext.Provider>
  );
}

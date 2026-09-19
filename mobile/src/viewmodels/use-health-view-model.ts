import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/models/api-error';
import type { Health } from '@/models/health';
import { baseUrl } from '@/services/api-client';
import { fetchHealth } from '@/services/health-service';

/**
 * ViewModel — owns the state and the actions of the backend-status screen.
 *
 * No JSX lives here, and the View it serves imports no service: the View renders
 * whatever this returns. That keeps the screen testable without a renderer and
 * the transport replaceable without touching the UI.
 */
export function useHealthViewModel() {
  const [health, setHealth] = useState<Health | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setHealth(await fetchHealth());
    } catch (caught) {
      setHealth(null);
      // ApiError already carries the backend's own message.
      setError(
        caught instanceof ApiError ? caught.message : 'Erro inesperado ao consultar a API.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { health, isLoading, error, baseUrl, refresh };
}

import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError } from '@/models/api-error';
import type { DemandDetail } from '@/models/demand';
import * as demandService from '@/services/demand-service';

/**
 * ViewModel — loads one demand for the detail screen. It re-fetches whenever
 * the screen regains focus, so coming back from the edit form shows the new
 * data (and the new timeline event) without a manual pull-to-refresh.
 */
// Created by AI.
export function useDemandDetailViewModel(demandId: string) {
  const [demand, setDemand] = useState<DemandDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await demandService.getById(demandId);
      setDemand(result);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Não foi possível carregar esta ocorrência.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [demandId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { demand, isLoading, error, reload: load };
}

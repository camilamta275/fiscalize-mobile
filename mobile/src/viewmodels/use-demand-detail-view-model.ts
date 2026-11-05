import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError } from '@/models/api-error';
import { useDemands } from '@/contexts/demand-context';

/**
 * ViewModel — loads one demand for the detail screen. It re-fetches whenever
 * the screen regains focus, so coming back from the edit form shows the new
 * data (and the new timeline event) without a manual pull-to-refresh.
 *
 * It reads through the shared demand store: if the demand is already known
 * (from the list or an earlier visit) it renders that immediately and only
 * the revalidation runs in the background, instead of a blank loading state.
 */
// Created by AI.
// Updated by AI.
export function useDemandDetailViewModel(demandId: string) {
  const { getCached, fetchDetail } = useDemands();
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `DemandDetail` makes every extra field optional precisely so a cached
  // list item still type-checks here.
  const demand = getCached(demandId);
  const isLoading = isFetching && !demand;

  const load = useCallback(async () => {
    try {
      await fetchDetail(demandId);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Não foi possível carregar esta ocorrência.'
      );
    } finally {
      setIsFetching(false);
    }
  }, [demandId, fetchDetail]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { demand, isLoading, error, reload: load };
}

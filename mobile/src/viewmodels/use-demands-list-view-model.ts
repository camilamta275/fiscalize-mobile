import { useCallback, useEffect, useState } from 'react';

import type { Demand, DemandStatus } from '@/models/demand';
import { ApiError } from '@/models/api-error';
import * as demandService from '@/services/demand-service';

/**
 * ViewModel — owns the state and the actions of the demands list screen.
 *
 * Pagination is page-based (the API's own shape — `page`/`limit`/`totalPages`
 * in DemandListResult), driven by the View's FlatList `onEndReached`: each
 * call appends a page rather than replacing the list, while `refresh` (pull
 * to refresh, or a filter/search change) resets back to page 1.
 */
export function useDemandsListViewModel() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DemandStatus | null>(null);

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode === 'more') setIsLoadingMore(true);
      setError(null);

      try {
        const result = await demandService.list({
          page: targetPage,
          regiao: search || undefined,
          status: statusFilter ?? undefined,
        });
        setDemands((prev) => (targetPage === 1 ? result.data : [...prev, ...result.data]));
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch (caught) {
        setError(
          caught instanceof ApiError ? caught.message : 'Erro inesperado ao buscar ocorrências.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [search, statusFilter]
  );

  const refresh = useCallback(() => fetchPage(1, 'refresh'), [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || isLoading || isRefreshing || page >= totalPages) return;
    void fetchPage(page + 1, 'more');
  }, [fetchPage, isLoadingMore, isLoading, isRefreshing, page, totalPages]);

  // Runs on mount and every time the search term or status filter changes —
  // both are meant to restart the list from page 1, same as `refresh`.
  useEffect(() => {
    void fetchPage(1, page === 1 && demands.length === 0 ? 'initial' : 'refresh');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  return {
    demands,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh,
    loadMore,
  };
}

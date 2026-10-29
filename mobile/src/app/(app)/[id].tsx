import { useLocalSearchParams } from 'expo-router';

import { DemandDetailView } from '@/views/demand-detail-view';

/**
 * Route — the expo-router entry for `/ocorrencias/[id]`, pushed by tapping a
 * card in the list. Shows the read-only detail; editing lives in the nested
 * `[id]/edit` route.
 */
// Updated by AI.
export default function OcorrenciaDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DemandDetailView demandId={id} />;
}

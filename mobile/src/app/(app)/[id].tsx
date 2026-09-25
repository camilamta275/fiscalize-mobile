import { useLocalSearchParams } from 'expo-router';

import { DemandFormView } from '@/views/demand-form-view';

/**
 * Route — the expo-router entry for `/ocorrencias/[id]`, pushed by tapping a
 * card in the list. Reuses the same form as `new`, in edit mode.
 */
export default function EditOcorrenciaRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DemandFormView demandId={id} />;
}

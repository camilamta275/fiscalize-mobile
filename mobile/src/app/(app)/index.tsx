import { HealthView } from '@/views/health-view';

/**
 * Route — the expo-router entry for `/`.
 *
 * Route files stay thin on purpose: they map a URL to a View and do nothing
 * else. expo-router requires routes to live under src/app, so keeping them free
 * of state and I/O is what lets the View/ViewModel pair sit outside the router
 * and stay independent of it.
 */
export default function IndexRoute() {
  return <HealthView />;
}

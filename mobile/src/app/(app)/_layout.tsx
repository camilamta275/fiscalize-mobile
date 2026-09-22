import AppTabs from '@/components/app-tabs';

/**
 * Route — the layout for every screen behind sign-in. Guarded by
 * `Stack.Protected` in src/app/_layout.tsx, so this file itself doesn't need
 * to know anything about auth.
 */
export default function AppLayout() {
  return <AppTabs />;
}

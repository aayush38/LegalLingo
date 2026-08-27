'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasOnboarded } from '@/lib/onboarding';

/**
 * Routes reachable before the welcome flow has been completed.
 *
 * The auth pages are here because they are reached by clicking a link in an
 * email, often on a device that has never opened the app. Redirecting those to
 * the welcome screen would throw away the token they carry.
 */
const OPEN_ROUTES = ['/welcome', '/auth/set-password', '/auth/confirm'];

/**
 * localStorage does not change under us within a session for this key, so
 * there is nothing to subscribe to. The unsubscribe is a no-op.
 */
function subscribe() {
  return () => {};
}

/**
 * On the server there is no localStorage, so assume the visitor has been here
 * before. That renders the app rather than the welcome page during SSR, which
 * is right for every returning visitor; a genuine first-timer is corrected on
 * hydration a moment later.
 */
function serverSnapshot() {
  return true;
}

/**
 * Sends first-time visitors to the welcome page.
 *
 * useSyncExternalStore rather than an effect: the onboarding flag lives outside
 * React, and reading it this way avoids both a hydration mismatch and the
 * cascading render that setState-in-an-effect would cause.
 */
export const OnboardingGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const onboarded = useSyncExternalStore(subscribe, hasOnboarded, serverSnapshot);
  const isOpenRoute = OPEN_ROUTES.includes(pathname);
  const shouldRedirect = !onboarded && !isOpenRoute;

  useEffect(() => {
    if (shouldRedirect) router.replace('/welcome');
  }, [shouldRedirect, router]);

  if (shouldRedirect) {
    // A quiet placeholder rather than a spinner. This resolves in one tick for
    // everyone who has been here before, and a flash of the main page being
    // yanked away looks like a crash on a slow phone.
    return <div className="min-h-[50vh]" aria-hidden="true" />;
  }

  return <>{children}</>;
};

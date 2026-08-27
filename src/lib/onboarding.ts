'use client';

/**
 * Whether this device has been through the welcome flow.
 *
 * This is a UI preference, not a document, so it is allowed on the device —
 * the same exception `legallingo_language` gets. Showing the language chooser
 * on every visit would be worse than useless: the citizen has already answered.
 */
const ONBOARDED_KEY = 'legallingo_onboarded';

export function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    // Private browsing or blocked storage: treat as onboarded rather than
    // trapping someone on the welcome screen forever.
    return true;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // Nothing to do — the flow still completes for this session.
  }
}

/** Used by tests and by a future "start over" control. */
export function clearOnboarded(): void {
  try {
    localStorage.removeItem(ONBOARDED_KEY);
  } catch {
    /* ignore */
  }
}

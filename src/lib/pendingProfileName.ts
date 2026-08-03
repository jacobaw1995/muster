const KEY = "pendingProfileName";

/**
 * Carries a Sign Up name across the magic-link email round trip: profile
 * creation only happens once the browser returns via that link (see
 * SessionContext), which can be a different tab or device than the one that
 * submitted the form, so the name has to survive outside React state.
 */
export function stashPendingProfileName(name: string): void {
  localStorage.setItem(KEY, name);
}

export function hasPendingProfileName(): boolean {
  return localStorage.getItem(KEY) !== null;
}

/** Reads and clears the stash in one step, so a given name is only ever applied once. */
export function takePendingProfileName(): string | null {
  const name = localStorage.getItem(KEY);
  if (name !== null) localStorage.removeItem(KEY);
  return name;
}

export function clearPendingProfileName(): void {
  localStorage.removeItem(KEY);
}

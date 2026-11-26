// Rancher (2.12+) stores the Global Settings -> Registration state in
// cluster-scoped `registrations.scc.cattle.io` resources.
export const SCC_REGISTRATION = 'scc.cattle.io.registration';

export type ProductRegistrationState = 'registered' | 'notRegistered' | 'unknown';

export interface ProductRegistration {
  state: ProductRegistrationState;
  /** Latest expiry of the activated registrations, as an ISO 8601 string */
  expiresAt?: string;
}

interface Condition {
  type?: string;
  status?: string;
}

interface Registration {
  status?: {
    activationStatus?: { activated?: boolean };
    conditions?: Condition[];
    registrationExpiresAt?: string;
  };
}

function isActivated(reg: Registration): boolean {
  if (reg?.status?.activationStatus?.activated === true) {
    return true;
  }

  // Fallback in case only conditions are populated
  return !!reg?.status?.conditions?.some((c) => c?.type === 'RegistrationActivated' && c?.status === 'True');
}

/**
 * Starts watching the registrations. Returns false when the CRD doesn't exist
 * (Rancher < 2.12) or the user can't read it, so that "not visible" can be
 * reported as unknown rather than as not registered.
 */
export async function loadProductRegistrations(store: any): Promise<boolean> {
  if (!store.getters['management/schemaFor'](SCC_REGISTRATION)) {
    return false;
  }

  try {
    await store.dispatch('management/findAll', { type: SCC_REGISTRATION });

    return true;
  } catch {
    return false;
  }
}

/** The registration state, from the registrations loadProductRegistrations() put in the store */
export function productRegistration(store: any): ProductRegistration {
  const regs: Registration[] = store.getters['management/all'](SCC_REGISTRATION) || [];
  const activated = regs.filter(isActivated);

  if (!activated.length) {
    return { state: 'notRegistered' };
  }

  // If there are several activated registrations, show the latest expiry
  const expiresAt = activated
    .map((r) => r.status?.registrationExpiresAt)
    .filter((d): d is string => !!d)
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  return { state: 'registered', expiresAt };
}

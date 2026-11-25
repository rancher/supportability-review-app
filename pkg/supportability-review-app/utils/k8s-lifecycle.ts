import { EomEol } from './helper-data';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type KubernetesLifecycle = {
  /** Provider the dates belong to, i.e. `k3s` */
  provider: string;
  /** Kubernetes minor version the dates belong to, i.e. `1.35` */
  minor: string;
  /** End of maintenance as `YYYY-MM-DD`, or undefined when the provider has no EOM */
  eom?: string;
  /** End of life as `YYYY-MM-DD` */
  eol?: string;
  /** Days left until EOL. Negative once the version is out of support */
  daysToEol?: number;
};

function isoDate(date: string): string {
  return date.split('/').join('-');
}

function daysUntil(date: string): number {
  return Math.ceil((Date.parse(`${isoDate(date)}T00:00:00Z`) - Date.now()) / MS_PER_DAY);
}

const UPSTREAM = 'kubernetes';

export function providerFor(version: string): string {
  if (version.includes('+rke2r')) {
    return 'rke2';
  }
  if (version.includes('+k3s')) {
    return 'k3s';
  }
  if (version.includes('-rancher')) {
    return 'rke';
  }

  return UPSTREAM;
}

// `eomEol` is what the operator serves, see helperData().
export function kubernetesLifecycle(version: string | undefined, eomEol: EomEol): KubernetesLifecycle | undefined {
  const parsed = (version || '').match(/^v?(\d+\.\d+)\./);

  if (!parsed) {
    return undefined;
  }

  const provider = providerFor(version || '');
  const minor = parsed[1];
  const entry = eomEol[provider]?.[minor];

  if (!entry) {
    return { provider, minor };
  }

  return {
    provider,
    minor,
    eom: entry.eom ? isoDate(entry.eom) : undefined,
    eol: entry.eol ? isoDate(entry.eol) : undefined,
    daysToEol: entry.eol ? daysUntil(entry.eol) : undefined
  };
}

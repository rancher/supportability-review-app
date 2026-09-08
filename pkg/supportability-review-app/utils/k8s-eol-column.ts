import { IPlugin, TableColumnLocation } from '@shell/core/types';
import eomEolData from '../config/eom-eol.json';

type EomEolEntry = { eom: string | null; eol: string | null };
const EOM_EOL: Record<string, Record<string, EomEolEntry>> = eomEolData;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const CLUSTER_LIST = { resource: ['provisioning.cattle.io.cluster'] };

export type KubernetesLifecycle = {
  /** Distro the dates belong to, i.e. `k3s` */
  distro: string;
  /** Kubernetes minor version the dates belong to, i.e. `1.35` */
  minor: string;
  /** End of maintenance as `YYYY-MM-DD`, or undefined when the distro has no EOM */
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

function distroFor(version: string): string {
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

export function kubernetesLifecycle(version?: string): KubernetesLifecycle | undefined {
  const parsed = (version || '').match(/^v?(\d+\.\d+)\./);

  if (!parsed) {
    return undefined;
  }

  const distro = distroFor(version || '');
  const minor = parsed[1];
  const entry = EOM_EOL[distro]?.[minor];

  if (!entry) {
    return { distro, minor };
  }

  return {
    distro,
    minor,
    eom: entry.eom ? isoDate(entry.eom) : undefined,
    eol: entry.eol ? isoDate(entry.eol) : undefined,
    daysToEol: entry.eol ? daysUntil(entry.eol) : undefined
  };
}

export function registerKubernetesEolColumn(plugin: IPlugin): void {
  plugin.register('formatters', 'KubernetesEol', () => import('../components/KubernetesEol.vue'));

  const column = {
    name: 'k8s-eol',
    labelKey: 'tableHeaders.k8sEol',
    formatter: 'KubernetesEol',
    search: false,
    sort: 'statusInfo.kubernetesVersion',
    width: 130
  };
  const paginationColumn = { ...column, sort: 'status.info.kubernetesVersion' };

  plugin.addTableColumn(TableColumnLocation.RESOURCE, CLUSTER_LIST, column, paginationColumn);
}

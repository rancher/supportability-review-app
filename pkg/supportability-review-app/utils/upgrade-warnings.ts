import { IPlugin, TableColumnLocation } from '@shell/core/types';
import { getVersionData } from '@shell/config/version';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';
import { providerFor } from './k8s-eol-column';
import { mgmtClusterIdFor } from './cert-expiry';
import { SUPPORTABILITY_REVIEW_STORE } from '../config/types';
import rke2OsMatrix from '../config/rke2-rancher-os-matrix.json';
import k3sOsMatrix from '../config/k3s-rancher-os-matrix.json';

// Operating systems each Rancher patch release supports, per provider, i.e.
// `{ rke2: { '2.14.5': { Ubuntu: ['24.04', '22.04'], ... } } }`
const OS_MATRIX: Record<string, Record<string, Record<string, string[]>>> = {
  rke2: rke2OsMatrix,
  k3s: k3sOsMatrix
};

// How the providers are spelled in the warnings
const PROVIDER_LABELS: Record<string, string> = { rke2: 'RKE2', k3s: 'K3s' };

export type UpgradeWarning = {
  title: string;
  description: string;
  url?: string;
};

const CLUSTER_LIST = { resource: ['provisioning.cattle.io.cluster'] };

// One comparable number per version, i.e. `v1.32.10+rke2r1` -> 1321001, built as
// major, minor, patch and provider revision of two digits each. The provider revision
// is part of the ordering (RKE2 ships different etcd versions in +rke2r1 and
// +rke2r2 of the same patch), but semver treats it as build metadata and ignores
// it, so versions are turned into numbers instead of compared with semver.
function versionNumber(version: string): number | undefined {
  const parsed = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:[+-](?:rke2r|k3s|rancher)(\d+))?/);

  if (!parsed) {
    return undefined;
  }

  const [major, minor, patch, revision] = parsed.slice(1).map((part) => Number(part || 0));

  return ((major * 100 + minor) * 100 + patch) * 100 + revision;
}

export type UpgradePlan = {
  /** Provider the warnings belong to, i.e. `k3s` */
  provider: string;
  /** Kubernetes minor version the cluster runs, i.e. `1.35` */
  from: string;
  /** Next Kubernetes minor version, i.e. `1.36` */
  to: string;
  warnings: UpgradeWarning[];
  /** Warnings about upgrading Rancher itself, undefined when its version is unknown */
  rancher?: RancherPlan;
};

export type RancherPlan = {
  /** Rancher minor version running now, i.e. `2.13` */
  from: string;
  /** Next Rancher minor version, i.e. `2.14` */
  to: string;
  warnings: UpgradeWarning[];
};

// getVersionData() is filled in by the host page and the extension bundle has its
// own copy of that module, so the setting is what an extension can read. Keep the
// module as a fallback, the same order the shell uses in getVersionInfo().
export function rancherVersion(getters: any): string {
  return (
    getters['management/byId'](MANAGEMENT.SETTING, SETTING.VERSION_RANCHER)?.value || getVersionData()?.Version || ''
  );
}

/** What a cluster's nodes are currently reporting */
export type NodesRecord = {
  /** Set while the request is in flight */
  pending?: boolean;
  /** The cluster's nodes, as Steve returns them */
  nodes?: any[];
  /** When the nodes were last read, as an ISO 8601 string */
  checkedAt?: string;
  /** Why the nodes could not be read */
  error?: string;
};

// Reads what every node of the cluster runs. Steve serves the same node objects
// `kubectl get node` returns, so `status.nodeInfo.osImage` looks like
// `Ubuntu 24.04.2 LTS` or `SUSE Linux Enterprise Server 15 SP6`.
export async function fetchClusterNodes(dispatch: any, clusterId: string): Promise<any[]> {
  const res = await dispatch('management/request', { url: `/k8s/clusters/${clusterId}/v1/nodes` }, { root: true });
  const nodes = res?.data || [];

  console.log(
    `[SR] node OS images for cluster ${clusterId}:`,
    nodes.map((node: any) => `${node.metadata?.name}: ${node.status?.nodeInfo?.osImage}`)
  );

  return nodes;
}

// How a release is read out of `status.nodeInfo.osImage` per OS the matrix keys,
// i.e. `Ubuntu 24.04.2 LTS` -> `24.04`, `Amazon Linux 2023.12.20260928` -> `2023`.
// An OS named here but missing from the matrix is not supported at all, i.e.
// openSUSE Leap Micro. Sorted by name; the patterns are anchored, so they can be
// read in any order.
const OS_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Amazon Linux', pattern: /^Amazon Linux (\d+)/ },
  { name: 'OpenSUSE Leap', pattern: /^openSUSE Leap (\d+\.\d+)/ },
  { name: 'openSUSE Leap Micro', pattern: /^openSUSE Leap Micro (\d+\.\d+)/ },
  { name: 'Oracle Linux', pattern: /^Oracle Linux Server (\d+\.\d+)/ },
  // RHEL 7 reports `Red Hat Enterprise Linux Server 7.9 (Maipo)`, later releases
  // drop the `Server`
  { name: 'RHEL', pattern: /^Red Hat Enterprise Linux (?:Server )?(\d+\.\d+)/ },
  { name: 'Rocky Linux', pattern: /^Rocky Linux (\d+\.\d+)/ },
  // Renamed along the way: `SUSE Linux Enterprise Micro 5.5` became `SUSE Linux Micro 6.1`
  { name: 'SLE Micro', pattern: /^SUSE Linux (?:Enterprise )?Micro (\d+\.\d+)/ },
  // SLES 15 reports its service pack, i.e. `SUSE Linux Enterprise Server 15 SP6`,
  // which is how the matrix spells it too
  { name: 'SLES', pattern: /^SUSE Linux Enterprise Server (\d+\.\d+|\d+ SP\d+)/ },
  { name: 'Ubuntu', pattern: /^Ubuntu (\d+\.\d+)/ }
];

// Name and release of an OS the matrix knows about, i.e. `Ubuntu 24.04.2 LTS`
// -> `{ name: 'Ubuntu', release: '24.04' }`.
function osRelease(osImage?: string): { name: string; release: string } | undefined {
  for (const { name, pattern } of OS_PATTERNS) {
    const parsed = (osImage || '').match(pattern);

    if (parsed) {
      return { name, release: parsed[1] };
    }
  }

  return undefined;
}

// Newest patch release of a Rancher minor version, i.e. `2.14` -> `2.14.5`. SUSE
// recommends upgrading to the newest release, so that is what the nodes have to
// be supported by.
function latestPatch(matrix: Record<string, unknown>, minor: string): string | undefined {
  return Object.keys(matrix)
    .filter((version) => version.startsWith(`${minor}.`))
    .sort((a, b) => (versionNumber(b) || 0) - (versionNumber(a) || 0))[0];
}

// One warning per OS release that the Rancher version upgraded to no longer supports.
function osWarnings(nodes: any[], provider: string, rancherTo: string): UpgradeWarning[] {
  const matrix = OS_MATRIX[provider];
  const rancherVersion = matrix ? latestPatch(matrix, rancherTo) : undefined;
  const supported = rancherVersion ? matrix[rancherVersion] : undefined;

  if (!supported) {
    return [];
  }

  // One entry per unsupported OS release, i.e. `{ 'Ubuntu 20.04': { name: 'Ubuntu',
  // release: '20.04', nodeNames: ['node-1', 'node-2'] } }`
  const unsupported: Record<string, { name: string; release: string; nodeNames: string[] }> = {};

  nodes.forEach((node) => {
    const os = osRelease(node.status?.nodeInfo?.osImage);

    if (!os || supported[os.name]?.includes(os.release)) {
      return;
    }

    const key = `${os.name} ${os.release}`;
    const seen = unsupported[key] || { ...os, nodeNames: [] };

    unsupported[key] = { ...seen, nodeNames: [...seen.nodeNames, node.metadata?.name] };
  });

  return Object.entries(unsupported).map(([os, { name, nodeNames }]) => {
    const releases = supported[name];
    const supports = releases
      ? `Rancher ${rancherVersion} supports ${name} ${releases.join(', ')}.`
      : `Rancher ${rancherVersion} does not support ${name} at all.`;

    return {
      title: `${os} is not supported by Rancher ${rancherVersion} with ${PROVIDER_LABELS[provider]}`,
      description: `${nodeNames.join(', ')} ${nodeNames.length === 1 ? 'runs' : 'run'} ${os}. ${supports} Upgrade the operating system of those nodes before upgrading Rancher to ${rancherTo}.`
    };
  });
}

// Rancher is upgraded one minor version at a time as well, so the warnings are
// about the version it runs now. The nodes are only known when the dialog is
// opened, so the OS check is skipped for the cluster list.
export function rancherPlan(version?: string, provider = '', nodes: any[] = []): RancherPlan | undefined {
  const parsed = (version || '').match(/^v?(\d+)\.(\d+)\./);

  if (!parsed) {
    return undefined;
  }

  const from = `${parsed[1]}.${parsed[2]}`;
  const to = `${parsed[1]}.${Number(parsed[2]) + 1}`;
  return { from, to, warnings: osWarnings(nodes, provider, to) };
}

export function upgradePlan(
  versionStr?: string,
  rancherVersionStr?: string,
  nodes: any[] = []
): UpgradePlan | undefined {
  const parsed = (versionStr || '').match(/^v?(\d+)\.(\d+)\./);

  if (!parsed) {
    return undefined;
  }

  const version = versionNumber(versionStr || '');
  if (version === undefined) {
    return undefined;
  }

  const warnings: UpgradeWarning[] = [];
  const provider = providerFor(versionStr || '');
  switch (provider) {
    case 'rke2':
      if (version < 1320000 || (1320000 <= version && version < 1321100)) {
        warnings.push({
          title: 'Upgrade to RKE2 v1.32.11+rke2r1 or later before moving to a release with etcd 3.6',
          description:
            'etcd 3.5 releases older than v3.5.24 hit a known issue when they are upgraded to etcd 3.6. RKE2 v1.32.10+rke2r1 and earlier ship etcd v3.5.21 or older, while RKE2 v1.32.11+rke2r1 ships etcd v3.5.25. Upgrade to RKE2 v1.32.11+rke2r1 or later first, then continue to a release that ships etcd 3.6.',
          url: 'https://etcd.io/blog/2025/upgrade_from_3.5_to_3.6_issue_followup/'
        });
      }
      if (1330000 <= version && version < 1330700) {
        warnings.push({
          title: 'Upgrade to RKE2 v1.33.7+rke2r1 or later before moving to a release with etcd 3.6',
          description:
            'etcd 3.5 releases older than v3.5.24 hit a known issue when they are upgraded to etcd 3.6. RKE2 v1.33.6+rke2r1 and earlier ship an etcd 3.5 release older than that. Upgrade to RKE2 v1.33.7+rke2r1 or later first, then continue to a release that ships etcd 3.6.',
          url: 'https://etcd.io/blog/2025/upgrade_from_3.5_to_3.6_issue_followup/'
        });
      }
      break;
    case 'k3s':
      if (version < 1320000 || (1320000 <= version && version < 1321100)) {
        warnings.push({
          title: 'Upgrade to K3s v1.32.11+k3s1 or later before moving to a release with etcd 3.6',
          description:
            'etcd 3.5 releases older than v3.5.24 hit a known issue when they are upgraded to etcd 3.6. K3s v1.32.10+k3s1 and earlier ship an etcd 3.5 release older than that. Upgrade to K3s v1.32.11+k3s1 or later first, then continue to a release that ships etcd 3.6.',
          url: 'https://etcd.io/blog/2025/upgrade_from_3.5_to_3.6_issue_followup/'
        });
      }
      if (1330000 <= version && version < 1330700) {
        warnings.push({
          title: 'Upgrade to K3s v1.33.7+k3s1 or later before moving to a release with etcd 3.6',
          description:
            'etcd 3.5 releases older than v3.5.24 hit a known issue when they are upgraded to etcd 3.6. K3s v1.33.6+k3s1 and earlier ship an etcd 3.5 release older than that. Upgrade to K3s v1.33.7+k3s1 or later first, then continue to a release that ships etcd 3.6.',
          url: 'https://etcd.io/blog/2025/upgrade_from_3.5_to_3.6_issue_followup/'
        });
      }
      break;
    default:
      break;
  }

  return {
    provider: provider,
    from: `${parsed[1]}.${parsed[2]}`,
    to: `${parsed[1]}.${Number(parsed[2]) + 1}`,
    warnings: warnings,
    rancher: rancherPlan(rancherVersionStr, provider, nodes)
  };
}

export function clusterVersion(cluster: any): string | undefined {
  return cluster?.kubernetesVersionRaw || cluster?.kubernetesVersion;
}

// `store` is the root store, the same one the cluster list reads the cached nodes
// from. Reading them through the cluster model's $rootGetters instead fails when
// Rancher still holds an older build of this extension's store module.
export async function showUpgradeWarnings(cluster: any, store: any): Promise<void> {
  const clusterId = mgmtClusterIdFor(cluster);
  let nodes: any[] = [];

  if (clusterId) {
    // Usually already cached by the cluster list, this only waits when it is not
    await store.dispatch(`${SUPPORTABILITY_REVIEW_STORE}/fetchNodes`, clusterId);

    const cached = store.getters[`${SUPPORTABILITY_REVIEW_STORE}/nodes`]?.(clusterId);

    nodes = cached?.nodes || (cached ? [] : await fetchClusterNodes(store.dispatch, clusterId));
  }

  cluster.$dispatch('promptModal', {
    component: 'SrUpgradeWarnings',
    componentProps: {
      clusterName: cluster.nameDisplay,
      plan: upgradePlan(clusterVersion(cluster), rancherVersion(cluster.$rootGetters), nodes)
    },
    closeOnClickOutside: true,
    modalWidth: '600px'
  });
}

export function registerUpgradeWarningColumn(plugin: IPlugin): void {
  plugin.register('dialog', 'SrUpgradeWarnings', () => import('../components/SrUpgradeWarnings.vue'));
  plugin.register('formatters', 'KubernetesUpgradeWarning', () => import('../components/KubernetesUpgradeWarning.vue'));

  const column = {
    name: 'k8s-upgrade-warning',
    labelKey: 'tableHeaders.k8sUpgradeWarning',
    formatter: 'KubernetesUpgradeWarning',
    search: false,
    sort: false,
    width: 130
  };

  plugin.addTableColumn(TableColumnLocation.RESOURCE, CLUSTER_LIST, column, column);
}

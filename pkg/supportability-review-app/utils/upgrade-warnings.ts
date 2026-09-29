import { IPlugin, TableColumnLocation } from '@shell/core/types';
import { providerFor } from './k8s-eol-column';

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
};

export function upgradePlan(versionStr?: string): UpgradePlan | undefined {
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
    warnings: warnings
  };
}

export function clusterVersion(cluster: any): string | undefined {
  return cluster?.kubernetesVersionRaw || cluster?.kubernetesVersion;
}

export function showUpgradeWarnings(cluster: any): void {
  cluster.$dispatch('promptModal', {
    component: 'SrUpgradeWarnings',
    componentProps: {
      clusterName: cluster.nameDisplay,
      plan: upgradePlan(clusterVersion(cluster))
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

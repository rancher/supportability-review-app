import { providerFor } from './k8s-lifecycle';
import { Rancher2K8s } from './helper-data';

/** Kubernetes minor versions a provider supports, i.e. `{ min: '1.31', max: '1.34' }` */
export type K8sRange = { min: string; max: string };

export type KubernetesSupport = {
  state: 'supported' | 'unsupported' | 'unknown';
  /** Rancher version the ranges belong to, i.e. `2.13.3` */
  rancher?: string;
  /** Provider the range belongs to, i.e. `rke2` */
  provider?: string;
  /** Kubernetes minor version the cluster runs, i.e. `1.32` */
  minor?: string;
  range?: K8sRange;
};

const HOSTED_PROVIDERS = ['aks', 'eks', 'gke'];

/** `v2.13.3`, `2.13.3-rc1` -> `2.13.3` */
export function rancherPatchVersion(version?: string): string | undefined {
  return (version || '').match(/^v?(\d+\.\d+\.\d+)/)?.[1];
}

/** `1.32` -> 1032, so minor versions compare as numbers (`1.9` < `1.10`) */
function minorNumber(minor: string): number {
  const [major, sub] = minor.split('.').map(Number);

  return major * 1000 + sub;
}

/**
 * The provider of the cluster as rancher2k8s.json names it. RKE2, K3s and RKE1
 * are told apart by the Kubernetes version; hosted clusters by the provider
 * Rancher reports (`status.provider` of the management cluster).
 */
export function supportProviderFor(version: string, cluster: any): string | undefined {
  const provider = providerFor(version);

  if (provider !== 'kubernetes') {
    return provider;
  }

  const hosted = (cluster?.status?.provider || '').toLowerCase();

  return HOSTED_PROVIDERS.includes(hosted) ? hosted : undefined;
}

export function kubernetesSupport(
  cluster: any,
  rancherVersion: string | undefined,
  matrix: Rancher2K8s
): KubernetesSupport {
  const version = cluster?.kubernetesVersionRaw || '';
  const minor = version.match(/^v?(\d+\.\d+)\./)?.[1];
  const rancher = rancherPatchVersion(rancherVersion);
  const provider = minor ? supportProviderFor(version, cluster) : undefined;
  const range: K8sRange | undefined = rancher && provider ? matrix?.[rancher]?.[provider] : undefined;

  if (!minor || !range?.min || !range?.max) {
    return { state: 'unknown', rancher, provider, minor };
  }

  const n = minorNumber(minor);
  const supported = n >= minorNumber(range.min) && n <= minorNumber(range.max);

  return { state: supported ? 'supported' : 'unsupported', rancher, provider, minor, range };
}

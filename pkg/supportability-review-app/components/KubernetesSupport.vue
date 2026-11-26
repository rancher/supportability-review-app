<script>
import { BadgeState } from '@components/BadgeState';
import { getVersionInfo } from '@shell/utils/version';
import { helperData } from '../utils/helper-data';
import { kubernetesSupport } from '../utils/k8s-support';
import { SUPPORTABILITY_REVIEW_STORE } from '../config/types';

// How the providers of rancher2k8s.json are spelled in the tooltip
const PROVIDER_LABELS = { rke: 'RKE', rke2: 'RKE2', k3s: 'K3s', aks: 'AKS', eks: 'EKS', gke: 'GKE' };

const COLORS = { supported: 'bg-success', unsupported: 'bg-error' };

// Whether the cluster's Kubernetes version is supported by the running Rancher
// version, per rancher2k8s.json served by the operator. The data is loaded by
// the page, this only reads it.
export default {
  name: 'KubernetesSupport',
  components: { BadgeState },
  props: {
    row: {
      type: Object,
      default: null
    }
  },
  computed: {
    record() {
      return this.$store.getters[`${SUPPORTABILITY_REVIEW_STORE}/helperData`]?.('rancher2k8s');
    },
    support() {
      return kubernetesSupport(
        this.row,
        getVersionInfo(this.$store).fullVersion,
        helperData(this.$store.getters, 'rancher2k8s')
      );
    },
    color() {
      return COLORS[this.support.state];
    },
    label() {
      return this.t(`sr.k8sSupport.${this.support.state}`);
    },
    tooltip() {
      const { state, rancher, provider, minor, range } = this.support;

      if (state !== 'unknown') {
        return this.t('sr.k8sSupport.tooltip', {
          rancher,
          provider: PROVIDER_LABELS[provider] || provider,
          min: range.min,
          max: range.max
        });
      }
      if (!minor) {
        return this.t('sr.k8sSupport.noVersionTooltip');
      }
      if (!this.record?.data) {
        return this.t('sr.k8sSupport.noDataTooltip');
      }
      // i.e. RKE1 clusters, which Rancher 2.12+ no longer lists
      if (!provider || (rancher && this.record.data[rancher])) {
        return this.t('sr.k8sSupport.noProviderTooltip');
      }

      return this.t('sr.k8sSupport.noRancherTooltip', { rancher: rancher || getVersionInfo(this.$store).fullVersion });
    }
  }
};
</script>

<template>
  <div v-clean-tooltip="{ content: tooltip, placement: 'left' }" class="badge-compat">
    <BadgeState v-if="color" :color="color" :label="label" />
    <span v-else-if="record && record.pending && !record.data" class="text-muted">—</span>
    <span v-else class="text-muted">{{ label }}</span>
  </div>
</template>

<style lang="scss" scoped>
// The bundled BadgeState colors via `--*-badge` / `--on-*-banner`, which only Rancher 2.13+ themes define.
// Fall back to the older theme variables so the badge is colored on Rancher 2.12 as well.
.badge-compat {
  :deep(.badge-state.bg-error) {
    color: var(--on-error-banner, var(--error-text));
    background: var(--error-badge, var(--error));
  }
}
</style>

<script>
import { BadgeState } from '@components/BadgeState';
import { kubernetesLifecycle } from '../utils/k8s-eol-column';
import { helperData } from '../utils/helper-data';
import { SUPPORTABILITY_REVIEW_STORE } from '../config/types';

const CRITICAL_DAYS = 30;
const WARNING_DAYS = 90;

export default {
  name: 'KubernetesEol',
  components: { BadgeState },
  props: {
    row: {
      type: Object,
      default: null
    }
  },
  computed: {
    lifecycle() {
      return kubernetesLifecycle(
        this.row?.kubernetesVersionRaw || this.row?.kubernetesVersion,
        helperData(this.$store.getters, 'eom-eol')
      );
    },
    daysToEol() {
      return this.lifecycle?.daysToEol;
    },
    color() {
      if (this.daysToEol <= CRITICAL_DAYS) {
        return 'bg-error';
      }
      if (this.daysToEol <= WARNING_DAYS) {
        return 'bg-warning';
      }

      return 'bg-success';
    },
    // Days left until end of life, i.e. `283 days`, or days since it passed, i.e. `-72 days`
    label() {
      if (!this.lifecycle) {
        return this.t('sr.k8sEol.none');
      }
      if (this.daysToEol === undefined) {
        return this.t('sr.k8sEol.unknown');
      }

      return this.t('sr.k8sEol.days', { days: this.daysToEol });
    },
    tooltip() {
      if (!this.lifecycle) {
        return this.t('sr.k8sEol.noDataTooltip');
      }

      const { provider, minor, eom, eol } = this.lifecycle;

      if (!eol) {
        return this.t('sr.k8sEol.unknownTooltip');
      }

      return this.t('sr.k8sEol.tooltip', { provider, minor, eol, eom: eom || '—' });
    }
  },
  created() {
    this.$store.dispatch(`${SUPPORTABILITY_REVIEW_STORE}/fetchHelperData`, 'eom-eol');
  }
};
</script>

<template>
  <div v-clean-tooltip="{ content: tooltip, placement: 'left' }" class="badge-compat">
    <BadgeState v-if="daysToEol !== undefined" :color="color" :label="label" />
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

  :deep(.badge-state.bg-warning) {
    color: var(--on-warning-banner, var(--warning-text));
    background: var(--warning-badge, var(--warning));
  }
}
</style>

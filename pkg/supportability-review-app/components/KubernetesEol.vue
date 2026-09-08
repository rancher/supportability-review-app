<script>
import { BadgeState } from '@components/BadgeState';
import { kubernetesLifecycle } from '../utils/k8s-eol-column';

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
      return kubernetesLifecycle(this.row?.kubernetesVersionRaw || this.row?.kubernetesVersion);
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

      const { distro, minor, eom, eol } = this.lifecycle;

      if (!eol) {
        return this.t('sr.k8sEol.unknownTooltip');
      }

      return this.t('sr.k8sEol.tooltip', { distro, minor, eol, eom: eom || '—' });
    }
  }
};
</script>

<template>
  <div v-clean-tooltip="{ content: tooltip, placement: 'left' }">
    <BadgeState v-if="daysToEol !== undefined" :color="color" :label="label" />
    <span v-else class="text-muted">{{ label }}</span>
  </div>
</template>

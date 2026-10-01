<script>
import { clusterVersion, rancherVersion, showUpgradeWarnings, upgradePlan } from '../utils/upgrade-warnings';
import { mgmtClusterIdFor } from '../utils/cert-expiry';
import { SUPPORTABILITY_REVIEW_STORE } from '../config/types';

export default {
  name: 'KubernetesUpgradeWarning',
  props: {
    row: {
      type: Object,
      default: null
    }
  },
  computed: {
    clusterId() {
      return mgmtClusterIdFor(this.row);
    },
    nodes() {
      return this.$store.getters[`${SUPPORTABILITY_REVIEW_STORE}/nodes`](this.clusterId)?.nodes || [];
    },
    plan() {
      return upgradePlan(clusterVersion(this.row), rancherVersion(this.$store.getters), this.nodes);
    },
    count() {
      return (this.plan?.warnings.length || 0) + (this.plan?.rancher?.warnings.length || 0);
    },
    tooltip() {
      return this.t('sr.upgradeWarning.tooltip', { count: this.count, from: this.plan?.from, to: this.plan?.to });
    }
  },
  created() {
    this.$store.dispatch(`${SUPPORTABILITY_REVIEW_STORE}/fetchNodes`, this.clusterId);
  },
  methods: {
    // stop the click so it doesn't also toggle the row's selection
    open(event) {
      event.stopPropagation();
      showUpgradeWarnings(this.row, this.$store);
    }
  }
};
</script>

<template>
  <button
    v-if="count"
    v-clean-tooltip="{ content: tooltip, placement: 'left' }"
    type="button"
    class="upgrade-warning"
    :aria-label="tooltip"
    @click="open">
    <i class="icon icon-warning icon-lg text-error" />
  </button>
  <span v-else class="text-muted">{{ t('sr.upgradeWarning.none') }}</span>
</template>

<style lang="scss" scoped>
.upgrade-warning {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>

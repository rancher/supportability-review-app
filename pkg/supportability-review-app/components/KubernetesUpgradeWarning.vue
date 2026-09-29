<script>
import { clusterVersion, showUpgradeWarnings, upgradePlan } from '../utils/upgrade-warnings';

export default {
  name: 'KubernetesUpgradeWarning',
  props: {
    row: {
      type: Object,
      default: null
    }
  },
  computed: {
    plan() {
      return upgradePlan(clusterVersion(this.row));
    },
    count() {
      return this.plan?.warnings.length || 0;
    },
    tooltip() {
      return this.t('sr.upgradeWarning.tooltip', { count: this.count, from: this.plan?.from, to: this.plan?.to });
    }
  },
  methods: {
    // stop the click so it doesn't also toggle the row's selection
    open(event) {
      event.stopPropagation();
      showUpgradeWarnings(this.row);
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
    <i class="icon icon-warning icon-lg text-warning" />
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

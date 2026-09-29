<script>
import { Card } from '@components/Card';

export default {
  name: 'SrUpgradeWarnings',

  components: { Card },

  props: {
    // Passed by PromptModal to every dialog; declared so they don't fall
    // through onto the root element as attributes
    resources: {
      type: Array,
      default: () => []
    },

    registerBackgroundClosing: {
      type: Function,
      default: () => {}
    },

    clusterName: {
      type: String,
      default: ''
    },

    // Result of upgradePlan(), undefined when the cluster reports no version
    plan: {
      type: Object,
      default: undefined
    }
  },

  emits: ['close']
};
</script>

<template>
  <Card class="sr-upgrade-warnings" :show-highlight-border="false">
    <template #title>
      <h4 class="text-default-text">
        {{ t('sr.upgradeWarning.title', { cluster: clusterName }) }}
      </h4>
    </template>

    <template #body>
      <p v-if="!plan" class="text-muted">
        {{ t('sr.upgradeWarning.noVersion') }}
      </p>
      <template v-else>
        <p class="mb-10">
          {{ t('sr.upgradeWarning.summary', { provider: plan.provider, from: plan.from, to: plan.to }) }}
        </p>
        <p v-if="!plan.warnings.length" class="text-muted">
          {{ t('sr.upgradeWarning.noWarnings') }}
        </p>
        <ul v-else class="warnings">
          <li v-for="(warning, i) in plan.warnings" :key="i" class="mb-10">
            <i class="icon icon-warning text-warning mr-5" />
            <strong>{{ warning.title }}</strong>
            <p>{{ warning.description }}</p>
            <a v-if="warning.url" :href="warning.url" target="_blank" rel="noopener noreferrer nofollow">
              {{ t('sr.upgradeWarning.learnMore') }}
              <i class="icon icon-external-link" />
            </a>
          </li>
        </ul>
      </template>
    </template>

    <template #actions>
      <div class="buttons">
        <button class="btn role-primary" @click="$emit('close')">
          {{ t('generic.close') }}
        </button>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.sr-upgrade-warnings {
  margin: 0;
}

.warnings {
  margin: 0;
  padding: 0;
  list-style: none;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>

<script>
import { Card } from '@components/Card';

const RANCHER_UPGRADE_KB_URL =
  'https://support.scc.suse.com/s/kb/Rancher-Can-Rancher-Support-validate-our-planned-upgrade';

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

  emits: ['close'],

  computed: {
    // One block per thing that gets upgraded: the cluster itself, then Rancher
    sections() {
      if (!this.plan) {
        return [];
      }

      const { provider, from, to, warnings, rancher } = this.plan;
      const out = [{ summary: this.t('sr.upgradeWarning.summary', { provider, from, to }), warnings }];

      if (rancher) {
        out.push({
          summary: this.t('sr.upgradeWarning.rancherSummary', { from: rancher.from, to: rancher.to }),
          warnings: rancher.warnings,
          kbUrl: RANCHER_UPGRADE_KB_URL
        });
      }

      return out;
    }
  }
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
      <div v-for="(section, s) in sections" :key="s" class="section">
        <p class="mb-10">
          {{ section.summary }}
        </p>
        <p v-if="!section.warnings.length" class="text-muted">
          {{ t('sr.upgradeWarning.noWarnings') }}
        </p>
        <ul v-else class="warnings">
          <li v-for="(warning, i) in section.warnings" :key="i" class="mb-10">
            <i class="icon icon-warning text-error mr-5" />
            <strong>{{ warning.title }}</strong>
            <p>{{ warning.description }}</p>
            <a v-if="warning.url" :href="warning.url" target="_blank" rel="noopener noreferrer nofollow">
              {{ t('sr.upgradeWarning.learnMore') }}
              <i class="icon icon-external-link" />
            </a>
          </li>
        </ul>
        <p
          v-if="section.kbUrl"
          v-clean-html="t('sr.upgradeWarning.rancherKb', { url: section.kbUrl }, true)"
          class="mt-10" />
      </div>
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

.section:not(:last-child) {
  margin-bottom: 20px;
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

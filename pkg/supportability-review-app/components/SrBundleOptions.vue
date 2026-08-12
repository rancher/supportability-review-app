<script>
import { Card } from '@components/Card';
import { LabeledInput } from '@components/Form/LabeledInput';

const DEFAULT_DAYS = 7;
const MAX_DAYS = 365;

export default {
  name: 'SrBundleOptions',

  components: { Card, LabeledInput },

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

    // Called with the chosen number of days when the user confirms
    onSubmit: {
      type: Function,
      default: () => {}
    },

    // Called when the user cancels the dialog
    onCancel: {
      type: Function,
      default: () => {}
    }
  },

  emits: ['close'],

  data() {
    return { days: DEFAULT_DAYS };
  },

  methods: {
    cancel() {
      this.onCancel();
      this.$emit('close');
    },

    submit() {
      const days = Math.min(MAX_DAYS, Math.max(1, Math.floor(Number(this.days)) || DEFAULT_DAYS));

      // Don't emit 'close' here: the caller responds to onSubmit by immediately
      // dispatching promptModal again with the progress dialog, which swaps this
      // component out in place. Closing first (and reopening a beat later) races
      // PromptModal's open/close state and can leave the progress dialog unshown.
      this.onSubmit(days);
    }
  }
};
</script>

<template>
  <Card class="sr-bundle-options" :show-highlight-border="false">
    <template #title>
      <h4 class="text-default-text">
        {{ t('sr.supportBundle.action') }}
      </h4>
    </template>

    <template #body>
      <LabeledInput
        v-model:value.number="days"
        type="number"
        min="1"
        max="365"
        :label="t('sr.supportBundle.daysLabel')" />
    </template>

    <template #actions>
      <div class="buttons">
        <button class="btn role-secondary mr-10" @click="cancel">
          {{ t('generic.cancel') }}
        </button>
        <button class="btn role-primary" @click="submit">
          {{ t('sr.supportBundle.collect') }}
        </button>
      </div>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.sr-bundle-options {
  margin: 0;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>

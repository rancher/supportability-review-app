<script>
import { mapGetters } from 'vuex';

export default {
  name: 'SrCollecting',

  props: {
    // Current phase of the collection, already translated by the caller
    message: {
      type: String,
      default: ''
    },

    // Passed by PromptModal to every dialog; declared so they don't fall
    // through onto the root element as attributes
    resources: {
      type: Array,
      default: () => []
    },

    registerBackgroundClosing: {
      type: Function,
      default: () => {}
    }
  },

  // Passed by PromptModal to every dialog; declaring it stops Vue from
  // warning about an extraneous non-emits "close" listener.
  emits: ['close'],

  computed: { ...mapGetters({ t: 'i18n/t' }) }
};
</script>

<template>
  <!--
    tabindex makes this a tabbable node: PromptModal always activates a focus trap,
    which errors out if the dialog has none. This one has no buttons to focus.
    aria-live announces the phase changes to screen readers.
  -->
  <div class="sr-collecting" tabindex="0" role="status" aria-live="polite">
    <h4 class="sr-collecting__title">
      {{ t('sr.supportBundle.title') }}
    </h4>
    <div class="sr-collecting__status">
      <i class="icon icon-spinner icon-spin" />
      <span>{{ message }}</span>
    </div>
    <p class="sr-collecting__hint text-muted">
      {{ t('sr.supportBundle.hint') }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.sr-collecting {
  padding: 20px;

  // It's only focusable to satisfy the focus trap, so don't show a focus ring
  &:focus {
    outline: none;
  }

  &__title {
    margin-bottom: 15px;
  }

  &__status {
    align-items: center;
    display: flex;

    .icon {
      margin-right: 10px;
    }
  }

  &__hint {
    margin: 10px 0 0 0;
  }
}
</style>

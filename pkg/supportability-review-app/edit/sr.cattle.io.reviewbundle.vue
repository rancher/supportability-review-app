<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import Tolerations from '@shell/components/form/Tolerations';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
export default {
  name: 'ReviewBundleEditView',
  components: {
    Checkbox,
    CruResource,
    Loading,
    Tolerations,
    LabeledInput,
    TextAreaAutoGrow
  },
  mixins: [CreateEditView],
  props: {
    value: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      required: true
    },
    resource: {
      type: String,
      required: true
    }
  },
  data() {
    if (!this.value.metadata.name) {
      this.value.metadata.generateName = 'review-bundle-';
    }
    if (!this.value.spec) {
      this.value.spec = {};
      this.value.spec.analyzeClusters = ['local'];
    }
    return {
      analyzeLocalOnly: true,
      description: '',
      customName: '',
      dropdownOptions: ['review-bundle', 'custom-bundle'],
      showDropdown: false
    };
  },
  watch: {
    analyzeLocalOnly(neu) {
      if (neu) {
        this.value.spec.analyzeClusters = ['local'];
      } else {
        this.value.spec.analyzeClusters = [];
      }
    }
  },
  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },
    isView() {
      return this.mode !== _CREATE && this.mode !== _EDIT;
    },
    editorMode() {
      if (!this.isView) {
        return EDITOR_MODES.EDIT_CODE;
      }

      return EDITOR_MODES.VIEW_CODE;
    },
    hasBeenCreated() {
      return !!this.value.id;
    }
  },
  methods: {
    setDefaultName() {
      this.value.metadata.generateName = this.value.metadata.generateName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/^-+/, '')
        .slice(0, 30);

      if (!this.value.metadata.generateName.trim()) {
        this.value.metadata.generateName = 'review-bundle-';
      }
      if (!this.value.metadata.generateName.endsWith('-')) {
        this.value.metadata.generateName += '-';
      }
    }
  }
};
</script>

<template>
  <Loading v-if="!value" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :can-yaml="true"
    :mode="mode"
    :resource="value"
    :errors="errors"
    :validation-passed="isFormValid"
    @error="(e) => (errors = e)"
    @finish="save"
    @cancel="done">
    <div>
      <h2 class="bundle-name mb-200">Bundle Name</h2>
      <LabeledInput
        v-model:value="value.metadata.generateName"
        label="Enter Bundle Name"
        subLabel="Use lowercase letters, max 30 characters. Spaces will be replaced with '-' automatically."
        placeholder="review-bundle"
        :maxlength="30"
        @blur="setDefaultName" />
      <h2 class="bundle-description mb-200">Bundle Description</h2>
      <TextAreaAutoGrow placeholder="Enter bundle description" autocapitalize="off" />
    </div>
    <div v-if="isCreate" class="input-wrapper">
      <h2 class="analysis-label mt-20" for="analysis">Analysis</h2>
      <div class="col span-8 mb-20">
        <Checkbox v-model:value="analyzeLocalOnly" :label="t('sr.reviewBundle.analyzeLocalOnly')" :mode="mode" />
      </div>

      <h2 class="toleration-label" for="tolerations">Tolerations</h2>
      <Tolerations v-model:value="value.spec.tolerations" :mode="mode" />
    </div>
  </CruResource>
</template>
<style scoped>
.bundle-description {
  margin-top: 40px;
}
.analysis-label {
  font-size: 21px;
  color: --body-text;
}
.toleration-label {
  font-size: 21px;
}
</style>

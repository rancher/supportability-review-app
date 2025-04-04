<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { Banner } from '@components/Banner';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import Tolerations from '@shell/components/form/Tolerations';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import TextAreaAutoGrow from '@components/Form/TextArea/TextAreaAutoGrow.vue';
export default {
  name: 'ReviewBundleEditView',
  components: {
    Banner,
    Checkbox,
    CruResource,
    LabeledInput,
    Loading,
    Tabbed,
    Tab,
    TextAreaAutoGrow,
    Tolerations
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
    }
    this.value.spec.analyzeClusters = ['local'];
    this.value.spec.sonobuoyNamespace = 'sonobuoy';
    if (this.isCreate()) {
      this.createApiToken()
        .then((token) => {
          this.value.spec.token = token;
        })
        .catch((error) => {
          console.error(error);
        });
    }
    return {
      analyzeLocalOnly: true,
      description: '',
      customName: '',
      dropdownOptions: ['review-bundle', 'custom-bundle'],
      showDropdown: false
    };
  },
  computed: {
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
  watch: {
    analyzeLocalOnly(neu) {
      if (neu) {
        this.value.spec.analyzeClusters = ['local'];
      } else {
        this.value.spec.analyzeClusters = [];
      }
    }
  },
  methods: {
    async createApiToken() {
      const maxTTLMsec = 4 * 60 * 60 * 1000; // 4 hours

      const token = await this.$store.dispatch('rancher/create', {
        type: NORMAN.TOKEN,
        ttl: maxTTLMsec,
        description: 'Supportability Review'
      });

      const created = await token.save();

      return created.token;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
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
    },
    setDefaultSonobuoyNamespace() {
      if (!this.value.spec.sonobuoyNamespace.trim()) {
        this.value.spec.sonobuoyNamespace = 'sonobuoy';
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
    <Tabbed>
      <Tab label-key="sr.supportabilityReview.basic" name="basic-config" :weight="3">
        <div>
          <h2 class="mb-200">Collector Config</h2>

          <h4 class="mb-200">Bundle Name</h4>
          <LabeledInput
            v-model:value="value.metadata.generateName"
            label="Enter Bundle Name"
            placeholder="review-bundle"
            :maxlength="30"
            @blur="setDefaultName" />
          <Banner class="mb-10" color="info">
            <div v-clean-html="t('sr.supportabilityReview.bundleNameRestriction', {}, true)" />
          </Banner>
        </div>
      </Tab>
      <Tab label-key="sr.supportabilityReview.advanced" name="advanced-config" :weight="2">
        <div>
          <h2 class="mb-200">Collector Config</h2>

          <h4 class="mt-10 mb-200">Sonobuoy Namespace</h4>
          <LabeledInput
            v-model:value="value.spec.sonobuoyNamespace"
            placeholder="sonobuoy"
            :maxlength="64"
            @blur="setDefaultSonobuoyNamespace" />

          <h4 class="mt-10 mb-200" for="tolerations">Tolerations</h4>
          <Tolerations v-model:value="value.spec.tolerations" :mode="mode" />

          <h4 class="mt-10 mb-200">Bundle Description</h4>
          <TextAreaAutoGrow
            minHeight="50"
            placeholder="Enter bundle description"
            autocapitalize="off"
            spellcheck="false" />
        </div>
        <div>
          <h2 class="mt-10 mb-200">Analyzer Config</h2>

          <div class="col span-8 mb-20">
            <Checkbox v-model:value="analyzeLocalOnly" :label="t('sr.reviewBundle.analyzeLocalOnly')" :mode="mode" />
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>
<style scoped></style>

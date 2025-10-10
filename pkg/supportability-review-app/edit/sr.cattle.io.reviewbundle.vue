<script>
import CruResource from '@shell/components/CruResource.vue';
import Loading from '@shell/components/Loading.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import Tolerations from '@shell/components/form/Tolerations';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import { NORMAN } from '@shell/config/types';
import { Banner } from '@components/Banner';
import { Checkbox } from '@components/Form/Checkbox';
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
    if (this.mode === _CREATE) {
      if (!this.value.metadata.name) {
        this.value.metadata.generateName = 'review-bundle-';
      }
      if (!this.value.spec) {
        this.value.spec = {};
      }
      this.value.spec.analyzeClusters = ['local'];
      this.value.spec.sonobuoyNamespace = 'sonobuoy';
      this.value.spec.enablePrivileged = false;
      this.value.spec.enableDataObfuscation = false;

      this.createApiToken()
        .then((token) => {
          this.value.spec.token = token;
        })
        .catch((error) => {
          console.error(error);
        });

      fetch('/v3/settings/server-url', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          this.value.spec.hostName = data.value;
        })
        .catch((error) => {
          console.error('Fetch error:', error);
        });

      fetch('/rancherversion', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.RancherPrime === 'false') {
            this.value.spec.collectClusters = ['local'];
            this.isPrime = false;
          } else {
            this.isPrime = true;
          }
        })
        .catch((error) => {
          console.error('Fetch error:', error);
        });
    }
    return {
      description: '',
      isPrime: true,
      generateName: 'review-bundle'
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
  watch: {},
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
    setDefaultName() {
      this.value.metadata.generateName = this.generateName
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
      <Tab label-key="sr.menuLabels.basic" name="basic-config" :weight="3">
        <div>
          <h2 class="mb-200">Collector Config</h2>

          <h4 class="mb-200">Bundle Name</h4>
          <LabeledInput
            v-model:value="generateName"
            label="Enter Bundle Name"
            placeholder="review-bundle"
            :maxlength="30"
            @blur="setDefaultName" />
          <Banner class="mb-10" color="info">
            <div v-clean-html="t('sr.menuLabels.bundleNameRestriction', {}, true)" />
          </Banner>
        </div>
      </Tab>
      <Tab label-key="sr.menuLabels.advanced" name="advanced-config" :weight="2">
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

          <h4 class="mt-10 mb-200">Security</h4>
          <Checkbox
            v-model:value="value.spec.enablePrivileged"
            v-model="value.spec.enablePrivileged"
            class="mb-10"
            :label="t('sr.menuLabels.enablePrivileged')" />
          <br />

          <Checkbox
            v-model:value="value.spec.enableDataObfuscation"
            v-model="value.spec.enableDataObfuscation"
            class="mb-10"
            :label="t('sr.menuLabels.enableDataObfuscation')" />

          <h4 class="mt-10 mb-200">Bundle Description</h4>
          <TextAreaAutoGrow
            minHeight="50"
            placeholder="Enter bundle description"
            autocapitalize="off"
            spellcheck="false" />
        </div>
      </Tab>
    </Tabbed>
    <Banner v-if="!isPrime" class="mb-10" color="info">
      <div v-clean-html="t('sr.menuLabels.forCommunityUser0', {}, true)" />
    </Banner>
    <Banner v-if="!isPrime" class="mb-10" color="info">
      <div v-clean-html="t('sr.menuLabels.forCommunityUser1', {}, true)" />
    </Banner>
  </CruResource>
</template>
<style scoped></style>

<script>
import Loading from '@shell/components/Loading.vue';
import CruResource from '@shell/components/CruResource.vue';
import CreateEditView from '@shell/mixins/create-edit-view';
import { _CREATE, _EDIT } from '@shell/config/query-params';
import Tolerations from '@shell/components/form/Tolerations';

export default {
  name: 'ReviewBundleEditView',
  components: {
    CruResource,
    Loading,
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
      this.value.spec.tolerations = [];
    }
    return {
      description: '',
      customName: '',
      dropdownOptions: ['review-bundle', 'custom-bundle'],
      showDropdown: false
    };
  },
  watch: {
    customName(newName) {
      // Automatically update the metadata.generateName field
      if (newName) {
        this.value.metadata.generateName = `${newName}-`;
        this.showDropdown = false;
      } else {
        this.value.metadata.generateName = 'review-bundle-';
        this.showDropdown = true;
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
    },
    customNameLength() {
      return this.customName.length;
    },
    descriptionLength() {
      return this.description.length;
    },
    isCustomNameValid() {
      return this.customName.length >= 0 && this.customName.length <= 30;
    },
    isDescriptionValid() {
      return this.description.length >= 0 && this.description.length <= 100;
    },
    isFormValid() {
      return this.isCustomNameValid && this.isDescriptionValid;
    }
  },
  methods: {
    selectOption(option) {
      this.customName = option;
      this.showDropdown = false;
    },
    handleClickOutside(event) {
      if (this.$refs.dropdown && !this.$refs.dropdown.contains(event.target)) {
        this.showDropdown = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
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
    <h1>EditView</h1>
    <!-- Bundle Name -->
    <div v-if="isCreate" class="input-wrapper">
      <label for="bundle-name">Bundle Name</label>
      <div :class="['name-container', { 'dropdown-active': showDropdown }]" ref="dropdown">
        <input
          id="bundle-name"
          type="text"
          v-model="customName"
          @focus="showDropdown = true"
          @input="showDropdown = false"
          placeholder="Enter bundle name" />
        <span class="char-count-name">{{ customName.length }}/30</span>
        <div v-if="showDropdown" class="dropdown">
          <div v-for="option in dropdownOptions" :key="option" @click="selectOption(option)" class="dropdown-item">
            {{ option }}
          </div>
        </div>
      </div>

      <p v-if="!isCustomNameValid" class="error-text">Bundle Name must be upto 30 characters.</p>

      <label for="tolerations">Tolerations</label>
      <Tolerations v-model="value.spec.tolerations" :mode="mode" />

      <label for="description">Description</label>
      <div class="textarea-container">
        <textarea id="description" v-model="description" placeholder="Enter bundle Description" />
        <span class="char-count-description">{{ description.length }}/100</span>
      </div>

      <p v-if="!isDescriptionValid" class="error-text">Description must be upto 100 characters.</p>
    </div>
  </CruResource>
</template>

<style scoped>
.name-container {
  position: relative;
  width: 320px;
}
.textarea-container {
  position: relative;
  width: 600px;
}
.char-count-name,
.char-count-description {
  position: absolute;
  bottom: 5px;
  right: 10px;
  font-weight: bold;
  font-size: 12px;
  color: #888;
}

.error-text {
  color: #f00;
  font-weight: bold;
}

label {
  font-weight: bold;
  font-size: 22px;
  display: block;
  margin-top: 20px;
}

input {
  padding: 10px;
  font-size: 16px;
  width: 320px;
  box-sizing: border-box;
  margin-bottom: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-family: Arial;
}

textarea {
  padding: 10px;
  font-size: 16px;
  width: 600px;
  box-sizing: border-box;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-family: Arial;
  resize: none;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #666;
}

input::placeholder,
textarea::placeholder {
  color: #999;
  font-style: italic;
  opacity: 0.7;
}

div[v-if='isCreate'] {
  padding: 20px;
  background-color: #a62d2d;
  border-radius: 10px;
  margin-top: 10px;
}
.dropdown {
  position: absolute;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  max-height: 150px;
  overflow-y: auto;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}
.dropdown-active {
  margin-bottom: 100px;
}
.dropdown-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}
.dropdown-item:hover {
  background-color: #777;
}
</style>

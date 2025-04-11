<script>
import ResourceList from '@shell/components/ResourceList/index.vue';
import { SUPPORTABILITY_REVIEW_CRD_IDS } from '../../config/types';

export default {
  name: 'ListSupportabilityReviewBundleResource',
  components: { ResourceList },
  data() {
    return {};
  },
  async fetch() {
    // needed to populate cluster name col on machine inventories list
    await this.$store.dispatch(`management/findAll`, { type: SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE });
  },
  computed: {}
};
</script>

<template>
  <ResourceList :has-advanced-filtering="advancedFilteringEnabled"></ResourceList>
</template>

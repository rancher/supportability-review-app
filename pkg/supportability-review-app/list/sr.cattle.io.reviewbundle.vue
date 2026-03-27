<script>
import Loading from '@shell/components/Loading';
import ResourceTable from '@shell/components/ResourceTable';

import { SUPPORTABILITY_REVIEW_CRD_IDS } from '../config/types';

export default {
  name: 'SrCattleIoReviewBundle',
  components: {
    Loading,
    ResourceTable
  },
  props: {
    resource: {
      type: String,
      required: true
    },
    schema: {
      type: Object,
      required: true
    }
  },
  async fetch() {
    await this.$store.dispatch(`management/findAll`, { type: SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE });
  },
  computed: {
    rows() {
      return this.$store.getters['management/all'](SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTable :schema="schema" :rows="rows" />
  </div>
</template>

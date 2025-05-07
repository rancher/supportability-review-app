<template>
  <div class="supportability-empty-dashboard">
    <i class="icon-service mb-30"></i>
    <h1 class="mb-2">Welcome to Supportability Review</h1>
    <p class="text-base mb-30">
      <span>Ensure your system design is stable, scalable, and support-ready.</span>
      <a href="https://www.suse.com/support/kb/doc/?id=000021242" target="_blank" rel="noopener noreferrer nofollow">
        Learn More
        <i class="icon icon-external-link ml-1"></i>
      </a>
    </p>
    <h3 class="text-sm mb-30">
      Supportability Review offers proactive support and ensures that your system complies with SUSE's best practices.
    </h3>
    <button v-if="bundleCount < 1" @click="goToReviewBundle" class="btn role-secondary">Get Started</button>
  </div>
</template>
<script>
import { SUPPORTABILITY_REVIEW_CRD_IDS } from '../config/types';
export default {
  name: 'DashboardView',
  methods: {
    goToReviewBundle() {
      this.$router.push({
        path: '/sr/c/_/sr.cattle.io.reviewbundle/create'
      });
    }
  },
  async fetch() {
    await this.$store.dispatch('management/findAll', { type: SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE });
  },
  computed: {
    bundleCount() {
      return this.$store.getters['management/all'](SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE).length;
    }
  }
};
</script>
<style scoped>
.supportability-empty-dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  min-height: 100%;
}

.supportability-empty-dashboard > p > span {
  color: var(--disabled-text);
}

.supportability-empty-dashboard > i {
  font-size: 100px;
  color: var(--disabled-text);
}
.supportability-empty-dashboard h3 {
  max-width: 600px;
  margin: 0 auto;
  white-space: normal;
  word-wrap: break-word;
}
</style>

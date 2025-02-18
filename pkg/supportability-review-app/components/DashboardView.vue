<template>
  <div class="dashboard-view">
    <section class="hero">
      <div class="icon-container">
        <i class="icon-service custom-icon"></i>
      </div>
      <div class="title">Supportability Review</div>
      <p class="tagline">Ensuring your system design is built on a solid, supportable foundation.</p>
    </section>

    <section class="content">
      <p>
        Supportability Review is a feature of
        <strong>Rancher Prime</strong>
        , offering proactive support and ensuring your system complies with SUSE’s best practices.
      </p>
    </section>

    <button class="get-started-btn" @click="goToReviewBundle">Get Started</button>
  </div>
</template>
<script>
export default {
  name: 'DashboardView',
  methods: {
    goToReviewBundle() {
      this.$router.push({
        path: '/c/_/sr/sr.cattle.io.reviewbundle/create'
      });
    }
  }
};
</script>
<style scoped>
.dashboard-view {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  text-align: center;
  font-family: sans-serif;
}

.icon-container {
  margin-bottom: 20px;
}

.custom-icon {
  font-size: 100px;
  opacity: 0.8;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  margin-bottom: 15px;
  font-weight: 400;
}

.tagline {
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: lighter;
}

.content p {
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 1.8;
  max-width: 800px;
}

.get-started-btn {
  padding: 0px 20px;
  font-size: 16px;
  border: 2px solid #1a73e8;
  background-color: transparent;
  color: #1a73e8;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.get-started-btn:hover {
  color: #ffffff;
}
</style>

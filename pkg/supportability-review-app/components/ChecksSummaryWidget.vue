<template>
  <div>
    <div class="main-heading">Summary of Checks</div>
    <div class="summary-wrapper">
      <div class="summary-card total-card">
        <div class="custom-border border-info">
          <div class="label">Total Checks</div>
          <div class="value">{{ info.checks_total }}</div>
        </div>
      </div>
      <div class="summary-card" v-for="(item, index) in summaryData" :key="index">
        <div :class="getBorderClass(index)" class="custom-border">
          <div class="label">{{ getLabel(index) }}</div>
          <div class="value">{{ item }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChecksSummaryWidget',
  props: {
    info: {
      type: Object,
      required: true
    }
  },
  computed: {
    summaryData() {
      return [this.info.checks_pass, this.info.checks_warn, this.info.checks_fail, this.info.checks_skip]
    }
  },
  methods: {
    getLabel(index) {
      const labels = ['Pass', 'Warn', 'Fail', 'Skip']
      return labels[index]
    },
    getBorderClass(index) {
      const classes = ['border-success', 'border-warning', 'border-danger', 'border-secondary']
      return classes[index]
    }
  }
}
</script>

<style scoped>
.main-heading {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-left: 30px;
  margin-top: 20px;
}

.summary-wrapper {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr; /* Total Checks larger */
  gap: 10px;
  width: 100%;
  padding: 30px;
  box-sizing: border-box;
}

.summary-card {
  width: 100%;
}

.custom-border {
  border-left: 5px solid;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 8px rgb(0, 0, 0, 0.1);
}

.border-info {
  border-color: #17a2b8;
}

.border-success {
  border-color: #28a745;
}

.border-warning {
  border-color: #ffc107;
}

.border-danger {
  border-color: #dc3545;
}

.border-secondary {
  border-color: #6c757d;
}

.label {
  font-size: 1rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #000;
}
</style>

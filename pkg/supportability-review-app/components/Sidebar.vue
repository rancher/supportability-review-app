<template>
  <div class="layout">
    <div class="fixed-column">
      <div class="cluster-type-name">Local Cluster Summary</div>
      <div class="circular-progress">
        <div class="circle-container">
          <svg viewBox="0 0 100 100" class="circular-svg">
            <circle class="background-circle" cx="50" cy="50" r="45" fill="none" stroke="#EAEAEA" stroke-width="5.5" />
            <circle
              class="progress-circle"
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#4caf50"
              stroke-width="7"
              stroke-dasharray="282.743"
              :stroke-dashoffset="strokeDashoffset"
              transform="rotate(-90 50 50)" />

            <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" class="circular-progress-text">
              {{ progressPercentage }}%
            </text>
          </svg>
        </div>
      </div>
      <p class="supportability-score">Supportability Score</p>
      <div class="checks-status">
        <p class="status-title">Checks Status:</p>
        <div class="status-row">
          <p class="status-label">Passed Checks</p>
          <p class="status-value">{{ this.summaryData.checks_pass }}/{{ this.summaryData.checks_total }}</p>
        </div>
        <div class="horizontal-progress">
          <div class="progress" :style="{ width: progressPassWidth + '%' }"></div>
        </div>

        <div class="status-row">
          <p class="status-label">Failed Checks</p>
          <p class="status-value">{{ this.summaryData.checks_fail }}/{{ this.summaryData.checks_total }}</p>
        </div>
        <div class="horizontal-progress">
          <div
            class="progress"
            :style="{
              width: progressFailWidth + '%',
              backgroundColor: '#f44336'
            }"></div>
        </div>

        <div class="status-row">
          <p class="status-label">Warning Checks</p>
          <p class="status-value">{{ this.summaryData.checks_warn }}/{{ this.summaryData.checks_total }}</p>
        </div>
        <div class="horizontal-progress">
          <div
            class="progress"
            :style="{
              width: progressWarnWidth + '%',
              backgroundColor: '#ff9800'
            }"></div>
        </div>
      </div>
      <div class="Cluster-type-heading">Cluster Details</div>

      <div class="cluster-logos">
        <div v-for="(cluster, index) in clusterData" :key="index">
          <div v-if="cluster.count > 0" class="cluster-item">
            <img :src="getClusterLogo(cluster.type)" alt="Logo" class="cluster-logo" />
            <p class="cluster-name">{{ getClusterTypeString(cluster.type) }}</p>
            <p class="cluster-count">{{ getClusterCountString(cluster.count) }}</p>
          </div>
        </div>
      </div>
      <div v-if="eom_eol.local.is_eol || eom_eol.local.is_eom" class="cluster-eol-heading">
        {{ eom_eol.local.name }} {{ eom_eol.local.version }} is
        {{ eom_eol.local.is_eol ? `EOL at ${eom_eol.local.eol}` : `EOM at ${eom_eol.local.eom}` }}
      </div>
      <div v-if="eom_eol.rancher.is_eol || eom_eol.rancher.is_eom" class="Cluster-type-heading">Rancher Details</div>
      <div v-if="eom_eol.rancher.is_eol || eom_eol.rancher.is_eom" class="cluster-eol-heading">
        {{ eom_eol.rancher.name }} {{ eom_eol.rancher.version }} is
        {{ eom_eol.rancher.is_eol ? `EOL at ${eom_eol.rancher.eol}` : `EOM at ${eom_eol.rancher.eom}` }}
      </div>
    </div>
  </div>
</template>

<script>
import AksLogo from '../images/aks.png';
import EksLogo from '../images/eks.png';
import GkeLogo from '../images/gke.png';
import HarvesterLogo from '../images/harvester.png';
import K3sLogo from '../images/k3s.png';
import RkeLogo from '../images/rke.png';
import security from '../images/security.png';
export default {
  name: 'Sidebar',
  props: {
    clusterData: {
      type: Array,
      required: true,
      default: () => []
    },
    summaryData: {
      type: Object,
      required: true
    },
    eom_eol: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      circleRadius: 45
    };
  },
  computed: {
    circleCircumference() {
      return 2 * Math.PI * this.circleRadius;
    },
    strokeDashoffset() {
      return this.circleCircumference * (1 - this.progressPercentage / 100);
    },
    progressPassWidth() {
      return (this.summaryData.checks_pass / this.summaryData.checks_total) * 100;
    },
    progressFailWidth() {
      return (this.summaryData.checks_fail / this.summaryData.checks_total) * 100;
    },
    progressWarnWidth() {
      return (this.summaryData.checks_warn / this.summaryData.checks_total) * 100;
    },
    progressPercentage() {
      return ((this.summaryData.checks_pass / this.summaryData.checks_total) * 100).toFixed(1);
    }
  },
  methods: {
    getClusterLogo(type) {
      const logos = {
        aks: AksLogo,
        eks: EksLogo,
        gke: GkeLogo,
        harvester: HarvesterLogo,
        k3s: K3sLogo,
        rke: RkeLogo,
        rke2: RkeLogo,
        security: security
      };
      return logos[type] || '';
    },
    getClusterCountString(count) {
      return count === 1 ? `${count} Cluster` : `${count} Clusters`;
    },
    getClusterTypeString(type) {
      return type.toUpperCase();
    }
  }
};
</script>

<style scoped>
.fixed-column {
  width: 100%;
  padding: 20px;
  color: white;
  border: 0px solid green;
  background-color: #2e3e50;
  text-align: center;
}
.circle-container {
  width: 150px;
  height: 150px;
  position: relative;
  margin: 0 auto;
  margin-bottom: 15px;
  text-align: center;
  border: 0px solid rgb(73, 31, 189);
}
.circular-svg {
  width: 100%;
  height: 100%;
}
.background-circle {
  stroke: #eaeaea;
}
.circular-progress-text {
  font-size: 18px;
  font-weight: bold;
  fill: #999;
}
.supportability-score {
  margin-top: 0px;
  font-size: 22px;
  color: #099;
  font-weight: 600;
  border: 0px solid #000;
}
.checks-status {
  margin-top: 12px;
  text-align: left;
}
.status-title {
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 10px;
}
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.status-label {
  font-size: 16px;
  color: #999;
}
.status-value {
  font-size: 14px;
  font-weight: bold;
  color: #4caf50;
}
.horizontal-progress {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
}
.horizontal-progress .progress {
  height: 100%;
  background-color: #4caf50;
  border-radius: 5px;
}
.Cluster-type-heading {
  text-align: left;
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-bottom: 10px;
  border: 0px solid red;
}
.cluster-type-name {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #000;
  margin-bottom: 20px;
  border: 0px solid red;
}
.cluster-logos {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
  align-items: center;
  padding: 0px;
  border: 0px solid green;
}
.cluster-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0px;
  background-color: #9098b9;
  width: 110px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}
.cluster-item:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}
.cluster-logo {
  width: 40px;
  height: 40px;
}
.cluster-name {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
  font-weight: bold;
}
.cluster-count {
  margin-top: 4px;
  font-size: 12px;
  color: #1e1616;
  font-weight: 600;
}

.cluster-eol-heading {
  text-align: left;
  margin: 10px 0px 10px 0px;
  font-size: 15px;
  color: #999;
}

@media (min-width: 1600px) {
  .fixed-column {
    margin: 20px 0;
    padding: 30px;
  }
  .supportability-score {
    margin: 20px 0;
    font-size: 26px;
  }

  .checks-status {
    margin-bottom: 20px;
    margin-top: 10px;
  }

  .status-title {
    font-size: 26px;
    margin-bottom: 10px;
  }

  .status-row {
    margin-bottom: 15px;
  }

  .cluster-item {
    margin: 10px 0;
    padding: 15px;
  }
  .Cluster-type-heading {
    font-size: 26px;
  }
}
</style>

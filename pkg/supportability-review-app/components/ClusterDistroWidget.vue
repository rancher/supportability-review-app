<template>
  <div>
    <div class="main-heading">Summary of Cluster State</div>

    <div class="clusters-wrapper">
      <div class="cluster-card" v-for="cluster in info" :key="cluster.type" v-if="cluster.count > 0">
        <img :src="getClusterLogo(cluster.type)" alt="cluster-logo" class="logo" />
        <div class="card-content">
          <h5 class="card-title">{{ getClusterTypeString(cluster.type) }}</h5>
          <p class="cluster-count">
            {{ getClusterCountString(cluster.count) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AksLogo from '../images/aks.png'
import EksLogo from '../images/eks.png'
import GkeLogo from '../images/gke.png'
import HarvesterLogo from '../images/harvester.png'
import K3sLogo from '../images/k3s.png'
import RkeLogo from '../images/rke.png'

export default {
  name: 'ClustersDistroWidget',
  props: {
    info: {
      type: Array,
      required: true
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
        rke2: RkeLogo
      }
      return logos[type] || ''
    },
    getClusterCountString(count) {
      return count === 1 ? `${count} Cluster` : `${count} Clusters`
    },
    getClusterTypeString(type) {
      return type.toUpperCase()
    }
  }
}
</script>

<style scoped>
.main-heading {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  padding-top: 20px;
  margin-left: 30px;
}
.clusters-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  padding-top: 30px;
  padding-bottom: 30px;
}

.cluster-card {
  position: relative;
  width: 140px;
  height: 180px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.11);
}

.logo {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.card-content {
  text-align: left;
  margin-top: auto; /* Pushes content to the bottom */
}

.card-title {
  font-weight: bold;
  font-size: 18px;
  color: #000000;
}

.cluster-count {
  font-size: 16px;
  color: #3e3d45;
}
</style>

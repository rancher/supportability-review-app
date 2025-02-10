<template>
  <div class="layout">
    <Sidebar class="sidebar" :clusterData="clusterData" :summaryData="summaryData" />
    <Maincontent class="main-content" :vectorData="vectorData" :cards="cards" />
  </div>
</template>
<script>
import Sidebar from './Sidebar.vue';
import Maincontent from './Maincontent.vue';
export default {
  components: { Sidebar, Maincontent },
  name: 'ReportView',
  data() {
    return {
      cards: [
        {
          id: 1,
          heading: 'Sample Card 1',
          details: 'Ensure kubelet is not affected by CVE-2024-10220'
        },
        {
          id: 2,
          heading: 'Sample Card 2',
          details: 'Ensure cluster has minimum two (2) nodes.'
        },
        {
          id: 3,
          heading: 'Sample Card 3',
          details: 'Ensure cluster has minimum two (2) controlplane nodes.'
        }
      ],
      reportObject: null,
      clusterData: [],
      summaryData: {
        checks_total: 0,
        checks_fail: 0,
        checks_warn: 0,
        checks_pass: 0
      },
      vectorData: new Map(),
      circleRadius: 45
    };
  },
  mounted() {
    this.fetchReport();
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
    async fetchReport() {
      const name = this.$route.query.bundlename;
      const hostname = window.location.host;
      const path =
        'https://' +
        hostname +
        '/k8s/clusters/local/api/v1/namespaces/sr-operator-system/services/http:sr-bundle-app-frontend-service:80/proxy/' +
        '?key=' +
        name +
        '&type=data';

      try {
        const response = await fetch(path);
        const reportData = await response.json();
        const report_data = {
          clusterData: [
            { type: 'aks', count: 0 },
            { type: 'eks', count: 0 },
            { type: 'gke', count: 0 },
            { type: 'harvester', count: 0 },
            { type: 'k3s', count: 0 },
            { type: 'rke', count: 0 },
            { type: 'rke2', count: 0 }
          ],
          summaryData: {
            checks_total: 0,
            checks_fail: 0,
            checks_warn: 0,
            checks_pass: 0,
            checks_skip: 0
          },
          vectorData: {}
        };

        reportData.clusters.forEach((cluster) => {
          const typeIndex = report_data.clusterData.findIndex((c) => c.type === cluster.kubernetes_distro);
          if (typeIndex !== -1) {
            report_data.clusterData[typeIndex].count++;
          }

          report_data.summaryData.checks_fail += cluster.checks_fail;
          report_data.summaryData.checks_warn += cluster.checks_warn;
          report_data.summaryData.checks_pass += cluster.checks_pass;
          report_data.summaryData.checks_skip += cluster.checks_skip;
          report_data.summaryData.checks_total += cluster.checks_total - cluster.checks_skip;
          cluster.groups.forEach((group) => {
            group.checks.forEach((check) => {
              if (!report_data.vectorData[check.vector]) {
                report_data.vectorData[check.vector] = {
                  checks_total: 0,
                  checks_pass: 0,
                  checks_fail: 0,
                  checks_warn: 0
                };
              }
              report_data.vectorData[check.vector].checks_pass += check.state === 'pass';
              report_data.vectorData[check.vector].checks_fail += check.state === 'fail';
              report_data.vectorData[check.vector].checks_warn += check.state === 'warn';
            });
          });
          for (const vectorName in report_data.vectorData) {
            const vectorData = report_data.vectorData[vectorName];
            vectorData.checks_total = vectorData.checks_pass + vectorData.checks_fail + vectorData.checks_warn;
          }
        });
        this.clusterData = report_data.clusterData || [];
        this.summaryData = report_data.summaryData || {};
        this.vectorData = new Map(Object.entries(report_data.vectorData || {}));
      } catch (error) {
        console.log('Report Error');
      }
    }
  }
};
</script>

<style scoped>
.layout {
  display: flex;
  height: 88vh;
  background: grey;
  overflow: hidden;
  border: 0px solid green;
}

.sidebar {
  flex: 0 0 25%;
  color: white;
  background-color: #2e3e50;
  text-align: center;
  border: 0px solid black;
}

.main-content {
  flex-grow: 1;
}
</style>

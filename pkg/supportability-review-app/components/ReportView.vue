<template>
  <div>
    <!-- Title page -->
    <div ref="printableReport" class="sr-letter-size">
      <ClusterDistroWidget :info="clusterData" />
      <ChecksSummaryWidget :info="summaryData" />
      <VectorsInfoWidgetDoughnut :info="vectorData" />
      <Summary />
    </div>
  </div>
</template>

<script>
import PrimeLogo from '../images/rancher-prime-logo-color-720x290.jpg'
import ClusterDistroWidget from './ClusterDistroWidget.vue'
import ChecksSummaryWidget from './ChecksSummaryWidget.vue'
import VectorsInfoWidgetDoughnut from './VectorsInfoWidgetDoughnut.vue'
import Summary from './Summary.vue'

export default {
  name: 'ReportView',
  components: {
    ClusterDistroWidget,
    ChecksSummaryWidget,
    VectorsInfoWidgetDoughnut,
    Summary
  },
  setup() {
    return {
      PrimeLogo
    }
  },
  data() {
    return {
      reportObject: null,
      clusterData: [],
      summaryData: {
        checks_total: 0,
        checks_fail: 0,
        checks_warn: 0,
        checks_skip: 0,
        checks_pass: 0
      },
      vectorData: new Map()
    }
  },
  created() {
    this.fetchReport()
  },

  methods: {
    fetchReport() {
      const name = this.$route.query.bundlename
      const hostname = window.location.host
      const path =
        'https://' +
        hostname +
        '/k8s/clusters/local/api/v1/namespaces/sr-operator-system/services/http:sr-bundle-app-frontend-service:80/proxy/' +
        '?key=' +
        name +
        '&type=data'
      fetch(path)
        .then((response) => response.json())
        .then((reportData) => {
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
              checks_skip: 0,
              checks_pass: 0
            },
            vectorData: {}
          }

          reportData.clusters.forEach((cluster) => {
            const typeIndex = report_data.clusterData.findIndex((c) => c.type === cluster.kubernetes_distro)
            if (typeIndex !== -1) {
              report_data.clusterData[typeIndex].count++
            }
            report_data.summaryData.checks_total += cluster.checks_total
            report_data.summaryData.checks_fail += cluster.checks_fail
            report_data.summaryData.checks_warn += cluster.checks_warn
            report_data.summaryData.checks_skip += cluster.checks_skip
            report_data.summaryData.checks_pass += cluster.checks_pass
            cluster.groups.forEach((group) => {
              group.checks.forEach((check) => {
                if (!report_data.vectorData[check.vector]) {
                  report_data.vectorData[check.vector] = {
                    checks_total: 0,
                    checks_pass: 0,
                    checks_fail: 0,
                    checks_warn: 0,
                    checks_skip: 0
                  }
                }
                report_data.vectorData[check.vector].checks_pass += check.state === 'pass'
                report_data.vectorData[check.vector].checks_fail += check.state === 'fail'
                report_data.vectorData[check.vector].checks_skip += check.state === 'skip'
                report_data.vectorData[check.vector].checks_warn += check.state === 'warn'
              })
            })
            for (const vectorName in report_data.vectorData) {
              const vectorData = report_data.vectorData[vectorName]
              vectorData.checks_total =
                vectorData.checks_pass + vectorData.checks_fail + vectorData.checks_warn + vectorData.checks_skip
            }
          })
          this.clusterData = report_data.clusterData || []
          this.summaryData = report_data.summaryData || {}
          this.vectorData = new Map(Object.entries(report_data.vectorData || {}))
        })
        .catch(console.error)
    }
  }
}
</script>

<style scoped lang="scss">
.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 60px;
}
.custom-button {
  background-color: #2453ff;
  color: white;
  padding: 6px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}
.custom-button:hover {
  background-color: #0056b3;
}

.sr-letter-size {
  background-color: rgb(255, 255, 255);
  width: 8.5in;
  height: 11in;
}
</style>

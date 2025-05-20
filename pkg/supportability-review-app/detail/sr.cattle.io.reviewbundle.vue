<script>
import PercentageBar from '@shell/components/PercentageBar';
import SortableTable from '@shell/components/SortableTable';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { Banner } from '@components/Banner';

export default {
  name: 'ReviewBundleDetailView',
  components: {
    Banner,
    PercentageBar,
    SortableTable,
    Tabbed,
    Tab
  },
  props: {
    value: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      clusterData: null,
      summaryData: {
        checks_total: 0,
        checks_fail: 0,
        checks_warn: 0,
        checks_pass: 0
      },
      vectorData: {
        security: {
          checks_total: 0,
          checks_fail: 0,
          checks_warn: 0,
          checks_pass: 0
        },
        operationalBestPractice: {
          checks_total: 0,
          checks_fail: 0,
          checks_warn: 0,
          checks_pass: 0
        },
        designValidation: {
          checks_total: 0,
          checks_fail: 0,
          checks_warn: 0,
          checks_pass: 0
        },
        supportMatrixConformance: {
          checks_total: 0,
          checks_fail: 0,
          checks_warn: 0,
          checks_pass: 0
        }
      },
      eomEol: {
        local: { name: '', version: '', is_eol: false, is_eom: false, eol: '', eom: '' },
        rancher: { name: '', version: '', is_eol: false, is_eom: false, eol: '', eom: '' }
      },
      vectorList: {
        security: [],
        operationalBestPractice: [],
        designValidation: [],
        supportMatrixConformance: []
      },
      colorStopsFail: {
        0: '--success',
        20: '--info',
        75: '--warning',
        95: '--error'
      },
      colorStopsNormal: {
        0: '--error',
        20: '--warning',
        75: '--info',
        95: '--success'
      },
      activeTab: 'security'
    };
  },
  computed: {
    checkResultHeaders() {
      const out = [
        {
          name: 'checkStatus',
          labelKey: 'tableHeaders.checkStatus'
        },
        {
          name: 'checkNumber',
          labelKey: 'tableHeaders.checkNumber'
        },
        {
          name: 'checkDescription',
          labelKey: 'tableHeaders.checkDescription'
        }
      ];

      return out;
    }
  },
  mounted() {
    this.fetchReport();
  },
  methods: {
    async fetchReport() {
      const name = this.value.id;
      const path =
        '/k8s/clusters/local/api/v1/namespaces/sr-operator-system/services/http:sr-bundle-app-frontend-service:80/proxy/' +
        '?key=' +
        name +
        '&type=data';

      fetch(path)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
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
              checks_pass: 0,
              checks_skip: 0
            },
            vectorData: {},
            cards: []
          };
          reportData?.systems_summary?.eom_eol?.forEach((item) => {
            const formattedEOL = item.eol_date ? item.eol_date.split('/').join('-') : null;
            const formattedEOM = item.eom_date ? item.eom_date.split('/').join('-') : null;
            const formattedVersion = item.version.split('.').slice(0, 2).join('.');
            if (item.cluster === 'local' && item.app === 'rancher') {
              this.eomEol.rancher = {
                name: item.app,
                version: formattedVersion,
                eol: formattedEOL,
                eom: formattedEOM,
                is_eol: item.is_eol,
                is_eom: item.is_eom
              };
            } else if (item.cluster === 'local') {
              this.eomEol.local = {
                name: item.app,
                version: formattedVersion,
                eol: formattedEOL,
                eom: formattedEOM,
                is_eol: item.is_eol,
                is_eom: item.is_eom
              };
            }
          });
          for (const cluster of reportData.clusters) {
            if (cluster.cluster_id !== 'local') {
              continue;
            }
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
                if (check.state == 'fail' || check.state == 'warn') {
                  report_data.cards.push({
                    id: check.check_id,
                    details: check.text,
                    state: check.state,
                    vector: check.vector,
                    priority: check.priority
                  });
                }
              });
            });
            for (const vectorName in report_data.vectorData) {
              const vectorData = report_data.vectorData[vectorName];
              vectorData.checks_total = vectorData.checks_pass + vectorData.checks_fail + vectorData.checks_warn;
            }
            break;
          }
          report_data.cards.sort((a, b) => {
            const priorityOrder = { high: 1, medium: 2, low: 3 };
            const stateOrder = { fail: 1, warn: 2 };
            return (
              (stateOrder[a.state] || 3) - (stateOrder[b.state] || 3) ||
              priorityOrder[a.priority] - priorityOrder[b.priority]
            );
          });
          const maxFailures = 5;
          report_data.cards.forEach((card) => {
            const checkResult = { 'checkStatus': card.state, 'checkNumber': card.id, 'checkDescription': card.details };
            switch (card.vector) {
              case 'Security':
                if (this.vectorList.security.length < maxFailures) {
                  this.vectorList.security.push(checkResult);
                }
                break;
              case 'Operational Best Practice':
                if (this.vectorList.operationalBestPractice.length < maxFailures) {
                  this.vectorList.operationalBestPractice.push(checkResult);
                }
                break;
              case 'Design Validation':
                if (this.vectorList.designValidation.length < maxFailures) {
                  this.vectorList.designValidation.push(checkResult);
                }
                break;
              case 'Support Matrix Conformance':
                if (this.vectorList.supportMatrixConformance.length < maxFailures) {
                  this.vectorList.supportMatrixConformance.push(checkResult);
                }
                break;
            }
          });

          this.clusterData = report_data.clusterData || [];
          this.summaryData = report_data.summaryData || {};
          this.vectorData.security = report_data.vectorData['Security'];
          this.vectorData.operationalBestPractice = report_data.vectorData['Operational Best Practice'];
          this.vectorData.designValidation = report_data.vectorData['Design Validation'];
          this.vectorData.supportMatrixConformance = report_data.vectorData['Support Matrix Conformance'];
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    },
    switchToTab(tabName) {
      this.$refs.tabbedRef?.select(tabName);
    }
  }
};
</script>

<template>
  <div>
    <h1>Local cluster summary</h1>
    <h5>Provider: {{ eomEol.local.name }}</h5>
    <h5 v-if="eomEol.rancher.is_eol">
      {{ eomEol.rancher.name }} {{ eomEol.rancher.version }} EOL: {{ eomEol.rancher.eol }}
    </h5>
    <h5 v-else-if="eomEol.rancher.is_eom">
      {{ eomEol.rancher.name }} {{ eomEol.rancher.version }} EOM: {{ eomEol.rancher.eom }}
    </h5>
    <h5 v-if="eomEol.local.is_eol">{{ eomEol.local.name }} {{ eomEol.local.version }} EOL: {{ eomEol.local.eol }}</h5>
    <h5 v-else-if="eomEol.local.is_eom">
      {{ eomEol.local.name }} {{ eomEol.local.version }} EOM: {{ eomEol.local.eom }}
    </h5>
    <h2>Checks status</h2>
    <Banner v-if="clusterData === null" class="mb-20" color="info">
      <div v-clean-html="t('nav.inProgress', {}, true)" />
    </Banner>
    <div v-else class="main-card-container">
      <div class="card">
        <div class="card-top-block">
          <h2>Check Result</h2>
        </div>
        <div>
          <h5>Passed ({{ summaryData.checks_pass }}/{{ summaryData.checks_total }})</h5>
          <PercentageBar
            class="mb-15"
            :show-percentage="true"
            :model-value="(summaryData.checks_pass / summaryData.checks_total) * 100.0"
            :color-stops="colorStopsNormal" />
          <h5>Failed ({{ summaryData.checks_fail }}/{{ summaryData.checks_total }})</h5>
          <PercentageBar
            class="mb-15"
            :show-percentage="true"
            :model-value="(summaryData.checks_fail / summaryData.checks_total) * 100.0"
            :color-stops="colorStopsFail" />
          <h5>Warning ({{ summaryData.checks_warn }}/{{ summaryData.checks_total }})</h5>
          <PercentageBar
            class="mb-15"
            :show-percentage="true"
            :model-value="(summaryData.checks_warn / summaryData.checks_total) * 100.0"
            :color-stops="colorStopsFail" />
        </div>
      </div>
      <div class="card">
        <div class="card-top-block">
          <h2>Check Vectors</h2>
        </div>
        <div>
          <div @click="switchToTab('security')" style="cursor: pointer">
            <h5>Security ({{ vectorData.security.checks_pass }}/{{ vectorData.security.checks_total }})</h5>
            <PercentageBar
              class="mb-15"
              :show-percentage="true"
              :model-value="(vectorData.security.checks_pass / vectorData.security.checks_total) * 100"
              :color-stops="colorStopsNormal" />
          </div>
          <div @click="switchToTab('operationalBestPractice')" style="cursor: pointer">
            <h5>
              Operational Best Practice ({{ vectorData.operationalBestPractice.checks_pass }}/{{
                vectorData.operationalBestPractice.checks_total
              }})
            </h5>
            <PercentageBar
              class="mb-15"
              :show-percentage="true"
              :model-value="
                (vectorData.operationalBestPractice.checks_pass / vectorData.operationalBestPractice.checks_total) * 100
              "
              :color-stops="colorStopsNormal" />
          </div>
          <div @click="switchToTab('designValidation')" style="cursor: pointer">
            <h5>
              Design Validation ({{ vectorData.designValidation.checks_pass }}/{{
                vectorData.designValidation.checks_total
              }})
            </h5>
            <PercentageBar
              class="mb-15"
              :show-percentage="true"
              :model-value="(vectorData.designValidation.checks_pass / vectorData.designValidation.checks_total) * 100"
              :color-stops="colorStopsNormal" />
          </div>
          <div @click="switchToTab('supportMatrixConformance')" style="cursor: pointer">
            <h5>
              Support Matrix Conformance ({{ vectorData.supportMatrixConformance.checks_pass }}/{{
                vectorData.supportMatrixConformance.checks_total
              }})
            </h5>
            <PercentageBar
              class="mb-15"
              :show-percentage="true"
              :model-value="
                (vectorData.supportMatrixConformance.checks_pass / vectorData.supportMatrixConformance.checks_total) *
                100
              "
              :color-stops="colorStopsNormal" />
          </div>
        </div>
      </div>
    </div>
    <h2>Failed/Warnings</h2>
    <Banner v-if="clusterData === null" class="mb-20" color="info">
      <div v-clean-html="t('nav.inProgress', {}, true)" />
    </Banner>
    <Tabbed ref="tabbedRef" v-else>
      <Tab label-key="sr.vector.security" name="security" :weight="5">
        <div>
          <SortableTable
            :headers="checkResultHeaders"
            :search="false"
            :tableActions="false"
            :rowActions="false"
            :rows="vectorList.security" />
        </div>
      </Tab>
      <Tab label-key="sr.vector.operationalBestPractice" name="operationalBestPractice" :weight="4">
        <div>
          <SortableTable
            :headers="checkResultHeaders"
            :search="false"
            :tableActions="false"
            :rowActions="false"
            :rows="vectorList.operationalBestPractice" />
        </div>
      </Tab>
      <Tab label-key="sr.vector.designValidation" name="designValidation" :weight="3">
        <div>
          <SortableTable
            :headers="checkResultHeaders"
            :search="false"
            :tableActions="false"
            :rowActions="false"
            :rows="vectorList.designValidation" />
        </div>
      </Tab>
      <Tab label-key="sr.vector.supportMatrixConformance" name="supportMatrixConformance" :weight="2">
        <div>
          <SortableTable
            :headers="checkResultHeaders"
            :search="false"
            :tableActions="false"
            :rowActions="false"
            :rows="vectorList.supportMatrixConformance" />
        </div>
      </Tab>
    </Tabbed>
    <div>
      <Banner class="mb-10" color="info">
        <div v-clean-html="t('sr.menuLabels.upSell', {}, true)" />
      </Banner>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main-card-container {
  display: flex;
  flex-wrap: wrap;

  .card {
    width: fit-content;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    border: 1px solid var(--border);
    margin: 0 10px 20px 10px;
    padding: 20px;
    height: 320px;

    &:first-child {
      margin-left: 0;
    }
    &:last-child {
      margin-right: 0;
    }

    .card-top-block {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      h1 {
        margin: 0 15px 0 0;
      }

      p {
        font-size: 18px;
      }
    }

    button {
      justify-content: center;
      width: fit-content;
      margin-top: 12px;
    }
  }

  .used-percentage-container {
    > div {
      display: flex;
      justify-content: space-between;

      span {
        font-size: 12px;
        padding-left: 10px;
        color: var(--muted);
      }
    }
  }
}
</style>

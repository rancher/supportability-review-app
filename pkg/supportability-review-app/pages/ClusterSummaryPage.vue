<script>
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import SortableTable from '@shell/components/SortableTable';
import { BadgeState } from '@components/BadgeState';
import { filterOnlyKubernetesClusters } from '@shell/utils/cluster';
import { getVersionInfo } from '@shell/utils/version';
import { formatSi, parseSi } from '@shell/utils/units';
import KubernetesEol from '../components/KubernetesEol.vue';
import CertificateExpiry from '../components/CertificateExpiry.vue';
import { SR_APP_PAGES, SUPPORTABILITY_REVIEW_STORE } from '../config/types';
import { createRoute } from '../utils/custom-routing';

// Node conditions that are reported as a problem when their status is True
const PRESSURE_CONDITIONS = ['MemoryPressure', 'DiskPressure', 'PIDPressure', 'NetworkUnavailable'];

function nodeConditions(node) {
  return node.status?.internalNodeStatus?.conditions || node.status?.conditions || [];
}

function isNodeReady(node) {
  return nodeConditions(node).some((c) => c.type === 'Ready' && c.status === 'True');
}

export default {
  name: 'ClusterSummaryPage',

  components: { Loading, SortableTable, BadgeState, KubernetesEol, CertificateExpiry },

  data() {
    return {
      clusters: [],
      nodes: [],
      nodesError: false,
      refreshing: false
    };
  },

  async fetch() {
    await this.load();
    // Not awaited: the table shows right away and the cells fill in as the data arrives
    this.loadLifecycleAndCerts();
  },

  computed: {
    rancherVersion() {
      return getVersionInfo(this.$store).displayVersion;
    },

    nodesByCluster() {
      const out = {};

      this.nodes.forEach((n) => {
        // Management node ids are `<cluster id>/<node id>`
        const clusterId = n.metadata?.namespace || n.id?.split('/')[0];

        (out[clusterId] = out[clusterId] || []).push(n);
      });

      return out;
    },

    rows() {
      return this.clusters.map((c) => {
        const nodes = this.nodesByCluster[c.id] || [];
        const pressures = new Set();

        nodes.forEach((n) => {
          nodeConditions(n).forEach((cond) => {
            if (PRESSURE_CONDITIONS.includes(cond.type) && cond.status === 'True') {
              pressures.add(cond.type);
            }
          });
        });

        return {
          id: c.id,
          cluster: c,
          stateDisplay: c.stateDisplay,
          stateSort: c.stateSort,
          nameDisplay: c.nameDisplay,
          type: c.provisionerDisplay,
          nodesReady: nodes.filter(isNodeReady).length,
          nodesTotal: nodes.length,
          pressures: [...pressures].sort(),
          kubernetesVersion: c.kubernetesVersion,
          isReady: c.isReady
        };
      });
    },

    headers() {
      return [
        {
          name: 'state',
          labelKey: 'sr.clusterSummary.columns.state',
          value: 'stateDisplay',
          sort: ['stateSort', 'nameDisplay'],
          width: 100
        },
        {
          name: 'name',
          labelKey: 'sr.clusterSummary.columns.name',
          value: 'nameDisplay',
          sort: ['nameDisplay']
        },
        {
          name: 'type',
          labelKey: 'sr.clusterSummary.columns.type',
          value: 'type',
          sort: ['type', 'nameDisplay']
        },
        {
          name: 'nodeHealth',
          labelKey: 'sr.clusterSummary.columns.nodeHealth',
          value: 'nodesReady',
          sort: ['nodesTotal', 'nameDisplay'],
          search: false
        },
        {
          name: 'version',
          labelKey: 'sr.clusterSummary.columns.version',
          value: 'kubernetesVersion',
          sort: ['kubernetesVersion', 'nameDisplay']
        },
        {
          name: 'lifecycle',
          labelKey: 'sr.clusterSummary.columns.lifecycle',
          value: 'kubernetesVersion',
          sort: false,
          search: false,
          width: 130
        },
        {
          name: 'support',
          labelKey: 'sr.clusterSummary.columns.support',
          value: 'id',
          sort: false,
          search: false,
          width: 130
        },
        {
          name: 'certExpiry',
          labelKey: 'sr.clusterSummary.columns.certExpiry',
          value: 'id',
          sort: false,
          search: false,
          width: 130
        },
        {
          name: 'actions',
          label: ' ',
          value: 'id',
          sort: false,
          search: false,
          align: 'right',
          width: 90
        }
      ];
    },

    totalNodes() {
      return this.nodes.length;
    },

    totalCpu() {
      const cpu = this.clusters.reduce((sum, c) => sum + (parseSi(c.status?.capacity?.cpu || '0') || 0), 0);

      return Math.round(cpu * 10) / 10;
    },

    totalMemory() {
      return this.clusters.reduce((sum, c) => sum + (parseSi(c.status?.capacity?.memory || '0') || 0), 0);
    },

    totalMemoryDisplay() {
      return formatSi(this.totalMemory, { increment: 1024, suffix: 'iB', firstSuffix: 'B' });
    }
  },

  methods: {
    async load() {
      const clusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });

      this.clusters = (filterOnlyKubernetesClusters(clusters || [], this.$store) || []).sort((a, b) => {
        if (a.isLocal !== b.isLocal) {
          return a.isLocal ? -1 : 1;
        }

        return (a.nameDisplay || '').localeCompare(b.nameDisplay || '');
      });

      try {
        this.nodes = (await this.$store.dispatch('management/findAll', { type: MANAGEMENT.NODE })) || [];
        this.nodesError = false;
      } catch {
        // The user may not be allowed to list management nodes
        this.nodes = [];
        this.nodesError = true;
      }
    },

    // Reads the EOM/EOL dates and the certificate expiry events of every cluster.
    // Clusters and nodes are kept up to date by Rancher's websocket watches, but
    // these are read over plain HTTP, so they are re-read on every page open and
    // on Refresh.
    loadLifecycleAndCerts() {
      return Promise.all([
        this.$store.dispatch(`${SUPPORTABILITY_REVIEW_STORE}/fetchHelperData`, { name: 'eom-eol', force: true }),
        ...this.clusters.map((c) => this.$store.dispatch(`${SUPPORTABILITY_REVIEW_STORE}/fetchCertEvents`, c.id))
      ]);
    },

    async refresh() {
      if (this.refreshing) {
        return;
      }

      this.refreshing = true;
      try {
        await this.loadLifecycleAndCerts();
      } finally {
        this.refreshing = false;
      }
    },

    explorerLocation(row) {
      return { name: 'c-cluster-explorer', params: { cluster: row.id } };
    },

    logsLocation(row) {
      return { ...createRoute(SR_APP_PAGES.LOG_DOWNLOADS, {}), query: { cluster: row.id } };
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="sr-cluster-summary">
    <div class="header">
      <h1>{{ t('sr.clusterSummary.title', {}, true) }}</h1>
      <button
        type="button"
        class="btn role-secondary"
        :disabled="refreshing"
        data-testid="sr-cluster-summary-refresh"
        @click="refresh">
        <i v-if="refreshing" class="icon icon-spinner icon-spin" />
        {{ t('sr.clusterSummary.refresh') }}
      </button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">{{ t('sr.clusterSummary.kpi.manager') }}</div>
        <div class="kpi-value">{{ rancherVersion }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">{{ t('sr.clusterSummary.kpi.compute') }}</div>
        <div class="kpi-value">{{ t('sr.clusterSummary.kpi.nodes', { count: totalNodes }) }}</div>
        <div class="kpi-subtext">
          {{ t('sr.clusterSummary.kpi.capacity', { cpu: totalCpu, memory: totalMemoryDisplay }) }}
        </div>
      </div>
    </div>

    <h2 class="section-title">{{ t('sr.clusterSummary.inventory') }}</h2>

    <SortableTable
      :headers="headers"
      :rows="rows"
      :search="false"
      :table-actions="false"
      :row-actions="false"
      key-field="id"
      default-sort-by="state"
      data-testid="sr-cluster-summary-table">
      <template #cell:state="{ row }">
        <BadgeState :value="row.cluster" />
      </template>

      <template #cell:name="{ row }">
        <router-link v-if="row.isReady" :to="explorerLocation(row)" class="cluster-name">
          {{ row.nameDisplay }}
        </router-link>
        <span v-else class="cluster-name">{{ row.nameDisplay }}</span>
      </template>

      <template #cell:nodeHealth="{ row }">
        <span v-if="nodesError || !row.nodesTotal" class="text-muted">—</span>
        <span v-else>
          {{ t('sr.clusterSummary.nodesReady', { ready: row.nodesReady, total: row.nodesTotal }) }}
        </span>
        <span v-for="p in row.pressures" :key="p" class="pressure">{{ p }}</span>
      </template>

      <template #cell:lifecycle="{ row }">
        <KubernetesEol :row="row.cluster" />
      </template>

      <!-- K8s Support: intentionally left blank for now -->
      <template #cell:support>
        <span />
      </template>

      <template #cell:certExpiry="{ row }">
        <CertificateExpiry :row="row.cluster" />
      </template>

      <template #cell:actions="{ row }">
        <router-link
          v-if="row.isReady"
          :to="logsLocation(row)"
          class="btn btn-sm role-secondary"
          data-testid="sr-cluster-summary-logs">
          {{ t('sr.clusterSummary.logs') }}
        </router-link>
      </template>
    </SortableTable>
  </div>
</template>

<style lang="scss" scoped>
.sr-cluster-summary {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
    }
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 30px;
  }

  .kpi-card {
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
    background-color: var(--box-bg);
  }

  .kpi-title {
    font-size: 12px;
    color: var(--muted);
    text-transform: uppercase;
  }

  .kpi-value {
    margin: 6px 0 4px;
    font-size: 24px;
  }

  .kpi-subtext {
    font-size: 12px;
    color: var(--muted);
  }

  .section-title {
    font-size: 16px;
    margin-bottom: 15px;
  }

  .cluster-name {
    font-weight: bold;
  }

  .pressure {
    display: inline-block;
    margin-left: 8px;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 10px;
    color: var(--on-warning-banner, var(--warning-text));
    background: var(--warning-badge, var(--warning));
  }
}
</style>

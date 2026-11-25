<script>
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Banner } from '@components/Banner';
import { collectNodeBundle, getConfiguredRegistry, hasNotificationCenter, storeContext } from '../utils/support-bundle';

const ALL_NODES = '__all__';
const DEFAULT_DAYS = 7;
const MAX_DAYS = 365;

function isReady(node) {
  return (node.status?.conditions || []).some((c) => c.type === 'Ready' && c.status === 'True');
}

function nodeRoles(node) {
  const labels = node.metadata?.labels || {};
  const roles = [];

  if (
    labels['node-role.kubernetes.io/control-plane'] === 'true' ||
    labels['node-role.kubernetes.io/master'] === 'true'
  ) {
    roles.push('roleControlPlane');
  }
  if (labels['node-role.kubernetes.io/etcd'] === 'true') {
    roles.push('roleEtcd');
  }
  if (labels['node-role.kubernetes.io/worker'] === 'true' || !roles.length) {
    roles.push('roleWorker');
  }

  return roles;
}

export default {
  name: 'LogDownloadsPage',

  components: { Loading, LabeledSelect, LabeledInput, Banner },

  data() {
    return {
      clusters: [],
      clusterId: null,
      nodes: [],
      nodesLoading: false,
      nodesError: null,
      nodeName: null,
      days: DEFAULT_DAYS,
      runs: [],
      running: false,
      // guards against a slow node list overwriting the one for a newer selection
      nodesRequest: 0
    };
  },

  async fetch() {
    const clusters = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER });

    this.clusters = (clusters || []).filter((c) => c.isReady);
    const requested = this.$route.query?.cluster;
    const initial =
      (requested && this.clusters.find((c) => c.id === requested)) ||
      this.clusters.find((c) => c.isLocal) ||
      this.clusters[0];

    if (initial) {
      this.selectCluster(initial.id);
    }
  },

  computed: {
    ctx() {
      return storeContext(this.$store);
    },

    notify() {
      return hasNotificationCenter(this.ctx);
    },

    cluster() {
      return this.clusters.find((c) => c.id === this.clusterId);
    },

    clusterOptions() {
      return this.clusters.map((c) => ({
        value: c.id,
        label: this.t('sr.logDownloads.clusterOption', {
          name: c.nameDisplay,
          provider: c.provisionerDisplay,
          version: c.kubernetesVersion
        })
      }));
    },

    nodeOptions() {
      if (!this.nodes.length) {
        return [];
      }

      const ready = this.nodes.filter(isReady).length;
      const options = [
        {
          value: ALL_NODES,
          label: this.t('sr.logDownloads.allNodes', { ready, total: this.nodes.length })
        }
      ];

      this.nodes.forEach((n) => {
        const name = n.metadata.name;

        options.push({
          value: name,
          label: this.t('sr.logDownloads.nodeOption', {
            name,
            roles: nodeRoles(n)
              .map((r) => this.t(`sr.logDownloads.${r}`))
              .join(' + '),
            status: this.t(isReady(n) ? 'sr.logDownloads.ready' : 'sr.logDownloads.notReady')
          })
        });
      });

      return options;
    },

    targetNodes() {
      if (this.nodeName === ALL_NODES) {
        return this.nodes.map((n) => n.metadata.name);
      }

      return this.nodeName ? [this.nodeName] : [];
    },

    targetLabel() {
      if (!this.cluster || !this.nodeName) {
        return '';
      }

      return this.t('sr.logDownloads.target', {
        cluster: this.cluster.nameDisplay,
        node: this.nodeName === ALL_NODES ? this.t('sr.logDownloads.allNodesShort') : this.nodeName
      });
    },

    finished() {
      return this.runs.length > 0 && this.runs.every((r) => r.state !== 'running');
    },

    canDownload() {
      return !this.running && !!this.cluster && this.targetNodes.length > 0;
    },

    // Static: cluster and node are always preselected, so every step is shown as done.
    steps() {
      return ['sr.logDownloads.stepCluster', 'sr.logDownloads.stepNode', 'sr.logDownloads.stepDownload'];
    }
  },

  methods: {
    async selectCluster(id) {
      this.clusterId = id;
      this.nodeName = null;
      this.nodes = [];
      this.nodesError = null;
      this.runs = [];

      if (!id) {
        return;
      }

      const request = ++this.nodesRequest;

      this.nodesLoading = true;
      try {
        const res = await this.$store.dispatch('management/request', {
          url: `/k8s/clusters/${encodeURIComponent(id)}/v1/nodes`
        });

        if (request !== this.nodesRequest) {
          return;
        }

        // The collector runs a bash script, so it can only be scheduled on Linux nodes.
        this.nodes = (res?.data || [])
          .filter((n) => n.metadata?.labels?.['kubernetes.io/os'] !== 'windows')
          .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
        this.nodeName = this.nodes.length ? ALL_NODES : null;
      } catch (err) {
        if (request === this.nodesRequest) {
          this.nodesError = err?.message || err?._statusText || String(err);
        }
      } finally {
        if (request === this.nodesRequest) {
          this.nodesLoading = false;
        }
      }
    },

    selectNode(name) {
      this.nodeName = name;
      this.runs = [];
    },

    reset() {
      const initial = this.clusters.find((c) => c.isLocal) || this.clusters[0];

      this.days = DEFAULT_DAYS;
      this.selectCluster(initial?.id || null);
    },

    async download() {
      if (!this.canDownload) {
        return;
      }

      const days = Math.min(MAX_DAYS, Math.max(1, Math.floor(Number(this.days)) || DEFAULT_DAYS));
      const cluster = this.cluster;
      const nodes = [...this.targetNodes];

      this.days = days;
      this.running = true;
      this.runs = nodes.map((node) => ({
        node,
        state: 'running',
        message: this.t('sr.supportBundle.phaseStarting'),
        progress: 0,
        filename: null
      }));

      try {
        const registry = await getConfiguredRegistry(this.ctx);

        await Promise.all(
          nodes.map((node, i) =>
            collectNodeBundle(this.ctx, cluster, node, days, registry, {
              notify: this.notify,
              onProgress: (p) => {
                this.runs[i] = { ...this.runs[i], ...p };
              }
            })
          )
        );
      } finally {
        this.running = false;
      }
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else class="sr-log-downloads">
    <div class="header">
      <h1>{{ t('sr.logDownloads.title') }}</h1>
    </div>

    <Banner color="info" class="sr-banner">
      <span>{{ t('sr.logDownloads.banner') }}</span>
    </Banner>
    <Banner v-if="!notify" color="warning" class="sr-banner">
      <span>{{ t('sr.logDownloads.noNotificationCenter') }}</span>
    </Banner>

    <div class="wizard">
      <div class="stepper">
        <div v-for="(step, i) in steps" :key="step" class="step done">
          <span class="step-num">{{ i + 1 }}</span>
          <span>{{ t(step) }}</span>
        </div>
      </div>

      <div class="body">
        <div class="field">
          <LabeledSelect
            :value="clusterId"
            :options="clusterOptions"
            :label="t('sr.logDownloads.clusterLabel')"
            :disabled="running"
            :searchable="true"
            required
            data-testid="sr-log-downloads-cluster"
            @update:value="selectCluster" />
          <p class="hint">{{ t('sr.logDownloads.clusterHint') }}</p>
        </div>

        <div class="field">
          <LabeledSelect
            :value="nodeName"
            :options="nodeOptions"
            :label="t('sr.logDownloads.nodeLabel')"
            :loading="nodesLoading"
            :disabled="running || !cluster"
            :searchable="true"
            required
            data-testid="sr-log-downloads-node"
            @update:value="selectNode" />
          <p v-if="nodesError" class="hint text-error">
            {{ t('sr.logDownloads.nodesLoadFailed', { error: nodesError }) }}
          </p>
          <p v-else-if="cluster && !nodesLoading && !nodes.length" class="hint text-warning">
            {{ t('sr.logDownloads.noNodes') }}
          </p>
          <p v-else class="hint">{{ t('sr.logDownloads.nodeHint') }}</p>
        </div>

        <div class="field days">
          <LabeledInput
            v-model:value.number="days"
            type="number"
            min="1"
            max="365"
            :disabled="running"
            :label="t('sr.supportBundle.daysLabel')" />
        </div>

        <div v-if="runs.length" class="status-box" :class="{ done: finished }">
          <div v-for="run in runs" :key="run.node" class="status-row">
            <div class="status-title">
              <span>
                <i v-if="run.state === 'running'" class="icon icon-spinner icon-spin text-info" />
                <i v-else-if="run.state === 'success'" class="icon icon-checkmark text-success" />
                <i v-else class="icon icon-error text-error" />
                <strong>{{ run.node }}</strong>
              </span>
              <span class="pct">{{ run.progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :class="run.state" :style="{ width: `${run.progress}%` }" />
            </div>
            <div class="status-detail" :class="{ 'text-error': run.state === 'error' }">{{ run.message }}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="target">{{ targetLabel }}</div>
        <div class="buttons">
          <button type="button" class="btn role-secondary" :disabled="running" @click="reset">
            {{ t('sr.logDownloads.reset') }}
          </button>
          <button
            type="button"
            class="btn role-primary"
            :disabled="!canDownload"
            data-testid="sr-log-downloads-download"
            @click="download">
            <i class="icon icon-download" />
            {{ t('sr.logDownloads.download') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$wizard-width: 780px;

.sr-log-downloads {
  .header {
    margin-bottom: 20px;
  }

  .sr-banner {
    max-width: $wizard-width;
  }
}

.wizard {
  max-width: $wizard-width;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background-color: var(--body-bg);
  overflow: hidden;
}

.stepper {
  display: flex;
  background-color: var(--sortable-table-header-bg, var(--box-bg));
  border-bottom: 1px solid var(--border);

  .step {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    color: var(--muted);
    border-bottom: 3px solid transparent;

    &.done {
      color: var(--success);
      border-bottom-color: var(--success);
    }
  }

  .step-num {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    background-color: var(--border);
    color: var(--muted);
  }

  .step.done .step-num {
    background-color: var(--success);
    color: var(--success-text, var(--primary-text));
  }
}

.body {
  padding: 28px 30px;

  .field {
    margin-bottom: 24px;

    &.days {
      max-width: 300px;
    }
  }

  .hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--muted);

    &.text-error {
      color: var(--error);
    }

    &.text-warning {
      color: var(--warning);
    }
  }
}

.status-box {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  background-color: var(--box-bg);

  .status-row + .status-row {
    margin-top: 16px;
  }

  .status-title {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .icon {
      margin-right: 6px;
    }
  }

  .pct,
  .status-detail {
    font-family: monospace;
    font-size: 12px;
    color: var(--muted);
  }

  .status-detail.text-error {
    color: var(--error);
  }

  .progress-track {
    height: 6px;
    margin: 8px 0;
    border-radius: 3px;
    background-color: var(--border);
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--primary);
    transition: width 0.3s ease;

    &.success {
      background-color: var(--success);
    }

    &.error {
      background-color: var(--error);
    }
  }
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 30px;
  border-top: 1px solid var(--border);
  background-color: var(--box-bg);

  .target {
    font-family: monospace;
    font-size: 12px;
    color: var(--muted);
  }

  .buttons {
    display: flex;
    gap: 10px;
  }
}
</style>

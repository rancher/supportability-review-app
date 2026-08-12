import { ActionLocation, IPlugin } from '@shell/core/types';
import { CATALOG } from '@shell/config/types';
import Socket, { EVENT_DISCONNECTED, EVENT_MESSAGE, EVENT_CONNECT_ERROR } from '@shell/utils/socket';
import { addParam, addParams } from '@shell/utils/url';
import { base64Decode } from '@shell/utils/crypto';
import { SR_CHARTS } from '../config/types';

const jsyaml = require('js-yaml');

const LOG_COLLECTOR_IMAGE = 'rancherlabs/swiss-army-knife';
const LOG_COLLECTOR_NAMESPACE = 'cattle-system';

function logCollectorPodSpec(nodeName: string, podName: string, days: number, registry: string): any {
  const image = registry ? `${registry}/${LOG_COLLECTOR_IMAGE}` : LOG_COLLECTOR_IMAGE;

  return {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: { name: podName, namespace: LOG_COLLECTOR_NAMESPACE },
    spec: {
      nodeName,
      hostNetwork: true,
      hostPID: true,
      hostIPC: true,
      restartPolicy: 'Never',
      tolerations: [{ operator: 'Exists' }],
      volumes: [{ name: 'host-root', hostPath: { path: '/' } }],
      containers: [
        {
          name: 'log-collector',
          image,
          command: ['bash', '-c', `rancher2_logs_collector.sh -D -s ${days}`],
          volumeMounts: [{ name: 'host-root', mountPath: '/host' }]
        }
      ]
    }
  };
}

async function getConfiguredRegistry(model: any): Promise<string> {
  try {
    const apps = await model.$dispatch(
      'management/findAll',
      { type: CATALOG.APP, opt: { force: true } },
      { root: true }
    );
    const app = apps?.find((item: any) => item.id.includes(SR_CHARTS.OPERATOR) && !item.id.includes(SR_CHARTS.CRD));

    if (!app) {
      return '';
    }

    await app.fetchValues(true);
    const values = app.values || {};
    const registry = values.global?.cattle?.systemDefaultRegistry || values.global?.systemDefaultRegistry || '';

    console.log('[SR] registry lookup: app =', app.id, 'values =', values, 'registry =', registry);

    return registry;
  } catch (err) {
    console.error('[SR] registry lookup failed:', err);

    return '';
  }
}

async function fetchPodLog(model: any, pod: any): Promise<string> {
  const url = addParams(`${pod.links.view}/log`, { container: pod.defaultContainerName });
  const res = await model.$dispatch('request', { url, responseType: 'text' });

  return typeof res?.data === 'string' ? res.data : '';
}

async function waitForTarball(model: any, pod: any, timeoutMs = 900000): Promise<string | null> {
  const start = Date.now();
  let seen = 0;
  while (Date.now() - start < timeoutMs) {
    let log = '';
    try {
      log = await fetchPodLog(model, pod);
    } catch {
      // container may not have started emitting logs yet — keep polling
    }
    if (log.length > seen) {
      console.log('[SR][collector]', log.slice(seen).trimEnd());
      seen = log.length;
    }
    const match = log.match(/\/host(\/\S+\.tar\.gz)/);
    if (match) {
      return `/host${match[1]}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return null;
}

function execCollect(pod: any, command: string[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const base = pod?.links?.view;
    if (!base) {
      reject(new Error('pod has no exec (links.view) endpoint'));
      return;
    }

    // addParams' QueryParams type only allows string values, so pass the flags as
    // strings. `command` is repeated once per argument, which addParam handles.
    const url = addParam(
      addParams(`${base.replace(/^http/, 'ws')}/exec`, {
        container: pod.defaultContainerName,
        stdout: '1',
        stdin: '0',
        stderr: '1',
        tty: '0'
      }),
      'command',
      command
    );

    const socket = new Socket(url, false, 0, 'base64.channel.k8s.io');
    const chunks: Uint8Array[] = [];

    socket.addEventListener(EVENT_MESSAGE, (e: any) => {
      const channel = e.detail.data.substr(0, 1);
      const payload = e.detail.data.substr(1);
      if (`${channel}` === '1') {
        // stdout: each frame's payload is base64 of raw bytes -> decode to bytes
        const bin = atob(payload);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        chunks.push(bytes);
      } else if (`${channel}` === '2') {
        console.warn('[SR][collector:stderr]', base64Decode(payload));
      } else if (`${channel}` === '3') {
        console.log('[SR][collector:status]', base64Decode(payload));
      }
    });
    socket.addEventListener(EVENT_DISCONNECTED, () => {
      const total = chunks.reduce((sum, c) => sum + c.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        out.set(c, offset);
        offset += c.length;
      }
      resolve(out);
    });
    socket.addEventListener(EVENT_CONNECT_ERROR, (e: any) => reject(e));

    socket.connect();
  });
}

function buildFilename(tarballPath: string, nodeName: string): string {
  const original = tarballPath.split('/').pop() || '';
  const timestamp = original.match(/-(\d{4}-\d{2}-\d{2}_\d{2}_\d{2}_\d{2}\.tar\.gz)$/);

  return timestamp ? `${nodeName}-${timestamp[1]}` : original || `${nodeName}.tar.gz`;
}

function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/gzip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function showProgress(model: any, message: string): void {
  model.$dispatch('promptModal', {
    component: 'SrCollecting',
    componentProps: { message },
    closeOnClickOutside: false,
    modalWidth: '450px'
  });
}

function closeProgress(model: any): void {
  model.$dispatch('promptModal', null);
}

function promptForDays(model: any): Promise<number | null> {
  return new Promise((resolve) => {
    model.$dispatch('promptModal', {
      component: 'SrBundleOptions',
      componentProps: {
        onSubmit: (days: number) => resolve(days),
        onCancel: () => resolve(null)
      },
      closeOnClickOutside: true,
      modalWidth: '450px'
    });
  });
}

async function waitForPodRunning(model: any, id: string, timeoutMs = 120000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let pod: any = null;
    try {
      // force: true bypasses the store cache so we see the live phase
      pod = await model.$dispatch('find', { type: 'pod', id, opt: { force: true } });
    } catch {
      // 404 until the Pod is registered by the API — keep polling
    }
    if (pod?.status?.phase === 'Running') {
      return pod;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
}

const collectAction: any = {
  labelKey: 'sr.supportBundle.action',
  icon: 'icon-download',
  enabled: true,
  multiple: true,
  weight: -11,
  async invoke(_opts: any, resources: any[]): Promise<void> {
    const days = await promptForDays(resources[0]);
    if (days === null) {
      return;
    }

    const registry = await getConfiguredRegistry(resources[0]);

    const statuses = resources.map((node) => ({
      name: node.metadata?.name || node.id,
      status: 'Starting'
    }));

    const updateProgress = () => {
      const collecting = statuses.filter((s) => s.status === 'Collecting').map((s) => s.name);
      const failed = statuses.filter((s) => s.status === 'Failed').map((s) => s.name);

      let msg = '';
      if (collecting.length) {
        msg += `Collecting: ${collecting.join(', ')}. `;
      }
      if (failed.length) {
        msg += `Failed: ${failed.join(', ')}. `;
      }
      showProgress(resources[0], msg.trim());
    };

    const runForNode = async (node: any, index: number, logDays: number, imageRegistry: string) => {
      const nodeName = node.metadata?.name || node.id;
      const podName = `log-collector-${nodeName}-${Math.random().toString(36).slice(2, 7)}`;
      const podId = `${LOG_COLLECTOR_NAMESPACE}/${podName}`;
      let pod: any = null;
      let created = false;

      statuses[index].status = 'Starting';
      updateProgress();

      try {
        const currentCluster = node.$rootGetters['currentCluster'];

        console.log(`[SR] creating debug pod ${podId} on node ${nodeName} (cluster ${currentCluster?.id})`);
        await currentCluster.doAction('apply', {
          yaml: jsyaml.dump(logCollectorPodSpec(nodeName, podName, logDays, imageRegistry)),
          defaultNamespace: LOG_COLLECTOR_NAMESPACE
        });
        created = true;

        statuses[index].status = 'StartingPod';
        updateProgress();
        pod = await waitForPodRunning(node, podId);
        if (!pod) {
          throw new Error(`Pod did not reach Running state in time: ${podId}`);
        }

        console.log(`[SR] collecting; waiting for the tarball path in the pod log for node ${nodeName}...`);
        statuses[index].status = 'Collecting';
        updateProgress();
        const tarballPath = await waitForTarball(node, pod);
        if (!tarballPath) {
          throw new Error(`Collector did not report a tarball in time for node ${nodeName}`);
        }

        console.log(`[SR] downloading tarball from pod for node ${nodeName}:`, tarballPath);
        statuses[index].status = 'Downloading';
        updateProgress();
        const data = await execCollect(pod, ['cat', tarballPath]);
        const filename = buildFilename(tarballPath, nodeName);
        downloadBytes(data, filename);
        console.log(`[SR] downloaded ${filename} (${data.length} bytes)`);

        statuses[index].status = 'Completed';
        updateProgress();
      } catch (err) {
        console.error(`[SR] support bundle collection failed for node ${nodeName}:`, err);
        statuses[index].status = 'Failed';
        updateProgress();
      } finally {
        if (created) {
          try {
            statuses[index].status = 'Deleting';
            updateProgress();
            pod = pod || (await node.$dispatch('find', { type: 'pod', id: podId, opt: { force: true } }));
            console.log('[SR] deleting debug pod:', podId);
            await pod.remove();
          } catch (e) {
            console.error('[SR] failed to delete debug pod:', podId, e);
          }
        }
        statuses[index].status = statuses[index].status === 'Deleting' ? 'Completed/Done' : statuses[index].status;
        updateProgress();
      }
    };

    try {
      await Promise.all(resources.map((n, i) => runForNode(n, i, days, registry)));
    } catch (err) {
      console.error('[SR] bulk collection outer error:', err);
    } finally {
      closeProgress(resources[0]);
    }
  }
};

export function registerSupportBundleActions(plugin: IPlugin): void {
  plugin.register('dialog', 'SrCollecting', () => import('../components/SrCollecting.vue'));
  plugin.register('dialog', 'SrBundleOptions', () => import('../components/SrBundleOptions.vue'));
  const nodeLocation = { resource: ['node'] };
  plugin.addAction(ActionLocation.TABLE, nodeLocation, collectAction);
}

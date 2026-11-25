import { CATALOG } from '@shell/config/types';
import { NotificationLevel } from '@shell/types/notifications';
import Socket, { EVENT_DISCONNECTED, EVENT_MESSAGE, EVENT_CONNECT_ERROR } from '@shell/utils/socket';
import { addParam, addParams } from '@shell/utils/url';
import { base64Decode } from '@shell/utils/crypto';
import { SR_CHARTS } from '../config/types';
import { rancherVersion } from './upgrade-warnings';

const jsyaml = require('js-yaml');

const LOG_COLLECTOR_IMAGE = 'rancherlabs/swiss-army-knife';
const LOG_COLLECTOR_NAMESPACE = 'cattle-system';
const LOG_COLLECTOR_CONTAINER = 'log-collector';

const HOST_MOUNT_PATH = '/host';

const BUNDLE_STORAGE_LIMIT = '16Gi';
const BUNDLE_VOLUME_NAME = 'bundle';
const BUNDLE_HOST_PATH = '/tmp/sr-bundle';
const BUNDLE_MOUNT_PATH = `${HOST_MOUNT_PATH}${BUNDLE_HOST_PATH}`;

const BLOB_FOLD_BYTES = 64 * 1024 * 1024;

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
      volumes: [
        { name: 'host-root', hostPath: { path: '/' } },
        { name: BUNDLE_VOLUME_NAME, emptyDir: { sizeLimit: BUNDLE_STORAGE_LIMIT } }
      ],
      containers: [
        {
          name: LOG_COLLECTOR_CONTAINER,
          image,
          command: ['bash', '-c', `rancher2_logs_collector.sh -D -s ${days} -d ${BUNDLE_HOST_PATH}`],
          resources: {
            requests: { 'ephemeral-storage': '1Gi', memory: '250Mi' },
            limits: { 'ephemeral-storage': BUNDLE_STORAGE_LIMIT, memory: '1Gi' }
          },
          volumeMounts: [
            { name: 'host-root', mountPath: HOST_MOUNT_PATH },
            { name: BUNDLE_VOLUME_NAME, mountPath: BUNDLE_MOUNT_PATH }
          ]
        }
      ]
    }
  };
}

export async function getConfiguredRegistry(model: any): Promise<string> {
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

    return registry;
  } catch (err) {
    console.error('[SR] registry lookup failed:', err);

    return '';
  }
}

function podUrl(clusterId: string, id: string): string {
  return `/k8s/clusters/${encodeURIComponent(clusterId)}/v1/pods/${id}`;
}

// Resolves to null while the pod doesn't exist (404).
async function getPod(model: any, url: string): Promise<any | null> {
  try {
    return await model.$dispatch('request', { url });
  } catch (err: any) {
    if ((err?.status || err?._status) === 404) {
      return null;
    }
    throw err;
  }
}

async function fetchPodLog(model: any, pod: any): Promise<string> {
  const url = addParams(`${pod.links.view}/log`, { container: LOG_COLLECTOR_CONTAINER });
  const res = await model.$dispatch('request', { url, responseType: 'text' });

  return typeof res?.data === 'string' ? res.data : '';
}

async function waitForTarball(model: any, url: string, pod: any, timeoutMs = 900000): Promise<string | null> {
  const start = Date.now();
  let seen = 0;
  let consecutiveLogFailures = 0;
  const MAX_CONSECUTIVE_LOG_FAILURES = 5;
  let consecutiveStatusFailures = 0;
  const MAX_CONSECUTIVE_STATUS_FAILURES = 5;

  while (Date.now() - start < timeoutMs) {
    let log = '';
    try {
      log = await fetchPodLog(model, pod);
      consecutiveLogFailures = 0;
    } catch {
      consecutiveLogFailures++;
      if (consecutiveLogFailures >= MAX_CONSECUTIVE_LOG_FAILURES) {
        throw new Error(`Lost contact with pod ${pod.id} logs (node may be unreachable)`);
      }
    }
    if (log.length > seen) {
      console.log('[SR][collector]', log.slice(seen).trimEnd());
      seen = log.length;
    }
    const match = log.match(/\/host(\/\S+\.tar\.gz)/);
    if (match) {
      return `/host${match[1]}`;
    }

    let freshPod: any;
    try {
      // A failed log fetch above is ambiguous (container not started yet vs. pod
      // gone), so confirm the pod itself still exists before continuing to poll.
      freshPod = await getPod(model, url);
      consecutiveStatusFailures = 0;
    } catch (err: any) {
      consecutiveStatusFailures++;
      if (consecutiveStatusFailures >= MAX_CONSECUTIVE_STATUS_FAILURES) {
        throw new Error(`Lost contact with pod ${pod.id}: ${err?.message || err?._statusText || String(err)}`, {
          cause: err
        });
      }
    }
    if (freshPod === null) {
      throw new Error(`Pod ${pod.id} no longer exists`);
    }
    if (freshPod?.status?.phase && freshPod.status.phase !== 'Running') {
      // restartPolicy is Never, so once the container leaves Running without
      // having printed a tarball path, it never will. Exceeding the storage limit
      // shows up here as an eviction, so pass the reason on.
      const reason = freshPod.status.reason
        ? `: ${freshPod.status.reason} ${freshPod.status.message || ''}`.trim()
        : '';

      throw new Error(`Pod ${pod.id} exited with phase ${freshPod.status.phase} before producing a tarball${reason}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return null;
}

function execCollect(pod: any, command: string[]): Promise<Blob> {
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
        container: LOG_COLLECTOR_CONTAINER,
        stdout: '1',
        stdin: '0',
        stderr: '1',
        tty: '0'
      }),
      'command',
      command
    );

    const socket = new Socket(url, false, 0, 'base64.channel.k8s.io');
    let parts: BlobPart[] = [];
    let pending = 0;

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
        parts.push(bytes);
        pending += bytes.length;
        if (pending >= BLOB_FOLD_BYTES) {
          parts = [new Blob(parts)];
          pending = 0;
        }
      } else if (`${channel}` === '2') {
        console.warn('[SR][collector:stderr]', base64Decode(payload));
      } else if (`${channel}` === '3') {
        console.log('[SR][collector:status]', base64Decode(payload));
      }
    });
    socket.addEventListener(EVENT_DISCONNECTED, () => {
      resolve(new Blob(parts, { type: 'application/gzip' }));
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

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const PHASE_PROGRESS = {
  starting: 5,
  startingPod: 15,
  collecting: 50,
  downloading: 85
};

function t(model: any, key: string, args?: Record<string, any>): string {
  return model.$rootGetters['i18n/t'](key, args);
}

// Tracks one row in the Notification Center per node so progress stays visible
// (and survives page navigation) instead of blocking the UI with a modal.
async function notifyTask(model: any, id: string, title: string, message: string, progress: number): Promise<void> {
  await model.$dispatch(
    'notifications/add',
    {
      id,
      title,
      message,
      level: NotificationLevel.Task,
      progress
    },
    { root: true }
  );
}

async function updateTask(model: any, id: string, message: string, progress: number): Promise<void> {
  await model.$dispatch('notifications/update', { id, message, progress }, { root: true });
}

async function removeAddTask(
  model: any,
  completed: boolean,
  id: string,
  title: string,
  message: string
): Promise<void> {
  await model.$dispatch('notifications/remove', id, { root: true });
  const notification = completed
    ? { id, title, message, level: NotificationLevel.Success, progress: 100 }
    : { id, title, message, level: NotificationLevel.Error };
  await model.$dispatch('notifications/add', notification, { root: true });
}

async function completeTask(model: any, id: string, title: string, message: string): Promise<void> {
  await removeAddTask(model, true, id, title, message);
}

async function failTask(model: any, id: string, title: string, message: string): Promise<void> {
  await removeAddTask(model, false, id, title, message);
}

async function waitForPodRunning(model: any, url: string, timeoutMs = 120000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // null (404) until the Pod is registered by the API — keep polling
    const pod = await getPod(model, url);
    if (pod?.status?.phase === 'Running') {
      return pod;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
}

export type BundleProgressState = 'running' | 'success' | 'error';

export interface BundleProgress {
  state: BundleProgressState;
  message: string;
  progress: number;
  filename?: string;
}

export interface CollectBundleOptions {
  // Show progress in the Rancher Notification Center (Rancher 2.12+)
  notify?: boolean;
  // Called on every phase change, e.g. to render progress inline on a page
  // eslint-disable-next-line no-unused-vars
  onProgress?: (progress: BundleProgress) => void;
}

// Collects a support bundle from one node of `cluster` (a management.cattle.io.cluster
// model) and downloads it in the browser. `ctx` is anything with $dispatch and
// $rootGetters: a resource model, or storeContext() for a page.
export async function collectNodeBundle(
  ctx: any,
  cluster: any,
  nodeName: string,
  logDays: number,
  imageRegistry: string,
  opts: CollectBundleOptions = {}
): Promise<void> {
  const { notify = true, onProgress } = opts;
  const podName = `log-collector-${nodeName}-${Math.random().toString(36).slice(2, 7)}`;
  const podId = `${LOG_COLLECTOR_NAMESPACE}/${podName}`;
  const title = t(ctx, 'sr.supportBundle.taskTitle', { node: nodeName });
  const url = podUrl(cluster?.id, podId);
  let created = false;

  const report = async (message: string, progress: number, first = false): Promise<void> => {
    onProgress?.({ state: 'running', message, progress });
    if (notify) {
      await (first ? notifyTask(ctx, podName, title, message, progress) : updateTask(ctx, podName, message, progress));
    }
  };

  await report(t(ctx, 'sr.supportBundle.phaseStarting'), PHASE_PROGRESS.starting, true);

  try {
    console.log(`[SR] creating log collector pod ${podId} on node ${nodeName} (cluster ${cluster?.id})`);
    await cluster.doAction('apply', {
      yaml: jsyaml.dump(logCollectorPodSpec(nodeName, podName, logDays, imageRegistry)),
      defaultNamespace: LOG_COLLECTOR_NAMESPACE
    });
    created = true;

    await report(t(ctx, 'sr.supportBundle.phaseStartingPod'), PHASE_PROGRESS.startingPod);
    const pod = await waitForPodRunning(ctx, url);
    if (!pod) {
      throw new Error(`Pod did not reach Running state in time: ${podId}`);
    }

    console.log(`[SR] collecting; waiting for the tarball path in the pod log for node ${nodeName}...`);
    await report(t(ctx, 'sr.supportBundle.phaseCollecting'), PHASE_PROGRESS.collecting);
    const tarballPath = await waitForTarball(ctx, url, pod);
    if (!tarballPath) {
      throw new Error(`Collector did not report a tarball in time for node ${nodeName}`);
    }

    console.log(`[SR] downloading tarball from pod for node ${nodeName}:`, tarballPath);
    await report(t(ctx, 'sr.supportBundle.phaseDownloading'), PHASE_PROGRESS.downloading);
    const data = await execCollect(pod, ['cat', tarballPath]);
    const filename = buildFilename(tarballPath, nodeName);
    downloadBlob(data, filename);
    console.log(`[SR] downloaded ${filename} (${data.size} bytes)`);

    const message = t(ctx, 'sr.supportBundle.completed', { filename });
    onProgress?.({ state: 'success', message, progress: 100, filename });
    if (notify) {
      await completeTask(ctx, podName, title, message);
    }
  } catch (err: any) {
    console.error(`[SR] support bundle collection failed for node ${nodeName}:`, err);
    const message = t(ctx, 'sr.supportBundle.failed', { error: err?.message || String(err) });
    onProgress?.({ state: 'error', message, progress: 100 });
    if (notify) {
      await failTask(ctx, podName, title, message);
    }
  } finally {
    if (created) {
      try {
        console.log('[SR] deleting log collector pod:', podId);
        await ctx.$dispatch('request', { url, method: 'delete' });
      } catch (e) {
        console.error('[SR] failed to delete log collector pod:', podId, e);
      }
    }
  }
}

// Adapts the root Vuex store to the $dispatch/$rootGetters interface the
// collector uses on resource models, so pages can call collectNodeBundle().
export function storeContext(store: any): any {
  return {
    $rootGetters: store.getters,
    $dispatch: (action: string, payload: any, opts?: { root?: boolean }) =>
      store.dispatch(opts?.root ? action : `management/${action}`, payload)
  };
}

export function hasNotificationCenter(resource: any): boolean {
  const parsed = rancherVersion(resource.$rootGetters).match(/^v?(\d+)\.(\d+)/);

  if (!parsed) {
    return true;
  }

  const [major, minor] = parsed.slice(1).map(Number);

  return major > 2 || (major === 2 && minor >= 12);
}

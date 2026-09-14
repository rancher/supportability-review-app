import { MANAGEMENT } from '@shell/config/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const WARNING_REASON = 'CertificateExpirationWarning';

const ISO_TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g;
/** `<service>/<file>: certificate <subject> will expire within N days at <date>` */
const CERT_FILE = /([^\s:]+\/[^\s:]+):\s*certificate/;

/** What a cluster's certificate monitor is currently reporting */
export type CertEventRecord = {
  /** Set while the request is in flight */
  pending?: boolean;
  /** Whether the cluster raised a certificate expiry warning at all */
  warned?: boolean;
  /** Earliest notAfter named in the warnings, as an ISO 8601 string */
  expiry?: string;
  /** Node that raised the warning */
  node?: string;
  /** Certificate file named in the warning, i.e. `kube-apiserver/serving-kube-apiserver.crt` */
  filename?: string;
  /** When the events were last read, as an ISO 8601 string */
  checkedAt?: string;
  /** Why the events could not be read */
  error?: string;
};

export function mgmtClusterIdFor(row: any): string | undefined {
  return row?.mgmtClusterId || (row?.type === MANAGEMENT.CLUSTER ? row.id : undefined);
}

export function reportsCertExpiryEvents(version?: string): boolean {
  if (!/\+(rke2|k3s)/.test(version || '')) {
    return false;
  }

  const parsed = (version || '').match(/^v?(\d+)\.(\d+)\./);

  if (!parsed) {
    return false;
  }

  const major = Number(parsed[1]);
  const minor = Number(parsed[2]);

  return major > 1 || (major === 1 && minor >= 27);
}

export function certRenewDays(version?: string): number {
  const parsed = (version || '').match(/^v?(\d+)\.(\d+)\./);

  if (parsed && Number(parsed[1]) === 1 && Number(parsed[2]) <= 29) {
    return 90;
  }

  return 120;
}

export function daysUntilDate(iso: string): number | undefined {
  const time = Date.parse(iso);

  if (isNaN(time)) {
    return undefined;
  }

  return Math.round((time - Date.now()) / MS_PER_DAY);
}

type Parsed = { time: number; expiry: string; filename?: string };

function earliestInMessage(message: string): Parsed | undefined {
  let best: Parsed | undefined;

  for (const line of (message || '').split('\n')) {
    // Skips the "is not valid before <NotBefore>" lines, which say nothing about expiry
    if (!line.includes('expire')) {
      continue;
    }

    const stamps = line.match(ISO_TIMESTAMP);

    if (!stamps) {
      continue;
    }

    // The expiry is the last timestamp on the line
    const expiry = stamps[stamps.length - 1];
    const time = Date.parse(expiry);

    if (isNaN(time) || (best && time >= best.time)) {
      continue;
    }

    best = { time, expiry, filename: line.match(CERT_FILE)?.[1] };
  }

  return best;
}

export function earliestInEvents(items: any[]): Omit<CertEventRecord, 'checkedAt'> {
  let best: (Parsed & { node?: string }) | undefined;

  for (const event of items || []) {
    if (event?.reason !== WARNING_REASON) {
      continue;
    }

    const parsed = earliestInMessage(event?.message);

    if (parsed && (!best || parsed.time < best.time)) {
      best = { ...parsed, node: event?.involvedObject?.name };
    }
  }

  if (!best) {
    return { warned: false };
  }

  return {
    warned: true,
    expiry: best.expiry,
    node: best.node,
    filename: best.filename
  };
}

export async function fetchCertExpiryEvents(dispatch: any, clusterId: string): Promise<CertEventRecord> {
  const selector = encodeURIComponent(`reason=${WARNING_REASON}`);
  const res = await dispatch(
    'management/request',
    { url: `/k8s/clusters/${clusterId}/api/v1/events?fieldSelector=${selector}` },
    { root: true }
  );

  return { ...earliestInEvents(res?.items), checkedAt: new Date().toISOString() };
}

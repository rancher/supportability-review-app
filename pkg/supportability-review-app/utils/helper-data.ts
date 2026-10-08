import eomEolData from '../config/eom-eol.json';
import rke2OsMatrix from '../config/rke2-rancher-os-matrix.json';
import k3sOsMatrix from '../config/k3s-rancher-os-matrix.json';
import { SUPPORTABILITY_REVIEW_STORE } from '../config/types';

// End of maintenance and end of life per provider and version, i.e.
// `{ k3s: { '1.35': { eom: '2026/12/28', eol: '2027/06/28' } } }`
export type EomEol = Record<string, Record<string, { eom: string | null; eol: string | null }>>;

// Operating systems each Rancher patch release supports, i.e.
// `{ '2.14.5': { Ubuntu: ['24.04', '22.04'], ... } }`
export type OsMatrix = Record<string, Record<string, string[]>>;

export type HelperData = {
  'eom-eol': EomEol;
  'rke2-rancher-os-matrix': OsMatrix;
  'k3s-rancher-os-matrix': OsMatrix;
};

export type HelperDataName = keyof HelperData;

/** What the operator served for one helper data file */
export type HelperDataRecord = {
  /** Set while the request is in flight */
  pending?: boolean;
  /** The data the operator served, undefined until it has been read */
  data?: any;
  /** When the data was last read, as an ISO 8601 string */
  checkedAt?: string;
  /** Why the data could not be read */
  error?: string;
};

// The copies this extension was built with. They are used until the operator
// serves newer ones, and whenever it cannot: the operator is not installed, or
// the user may not reach its service.
export const BUNDLED_HELPER_DATA: HelperData = {
  'eom-eol': eomEolData,
  'rke2-rancher-os-matrix': rke2OsMatrix,
  'k3s-rancher-os-matrix': k3sOsMatrix
};

// The operator's bundle store serves the helper data of the newest analyzer image.
const HELPER_DATA_URL =
  '/k8s/clusters/local/api/v1/namespaces/sr-operator-system/services/http:sr-bundle-app-frontend-service:80/proxy/helper';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// Both kinds of helper data are objects of objects, i.e. provider -> version for
// eom-eol and Rancher version -> OS for the matrices. Anything else would break
// the columns, so the bundled copy is kept instead.
function isHelperData(data: unknown): boolean {
  return isObject(data) && Object.keys(data).length > 0 && Object.values(data).every(isObject);
}

export async function fetchHelperData(dispatch: any, name: HelperDataName): Promise<any> {
  const data = await dispatch(
    'management/request',
    { url: `${HELPER_DATA_URL}?name=${encodeURIComponent(name)}`, redirectUnauthorized: false },
    { root: true }
  );

  if (!isHelperData(data)) {
    throw new Error(`unexpected ${name} data`);
  }

  return data;
}

// `getters` is the root getters. The bundled copy is returned when the operator
// has not served the data, including when Rancher still holds an older build of
// this extension's store module without the getter.
export function helperData<N extends HelperDataName>(getters: any, name: N): HelperData[N] {
  return getters[`${SUPPORTABILITY_REVIEW_STORE}/helperData`]?.(name)?.data || BUNDLED_HELPER_DATA[name];
}

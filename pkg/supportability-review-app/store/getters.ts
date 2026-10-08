import { CertEventRecord } from '../utils/cert-expiry';
import { NodesRecord } from '../utils/upgrade-warnings';
import { HelperDataName, HelperDataRecord } from '../utils/helper-data';

export default {
  createClusterElements: (state: any) => state.createClusterElements,
  certEvents:
    (state: any) =>
    (clusterId: string): CertEventRecord | undefined =>
      state.certEvents[clusterId],
  nodes:
    (state: any) =>
    (clusterId: string): NodesRecord | undefined =>
      state.nodes[clusterId],
  helperData:
    (state: any) =>
    (name: HelperDataName): HelperDataRecord | undefined =>
      state.helperData[name]
};

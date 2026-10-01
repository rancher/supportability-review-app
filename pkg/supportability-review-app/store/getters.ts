import { CertEventRecord } from '../utils/cert-expiry';
import { NodesRecord } from '../utils/upgrade-warnings';

export default {
  createClusterElements: (state: any) => state.createClusterElements,
  certEvents:
    (state: any) =>
    (clusterId: string): CertEventRecord | undefined =>
      state.certEvents[clusterId],
  nodes:
    (state: any) =>
    (clusterId: string): NodesRecord | undefined =>
      state.nodes[clusterId]
};

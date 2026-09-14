import { CertEventRecord } from '../utils/cert-expiry';

export default {
  createClusterElements: (state: any) => state.createClusterElements,
  certEvents:
    (state: any) =>
    (clusterId: string): CertEventRecord | undefined =>
      state.certEvents[clusterId]
};

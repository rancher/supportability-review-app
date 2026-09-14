import { CertEventRecord } from '../utils/cert-expiry';

export default {
  updateCreateClusterElements(state: any, val: any) {
    state.createClusterElements = val;
  },

  updateCertEvents(state: any, { clusterId, record }: { clusterId: string; record: CertEventRecord }) {
    state.certEvents = { ...state.certEvents, [clusterId]: record };
  }
};

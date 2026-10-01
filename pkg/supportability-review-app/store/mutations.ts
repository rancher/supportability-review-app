import { CertEventRecord } from '../utils/cert-expiry';
import { NodesRecord } from '../utils/upgrade-warnings';

export default {
  updateCreateClusterElements(state: any, val: any) {
    state.createClusterElements = val;
  },

  updateCertEvents(state: any, { clusterId, record }: { clusterId: string; record: CertEventRecord }) {
    state.certEvents = { ...state.certEvents, [clusterId]: record };
  },

  updateNodes(state: any, { clusterId, record }: { clusterId: string; record: NodesRecord }) {
    state.nodes = { ...state.nodes, [clusterId]: record };
  }
};

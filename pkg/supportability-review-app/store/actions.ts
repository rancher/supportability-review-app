import { fetchCertExpiryEvents } from '../utils/cert-expiry';

const CERT_EVENTS_TTL_MS = 5 * 60 * 1000;

export default {
  updateCreateClusterElements({ commit }: any, val: any) {
    commit('updateCreateClusterElements', val);
  },

  async fetchCertEvents({ state, commit, dispatch }: any, clusterId: string) {
    if (!clusterId) {
      return;
    }

    const existing = state.certEvents[clusterId];
    const age = existing?.checkedAt ? Date.now() - Date.parse(existing.checkedAt) : Infinity;

    if (existing?.pending || age < CERT_EVENTS_TTL_MS) {
      return;
    }

    commit('updateCertEvents', { clusterId, record: { pending: true } });

    try {
      commit('updateCertEvents', { clusterId, record: await fetchCertExpiryEvents(dispatch, clusterId) });
    } catch (err: any) {
      console.error(`[SR] could not read certificate expiry events for cluster ${clusterId}:`, err);
      commit('updateCertEvents', {
        clusterId,
        record: { checkedAt: new Date().toISOString(), error: err?.message || String(err) }
      });
    }
  }
};

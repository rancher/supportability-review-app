<script>
import { BadgeState } from '@components/BadgeState';
import { SUPPORTABILITY_REVIEW_STORE } from '../config/types';
import { certRenewDays, daysUntilDate, mgmtClusterIdFor, reportsCertExpiryEvents } from '../utils/cert-expiry';

const CRITICAL_DAYS = 30;

export default {
  name: 'CertificateExpiry',
  components: { BadgeState },
  props: {
    row: {
      type: Object,
      default: null
    }
  },
  computed: {
    clusterId() {
      return mgmtClusterIdFor(this.row);
    },
    events() {
      return this.clusterId
        ? this.$store.getters[`${SUPPORTABILITY_REVIEW_STORE}/certEvents`](this.clusterId)
        : undefined;
    },
    version() {
      return this.row?.kubernetesVersionRaw || this.row?.kubernetesVersion;
    },
    monitored() {
      return reportsCertExpiryEvents(this.version);
    },
    warned() {
      return !!this.events?.expiry;
    },
    healthy() {
      return !this.warned && !!this.events?.checkedAt && !this.events.error && this.monitored;
    },
    daysToExpiry() {
      return this.events?.expiry ? daysUntilDate(this.events.expiry) : undefined;
    },
    color() {
      return this.daysToExpiry <= CRITICAL_DAYS ? 'bg-error' : 'bg-warning';
    },
    label() {
      return this.warned
        ? this.t('sr.certExpiry.days', { days: this.daysToExpiry })
        : this.t('sr.certExpiry.moreThan', { days: certRenewDays(this.version) });
    },
    tooltip() {
      if (this.warned) {
        const { expiry, node, filename } = this.events;

        return this.t('sr.certExpiry.eventTooltip', {
          expiry: new Date(expiry).toLocaleString(),
          node,
          filename: filename || '—'
        });
      }
      if (this.healthy) {
        return this.t('sr.certExpiry.okTooltip', { days: certRenewDays(this.version) });
      }
      if (this.events?.error) {
        return this.t('sr.certExpiry.errorTooltip', { error: this.events.error });
      }

      return this.t('sr.certExpiry.unmonitoredTooltip');
    }
  },
  created() {
    this.$store.dispatch(`${SUPPORTABILITY_REVIEW_STORE}/fetchCertEvents`, this.clusterId);
  }
};
</script>

<template>
  <div v-clean-tooltip="{ content: tooltip, placement: 'left' }">
    <BadgeState v-if="warned" :color="color" :label="label" />
    <BadgeState v-else-if="healthy" color="bg-success" :label="label" />
    <span v-else class="text-muted">{{ t('sr.certExpiry.none') }}</span>
  </div>
</template>

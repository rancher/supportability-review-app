import { IPlugin, TableColumnLocation } from '@shell/core/types';

const CLUSTER_LIST = { resource: ['provisioning.cattle.io.cluster'] };

export function registerCertExpiryColumn(plugin: IPlugin): void {
  plugin.register('formatters', 'CertificateExpiry', () => import('../components/CertificateExpiry.vue'));

  const column = {
    name: 'cert-expiry',
    labelKey: 'tableHeaders.certExpiry',
    formatter: 'CertificateExpiry',
    search: false,
    sort: false,
    width: 130
  };

  plugin.addTableColumn(TableColumnLocation.RESOURCE, CLUSTER_LIST, column, column);
}

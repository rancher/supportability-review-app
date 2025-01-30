import { STATE, NAME as NAME_COL, AGE, NAMESPACE as NAMESPACE_COL } from '@shell/config/table-headers';
import { SUPPORTABILITY_REVIEW_PRODUCT_NAME, SUPPORTABILITY_REVIEW_CRD_IDS, SR_APP_PAGES } from './config/types';
import { rootRoute, createRoute } from './utils/custom-routing';

export function init($plugin, store) {
  const { product, configureType, virtualType, basicType, headers } = $plugin.DSL(
    store,
    SUPPORTABILITY_REVIEW_PRODUCT_NAME
    // SUPPORTABILITY_REVIEW_PRODUCT_FULL_NAME,
  );

  function getBundleSizeString(row) {
    if (row.status === undefined || row.status.fileSize === undefined) return '---';

    const one_kilo = 1024;
    const one_mega = one_kilo * 1024;
    const one_giga = one_mega * 1024;
    const size = row.status.fileSize;

    if (size < one_kilo) {
      return size + ' B';
    } else if (size < one_mega) {
      return (size / one_kilo).toFixed(2) + ' KiB';
    } else if (size < one_giga) {
      return (size / one_mega).toFixed(2) + ' MiB';
    } else {
      return size + ' B';
    }
  }

  // app in sidebar
  product({
    icon: 'service',
    inStore: 'management',
    showClusterSwitcher: false,
    weight: 100,
    to: rootRoute()
  });

  // dashboard menu entry in SR App
  virtualType({
    labelKey: 'sr.menuLabels.dashboard',
    // label: store.getters["i18n/t"]("sr.menuLabels.dashboard"),
    name: SR_APP_PAGES.DASHBOARD,
    route: rootRoute()
  });

  // defining a k8s resource as page
  configureType(SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE, {
    displayName: store.getters['i18n/t'](`typeLabel."${SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE}"`),
    isCreatable: true,
    isEditable: false,
    isRemovable: true
  });
  headers(SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE, [
    STATE,
    NAME_COL,
    {
      name: 'Cluster',
      labelKey: 'tableHeaders.clusterCount',
      getValue: (row) => row.status?.clusterCount || '---',
      sort: ['status.clusterCount']
    },
    {
      name: 'Pass',
      labelKey: 'tableHeaders.pass',
      getValue: (row) => row.status?.checkResult || '---',
      sort: ['status.checkResult']
    },
    {
      name: 'Size',
      labelKey: 'tableHeaders.bundleSize',
      getValue: (row) => getBundleSizeString(row),
      sort: ['status.fileSize']
    },
    AGE
  ]);

  virtualType({
    label: store.getters['i18n/t']('sr.menuLabels.viewReport'),
    name: SR_APP_PAGES.VIEW_REPORT,
    route: createRoute('view-report')
  });

  // registering the defined pages as side-menu entries
  basicType([
    SR_APP_PAGES.DASHBOARD,
    SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE
    // SR_APP_PAGES.VIEW_REPORT,
  ]);
}

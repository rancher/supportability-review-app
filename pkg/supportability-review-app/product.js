import { STATE, NAME as NAME_COL, AGE } from '@shell/config/table-headers';
import { SUPPORTABILITY_REVIEW_PRODUCT_NAME, SUPPORTABILITY_REVIEW_CRD_IDS, SR_APP_PAGES } from './config/types';
import { rootRoute, createRoute } from './utils/custom-routing';
const stsIcon = require('./icon.svg');
const styleSheet = document.createElement('style');
// css fix for SVG icon in Rancher 2.8 and 2.9
// it also fixes colors for both light and dark theme
const css = `
  .side-menu .category div a > img {
    display: block;
    width: 42px;
    font-size: 25px;
    margin-right: 14px;
  }
  .theme-dark .side-menu .category div a > img {
    filter: brightness(0) saturate(100%) invert(39%) sepia(90%) saturate(399%) hue-rotate(160deg) brightness(93%) contrast(95%)
  }
  .theme-dark .side-menu .category div a:hover > img, .side-menu .category div a.active-menu-link > img {
    filter:  brightness(0) invert(1);
  }
`;

styleSheet.textContent = css;
document.head.appendChild(styleSheet);
export function init($plugin, store) {
  const { product, configureType, virtualType, basicType, weightType, headers } = $plugin.DSL(
    store,
    SUPPORTABILITY_REVIEW_PRODUCT_NAME
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
    svg: stsIcon,
    inStore: 'management',
    showClusterSwitcher: false,
    weight: 100,
    to: rootRoute()
  });

  // dashboard menu entry in SR App
  virtualType({
    label: store.getters['i18n/t']('sr.menuLabels.dashboard'),
    name: SR_APP_PAGES.DASHBOARD,
    weight: 10,
    route: rootRoute()
  });

  // defining a k8s resource as page
  weightType(SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE, 9, true);
  configureType(SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE, {
    isCreatable: true,
    isEditable: false,
    isRemovable: true,
    customRoute: createRoute('resource', { resource: SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE })
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

  // registering the defined pages as side-menu entries
  basicType([SR_APP_PAGES.DASHBOARD, SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE]);
}

import { STATE, NAME as NAME_COL, AGE } from '@shell/config/table-headers';
import { SUPPORTABILITY_REVIEW_PRODUCT_NAME, SUPPORTABILITY_REVIEW_CRD_IDS, SR_APP_PAGES } from './config/types';
import { rootRoute, createRoute } from './utils/custom-routing';
const stsIcon = require('./icon.svg');

// White-filled copy of the icon, inlined as a data URI so it can be used as a
// CSS mask. It must be a data URI (not the emitted icon URL) because the
// extension's assets are served from a different origin than the Rancher page
// (and over http on an https page); a cross-origin / mixed-content mask-image
// fails to load and the masked element renders nothing.
const stsIconMaskSvg = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 345.000000 345.000000" preserveAspectRatio="xMidYMid meet"><g transform="translate(0.000000,345.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none"><path d="M1073 2966 c-23 -28 -48 -155 -35 -168 13 -13 223 -22 303 -14 93 10 93 10 74 97 -24 107 -64 133 -137 89 -41 -25 -65 -25 -103 0 -41 27 -79 26 -102 -4z" /><path d="M810 2770 c-29 -55 25 -120 119 -143 51 -12 51 -12 51 -52 0 -22 10 -60 21 -85 42 -93 117 -144 214 -145 121 0 212 79 238 206 l13 64 41 7 c106 18 174 89 138 145 -20 29 -30 29 -180 -11 -85 -23 -121 -27 -235 -27 -115 0 -150 4 -235 27 -145 39 -171 41 -185 14z" /><path d="M2378 2539 c-3 -8 -48 -11 -138 -10 l-135 2 -27 -43 c-29 -45 -28 -62 3 -53 18 6 19 1 19 -70 l0 -76 48 3 c47 3 47 3 50 41 l3 37 90 0 89 0 0 -27 c0 -45 12 -55 61 -51 43 3 44 4 47 41 2 28 8 37 22 37 21 0 30 19 30 66 0 29 3 34 24 34 31 0 37 10 30 49 -7 34 -24 42 -24 12 0 -28 -18 -36 -39 -17 -12 11 -36 16 -74 16 -31 0 -57 5 -57 10 0 14 -17 13 -22 -1z" /><path d="M1016 2290 c-26 -10 -50 -21 -52 -23 -6 -6 233 -167 247 -167 13 0 249 152 249 161 0 6 -61 34 -96 44 -12 3 -51 -2 -88 -10 -59 -14 -72 -14 -125 0 -73 19 -75 18 -135 -5z" /><path d="M842 2118 c-154 -291 -144 -247 -112 -459 12 -74 25 -151 31 -171 10 -37 59 -88 85 -88 12 0 14 -62 14 -411 0 -264 4 -417 10 -430 10 -19 5 -19 -225 -19 l-236 0 3 83 3 82 174 3 c196 3 229 13 185 56 -13 13 -45 16 -190 16 l-175 0 3 100 3 101 178 2 c145 2 179 5 187 17 13 21 12 26 -6 45 -14 13 -42 16 -188 15 l-171 -2 -2 101 -1 101 173 0 c144 0 176 3 189 16 44 43 11 53 -185 56 l-174 3 -3 50 c-4 62 -25 81 -56 49 -14 -14 -16 -69 -16 -455 l0 -439 -68 0 c-79 0 -108 -15 -98 -48 l7 -22 1560 0 c1435 0 1560 1 1566 16 3 9 2 24 -4 33 -8 13 -33 17 -137 19 l-126 3 0 437 c0 380 -2 440 -16 460 -35 50 -104 12 -104 -58 l0 -40 -382 -2 -383 -3 0 -30 0 -30 385 -3 385 -2 -3 -105 -3 -105 -649 0 c-645 0 -649 0 -655 -20 -16 -51 -31 -50 664 -50 l646 0 -3 -100 -3 -100 -638 0 c-675 0 -678 0 -669 -46 3 -19 20 -19 655 -22 l652 -2 3 -90 3 -90 -702 0 -703 0 10 26 c6 15 10 233 10 550 l0 524 96 -48 c81 -40 94 -50 90 -67 -3 -11 -6 -57 -6 -102 l0 -82 -46 -3 c-54 -3 -77 -26 -55 -52 9 -11 31 -16 71 -16 l57 0 18 -41 c35 -76 115 -120 180 -99 46 15 105 84 130 151 29 78 27 232 -4 311 -30 76 -88 134 -144 143 -23 3 -87 27 -142 52 -114 52 -88 16 -201 283 -31 74 -60 139 -64 143 -4 5 -17 3 -29 -5 -21 -13 -21 -18 -21 -311 l0 -298 -112 4 c-62 3 -129 8 -149 12 -23 4 -39 3 -43 -4 -5 -7 -49 -11 -121 -11 l-115 0 -2 312 c-2 224 -6 312 -15 315 -6 2 -38 -47 -71 -109z m1137 -498 c39 -54 55 -125 48 -219 -7 -114 -61 -211 -117 -211 -27 0 -68 38 -92 83 -19 35 -22 59 -23 146 l0 103 32 3 c18 1 45 10 59 20 29 19 57 76 48 99 -12 31 16 15 45 -24z m-815 -105 c25 -19 60 -19 80 0 11 11 40 15 120 15 l106 0 0 -469 c0 -567 12 -521 -141 -521 l-99 0 0 338 c0 250 -3 341 -12 350 -16 16 -23 15 -42 -4 -14 -13 -16 -59 -16 -350 l0 -334 -95 0 c-148 0 -135 -50 -135 515 l0 475 108 0 c78 -1 112 -5 126 -15z" /><path d="M2862 2113 c-5 -10 -12 -41 -16 -69 -8 -61 1 -71 64 -77 33 -3 29 -4 -15 -3 l-60 1 0 45 c0 25 -4 51 -8 58 -6 9 -70 12 -261 12 l-253 0 -53 -81 c-48 -73 -52 -81 -37 -96 14 -14 18 -14 46 6 l30 22 3 -153 3 -153 91 -3 c105 -3 104 -4 104 96 l0 52 185 0 185 0 0 -62 c0 -35 4 -69 8 -76 6 -9 33 -12 98 -10 l89 3 3 68 3 67 -44 0 c-47 0 -67 13 -66 45 0 14 2 15 6 5 11 -30 37 -40 103 -40 96 0 100 6 100 158 0 96 -3 124 -16 136 -12 13 -40 16 -140 16 l-124 0 0 25 c0 29 -15 33 -28 8z" /><path d="M3247 2123 c-4 -3 -7 -20 -7 -38 0 -35 -15 -55 -42 -55 -13 0 -18 -8 -18 -30 0 -29 2 -30 44 -30 58 0 70 16 62 80 -10 74 -20 93 -39 73z" /></g></svg>`;
const stsIconMask = `data:image/svg+xml,${encodeURIComponent(stsIconMaskSvg)}`;

// The sidebar product icon is provided as an <img> and the shell recolours it
// with an approximate CSS filter (see @rancher/shell IconOrSvg.vue). That filter
// can't reproduce the exact brand colour, so our icon ends up a slightly off,
// washed-out green compared to the font-based icons next to it (issue #229).
// Instead we hide that <img> and redraw the icon with a CSS mask tinted with the
// same theme variables the shell uses for the other menu icons, so the colour
// matches exactly in the light, dark and auto themes. Scoped to our menu entry
// via its route href ('/sr/c/') so no other extension's icon is affected.
const iconSelector = `.side-menu .category div a[href*="/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/"]`;
const styleSheet = document.createElement('style');
styleSheet.setAttribute('data-sr-icon-fix', '');
styleSheet.textContent = `
  ${iconSelector} > img.svg-icon {
    display: none;
  }
  ${iconSelector}::before {
    content: "";
    display: block;
    flex-shrink: 0;
    /* 42px-wide box (matching the sibling menu icons) with the 24px icon
       centred via mask-size:contain, so it lines up horizontally with them. */
    width: 42px;
    height: 24px;
    margin-right: 14px;
    background-color: var(--on-tertiary);
    -webkit-mask-image: url("${stsIconMask}");
    mask-image: url("${stsIconMask}");
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }
  ${iconSelector}:hover::before {
    background-color: var(--tertiary-hover-app-bar);
  }
  ${iconSelector}.active-menu-link::before {
    background-color: var(--on-active);
  }
`;
document.head.appendChild(styleSheet);

export function init($extension, store) {
  const { product, configureType, virtualType, basicType, weightType, headers } = $extension.DSL(
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

import SteveModel from '@shell/plugins/steve/steve-class';
import { clone } from '@shell/utils/object';
import { SUPPORTABILITY_REVIEW_PRODUCT_NAME } from '../config/types';

export default class ReviewBundle extends SteveModel {
  get detailLocation() {
    const detailLocation = clone(this._detailLocation);
    detailLocation.params.resource = this.type;
    detailLocation.name = `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster-resource-id`;
    return detailLocation;
  }

  get _availableActions() {
    let out = super._availableActions;

    // Remove unused menus
    const toFilter = ['goToViewConfig', 'goToClone', 'download'];
    out = out.filter((action) => {
      if (!toFilter.includes(action.action)) {
        return action;
      }
    });

    // Add custom menus
    const t = this.$rootGetters['i18n/t'];

    const downloadBundle = {
      action: 'downloadThisBundle',
      enabled: this.hasBundle,
      icon: 'icon icon-fw icon-download',
      label: t('sr.menuLabels.downloadBundle'),
      total: 1
    };

    const viewReport = {
      action: 'viewReport',
      enabled: this.hasBundle,
      icon: 'icon icon-fw icon-info',
      label: t('sr.menuLabels.viewReport'),
      total: 1
    };

    out.unshift(viewReport);
    out.unshift(downloadBundle);

    return out;
  }

  viewReport() {
    window.location.href = `./view-report/${this.id}/?bundlename=${this.metadata.name}`;
  }

  downloadFromUrl(url, filename) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch(console.error);
  }

  async downloadThisBundle() {
    try {
      this.downloadFromUrl(
        '/k8s/clusters/local/api/v1/namespaces/sr-operator-system/services/http:sr-bundle-app-frontend-service:80/proxy/' +
          '?key=' +
          this.metadata.name +
          '&type=file',
        this.status?.fileName
      );
    } catch (err) {
      this.$dispatch('growl/fromError', { title: 'Error downloading file', err }, { root: true });
    }
  }

  get hasBundle() {
    const fileName = this.status?.fileName;
    if (fileName === undefined || fileName === '') {
      return false;
    } else {
      return true;
    }
  }
}

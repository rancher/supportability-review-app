<script>
import { CATALOG } from '@shell/config/types'
import Loading from '@shell/components/Loading'
import InstallView from '../components/InstallView'
import DashboardView from '../components/DashboardView'
import { SUPPORTABILITY_REVIEW_CRD_IDS } from '../config/types'

export default {
  name: 'DashboardPage',
  components: {
    Loading,
    InstallView,
    DashboardView
  },
  async fetch() {
    console.log('pages/DashboardPage.vue: fetch')
    // this covers scenario where Operator is deleted from Apps, and we lose the admin role for Standard Users...
    if (this.$store.getters['management/canList'](SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE)) {
      let installedApps

      // needed to check if operator is installed
      if (this.$store.getters['management/canList'](CATALOG.APP)) {
        installedApps = await this.$store.dispatch('management/findAll', {
          type: CATALOG.APP
        })
        console.log('installedApps: ', installedApps)
      }

      const srSchema = this.$store.getters['management/schemaFor'](SUPPORTABILITY_REVIEW_CRD_IDS.REVIEW_BUNDLE)

      // we need to check for the length of the response
      // due to some issue with a standard-user, which can list apps
      // but the list comes up empty []
      const isSROperatorNotInstalledOnApps =
        installedApps?.length &&
        !installedApps?.find(
          (item) =>
            item.id.includes('rancher-supportability-review') && !item.id.includes('rancher-supportability-review-crd')
        )

      // check if operator is installed
      if (!srSchema || isSROperatorNotInstalledOnApps) {
        this.isSROpInstalled = false
      }
    } else {
      this.isSROpInstalled = false
    }
  },
  data() {
    return { isSROpInstalled: true }
  }
}
</script>

<template>
  <div>
    <Loading v-if="$fetchState.pending" />
    <!-- Operator not installed -->
    <InstallView v-else-if="!isSROpInstalled" />
    <!-- Dashboard view -->
    <DashboardView v-else />
  </div>
</template>

<style lang="scss" scoped></style>

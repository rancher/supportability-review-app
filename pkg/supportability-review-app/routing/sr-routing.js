import ListResource from '@shell/pages/c/_cluster/_product/_resource/index.vue'
import CreateResource from '@shell/pages/c/_cluster/_product/_resource/create.vue'
import ViewResource from '@shell/pages/c/_cluster/_product/_resource/_id.vue'
import Dashboard from '../pages/DashboardPage.vue'
import ViewReportPage from '../pages/ViewReportPage'
import { SUPPORTABILITY_REVIEW_PRODUCT_NAME, BLANK_CLUSTER } from '../config/types'

const routes = [
  {
    name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}`,
    path: `/c/:cluster/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/dashboard`,
    component: Dashboard,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER,
      pkg: SUPPORTABILITY_REVIEW_PRODUCT_NAME
    }
  },
  {
    name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-view-report`,
    path: `/c/:cluster/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/view-report`,
    component: ViewReportPage,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER,
      pkg: SUPPORTABILITY_REVIEW_PRODUCT_NAME
    }
  },
  {
    name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-view-report`,
    path: `/c/:cluster/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/view-report/:id/:report?`,
    component: ViewReportPage,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER,
      pkg: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      props: (route) => ({ report: route.params.reportData })
    }
  },
  // the following routes cover the "resource page"
  // registering routes for list/edit/create views
  {
    name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-resource`,
    path: `/c/:cluster/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/:resource`,
    component: ListResource,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  },
  {
    name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-resource-create`,
    path: `/c/:cluster/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/:resource/create`,
    component: CreateResource,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  },
  {
    name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-resource-id`,
    path: `/c/:cluster/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/:resource/:id`,
    component: ViewResource,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  }
]

export default routes

import ListResource from '../pages/_resource/index.vue';
import CreateResource from '../pages/_resource/create.vue';
import ViewResource from '../pages/_resource/_id.vue';
import Dashboard from '../pages/DashboardPage.vue';
import ViewReportPage from '../pages/ViewReportPage';
import { SUPPORTABILITY_REVIEW_PRODUCT_NAME, BLANK_CLUSTER } from '../config/types';

const routes = [
  {
    name: `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster`,
    path: `/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/:cluster/dashboard`,
    component: Dashboard,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER,
      pkg: SUPPORTABILITY_REVIEW_PRODUCT_NAME
    }
  },
  {
    name: `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster-view-report`,
    path: `/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/:cluster/view-report`,
    component: ViewReportPage,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER,
      pkg: SUPPORTABILITY_REVIEW_PRODUCT_NAME
    }
  },
  {
    name: `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster-view-report`,
    path: `/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/:cluster/view-report/:id/:report?`,
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
    name: `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster-resource`,
    path: `/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/:cluster/:resource`,
    component: ListResource,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  },
  {
    name: `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster-resource-create`,
    path: `/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/:cluster/:resource/create`,
    component: CreateResource,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  },
  {
    name: `${SUPPORTABILITY_REVIEW_PRODUCT_NAME}-c-cluster-resource-id`,
    path: `/${SUPPORTABILITY_REVIEW_PRODUCT_NAME}/c/:cluster/:resource/:id`,
    component: ViewResource,
    meta: {
      product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
      cluster: BLANK_CLUSTER
    }
  }
];

export default routes;

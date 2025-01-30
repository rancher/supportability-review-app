import { SUPPORTABILITY_REVIEW_PRODUCT_NAME, BLANK_CLUSTER } from '../config/types'

export const rootRoute = () => ({
  name: `c-cluster-${SUPPORTABILITY_REVIEW_PRODUCT_NAME}`,
  params: {
    product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
    cluster: BLANK_CLUSTER
  },
  meta: {
    product: SUPPORTABILITY_REVIEW_PRODUCT_NAME,
    cluster: BLANK_CLUSTER,
    pkg: SUPPORTABILITY_REVIEW_PRODUCT_NAME
  }
})

export const createRoute = (name: string, params: Object, meta: Object) => ({
  name: `${rootRoute().name}-${name}`,
  params: {
    ...rootRoute().params,
    ...params
  },
  meta: {
    ...rootRoute().meta,
    ...meta
  }
})

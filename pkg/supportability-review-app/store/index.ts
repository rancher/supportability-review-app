import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types'

import { SUPPORTABILITY_REVIEW_STORE } from '../config/types'

import getters from './getters'
import mutations from './mutations'
import actions from './actions'

const srFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { createClusterElements: [] }
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions }
  }
}
const config: CoreStoreConfig = { namespace: SUPPORTABILITY_REVIEW_STORE }

export default {
  specifics: srFactory(),
  config
}

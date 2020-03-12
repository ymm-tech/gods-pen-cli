import AttrCom from './com'
import AttrData from './Data'
import AttrResource from './Resource'
import Vue from 'vue'

var install = function () {
  Vue.component('attr-data', AttrData)
  Vue.component('resource', AttrResource)
  Vue.component('attr-function', AttrCom)
  Vue.component('attr-richtext', AttrCom)
  Vue.component('attr-event', AttrCom)
}

export default {
  install
}
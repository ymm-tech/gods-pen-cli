import VueExtend from './vue'
import {fetch} from './fetch'
import Util from './Util'

function empty () {}

window.$GP = {
  Util,
  VueExtend,
  ESlog: {pageview: empty, track: empty, getFingerPrint: empty},
  Server: {fetch},
}

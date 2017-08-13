import { isClient } from './utils'
import IOTA from 'iota.lib.js'
if(isClient) {
  require('curl.lib.js')
  //console.log(curl)
}
// Create IOTA instance directly with provider
export const iota = new IOTA({
  //provider: "https://node.tangle.works"
  provider: "http://52.58.212.188:14700"
})
if(isClient) {
  curl.overrideAttachToTangle(iota.api)
}

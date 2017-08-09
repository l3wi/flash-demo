import IOTA from "iota.lib.js"
import { isClient } from './utils'
if(isClient) {
  require('curl.lib.js')
  console.log(curl)
}
// Create IOTA instance directly with provider
export const iota = new IOTA({
  //provider: "https://node.tangle.works"
  provider: "http://52.18.170.164:14700" // THANK YOU RANDOM GUY ON #TESTNET-NODESHARING 💘💘💘
})
if(isClient) {
  curl.overrideAttachToTangle(iota.api)
}

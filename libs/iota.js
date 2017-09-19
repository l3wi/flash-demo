import IOTA from "iota.lib.js"
import Presets from "./presets"
require("isomorphic-fetch")

export var iota = new IOTA({
  provider: Presets.IOTA
})

export const fundChannel = async address => {
  var transfers = [{ value: 2000, address }]

  // Get your free seeeed
  var response = await fetch("https://seeds.tangle.works/")
  var wallet = await response.json()

  return new Promise(function(resolve, reject) {
    iota.api.sendTransfer(wallet.seed, 5, 9, transfers, (e, r) => {
      if (e !== null) {
        reject(e)
      } else {
        resolve(r)
      }
    })
  })
}

export class Attach {
  static bundleToTrytes(bundle) {
    var bundleTrytes = []
    bundle.forEach(function(bundleTx) {
      bundleTrytes.push(iota.utils.transactionTrytes(bundleTx))
    })
    return bundleTrytes.reverse()
  }

  static async sendTrytes(trytes) {
    return new Promise(function(resolve, reject) {
      iota.api.sendTrytes(
        trytes,
        Presets.PROD ? 6 : 5,
        Presets.PROD ? 15 : 10,
        (e, r) => {
          console.log("sendTrytes", e, r)
          if (e !== null) {
            reject(e)
          } else {
            resolve(r)
          }
        }
      )
    })
  }

  static getBundles(bundles) {
    var ret = []
    for (var bundle of bundles) {
      if (bundle !== null || bundle.value !== 0) {
        ret.push(bundle)
      }
    }
    return ret
  }

  static async POWClosedBundle(bundles) {
    try {
      console.log("attachAndPOWClosedBundle", bundles)
      bundles = Attach.getBundles(bundles)
      var trytesPerBundle = []
      for (var bundle of bundles) {
        var trytes = Attach.bundleToTrytes(bundle)
        trytesPerBundle.push(trytes)
      }
      console.log("closing room with trytes", trytesPerBundle)
      var results = []
      for (var trytes of trytesPerBundle) {
        console.log(trytes)
        if (isWindow()) curl.overrideAttachToTangle(iota.api)
        var result = await Attach.sendTrytes(trytes)
        results.push(result)
      }
      return results
    } catch (e) {
      return e
    }
  }
}

export const isClient =
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement

// Check if window is available
export const isWindow = () => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return false
  }
  return true
}

import { iota } from "../iota-node";

export default class CloseRoom {
  bundleToTrytes(bundle) {
    var bundleTrytes = [];
    bundle.forEach(function(bundleTx) {
        bundleTrytes.push(iota.utils.transactionTrytes(bundleTx))
    })

    return bundleTrytes.reverse()
  }

  attachBundle(bundleTrytes) {
    iota.broadcastTransactions(bundleTrytes, (e, r) => {
      console.log('broadcastTransactions', e, r);
    })
  }

  async sendTrytes(trytes) {
    return new Promise(function(resolve, reject) {
      iota.api.sendTrytes(trytes, 5, 10, (e, r) => {
        console.log('sendTrytes', e, r);
        if(e !== null) {
          reject(e)
        }
        else {
          resolve(r)
        }
      })
    });
  }

  getBundles (bundles) {
    var ret = []
    for(var bundle of bundles) {
      if(bundle !== null) {
        ret.push(bundle)
      }
    }
    return ret
  }

  async attachAndPOWClosedBundle(bundles) {
    console.log('attachAndPOWClosedBundle', bundles);
    bundles = this.getBundles(bundles)
    var trytesPerBundle = []
    for(var bundle of bundles) {
      var trytes = this.bundleToTrytes(bundle)
      trytesPerBundle.push(trytes)
    }
    console.log('closing room with trytes', trytesPerBundle);
    for(var trytes of trytesPerBundle) {
      await this.sendTrytes(trytes)
    }
  }
}

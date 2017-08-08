import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node";
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {

  }

  bundlesToTrytes(bundle) {
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

  getBundles() {
    var ret = []
    for(var bundles of this.props.roomData.flashState.bundles) {
      if(bundles !== null) {
        ret.push(bundles)
      }
    }
    return ret
  }

  closeRoom() {
    var bundles = this.getBundles()
    console.log(bundles);
    for(var bundle of bundles) {
      var trytes = this.bundlesToTrytes(bundle)
      iota.api.sendTrytes(trytes, 5, 10, (e, r) => {
        console.log('sendTrytes', e, r);
      })
      break // for now
    }
  }

  render() {
    return (
      <div>
        Closing the room means that both parties will get their final balance and the channel will be destroyed. Are you sure you want to close?
        <br />
        <input value="Close Room" onClick={this.closeRoom.bind(this)} type="button"></input>
      </div>
    )
  }
}

import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node";
import Flash from "../libs/flash";
import { webRTC } from "../libs/flash"

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

  getBundles(roomData) {
    var ret = []
    for(var bundles of roomData.flashState.bundles) {
      if(bundles !== null) {
        ret.push(bundles)
      }
    }
    return ret
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

  async closeRoom() {
    var flashState = await webRTC.closeRoom(this.props.roomData)    
  }

  closeRoomClick() {
    (async() => {
      await this.closeRoom()
    })()
  }

  render() {
    return (
      <div>
        Closing the room means that both parties will get their final balance and the channel will be destroyed. Are you sure you want to close?
        <br />
        <input value="Close Room" onClick={this.closeRoomClick.bind(this)} type="button"></input>
      </div>
    )
  }
}

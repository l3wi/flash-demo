import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node";
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {

  }

  closeRoom() {
    // todo: get bundles...
    // todo: sign of all the balance from the remainder 50/50 to the 2 peers
    iota.api.sendTransfer(this.props.roomData.mySeed, 4, 10, transfers, (e, bundle) => {
      if (e) throw e;
      console.log("Successfully sent your transfer: ", bundle);
    })
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

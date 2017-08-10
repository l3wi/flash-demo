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

  async closeChannel() {
    var flashState = await webRTC.closeChannel(this.props.roomData)
  }

  closeRoomClick() {
    (async() => {
      await this.closeChannel()
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

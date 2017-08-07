import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {

  }

  closeRoom() {
    
  }

  render() {
    return (
      <div>
        Closing the room means that both parties will get their final balance and the channel will be destroyed
        <br />
        <input value="Close Room" onClick={this.closeRoom.bind(this)} type="button"></input>
      </div>
    )
  }
}

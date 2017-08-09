import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node";
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {

  }

  handleChange(event) {
    this.setState({
      amount: event.target.value
    })
  }

  render() {
    return (
      <div>
        Please deposit { this.props.roomData.flashState && this.props.roomData.flashState.depositAmount } iota
        to the multisig wallet address: { this.props.roomData.flashState.addresses[0].address && iota.utils.addChecksum(this.props.roomData.flashState.addresses[0].address) }
        <input value="I did!" onClick={this.props.callback} type="button"></input>
      </div>
    )
  }
}

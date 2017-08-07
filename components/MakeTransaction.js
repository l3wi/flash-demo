import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node"
import Flash from "../libs/flash";
import { webRTC } from "../libs/flash"

export default class extends React.Component {
  state = {

  }

  handleChange(event) {
    this.setState({
      amount: event.target.value
    })
  }

  createTransactionClick() {
    (async () => {
      var flashState = await webRTC.createTransaction(this.props.roomData, parseInt(this.state.amount), !this.props.roomData.isMaster)
      this.props.callback(flashState)
    })()
  }

  render() {
    return (
      <div>
        Amount to send <input onChange={this.handleChange.bind(this)} type="number" value={this.state.amount}></input> iota
        <br />
        <input value="Create transaction" onClick={this.createTransactionClick.bind(this)} type="button"></input>
      </div>
    )
  }
}

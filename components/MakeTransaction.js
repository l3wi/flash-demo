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

  createTransaction() {
    (async () => {
      if(this.props.roomData.isMaster) {
        // The master can just create the transaction and push it to the slave
        var amount = parseInt(this.state.amount)
        Flash.master.newTransaction(this.props.roomData.flashState, amount, this.props.roomData.mySeed);
      }
  }

  render() {
    return (
      <div>
        Amount to send <input onChange={this.handleChange.bind(this)} type="number" value={this.state.amount}></input> iota
        <br />
        <input value="Create transaction" onClick={this.createTransaction.bind(this)} type="button"></input>
      </div>
    )
  }
}

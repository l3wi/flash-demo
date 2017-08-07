import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node"
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {

  }

  handleChange(event) {
    this.setState({
      amount: event.target.value
    })
  }

  createTransaction() {
    var addresses = this.props.roomData.flashState.addresses
    var address = this.props.roomData.isMaster ? this.props.roomData.flashState.settlementAddress.master : this.props.roomData.flashState.settlementAddress.slave
    // Get the last generated address for the deepest level (I think this is the bottom-left of the tree?)
    var inputAddress = addresses[addresses.length - 1]
    var newFlash = Flash.master.newAddress(one, flash) // TODO
    var transfers = [{
      address,
      value: this.state.amount
    }, {
      value: this.props.roomData.flashState.multiSigWalletBalance,
      address: ''
    }]
    iota.multisig.initiateTransfer(4, inputAddress, null, transfers, function(
      error,
      success
    ) {
      if (error) {
        console.error(error);
      } else {
        console.log(success);
        res(success);
      }
    })
  }

  render() {
    return (
      <div>
        Amount to send <input onChange={this.handleChange} type="number" value={this.state.amount}></input> iota
        <br />
        <input value="Create transaction" onClick={this.createTransaction.bind(this)} type="button"></input>
      </div>
    )
  }
}

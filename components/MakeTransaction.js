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
        var _this = this
        var initTransactionCreation = (flashState) => {
          var amount = parseInt(this.state.amount)
          // Start new transaction
          var flashState = Flash.master.newTransaction(flashState, amount)
          var eventFn = (message) => {
            message = message.data
            if(message.cmd === 'signTransactionResult') {
              webRTC.off('message', eventFn)
              // todo: do something with new state

            }
          }
          webRTC.on('message', eventFn)
          webRTC.broadcastMessage({
            cmd: 'signTransaction',
            flashState: flashState
          })
        }
        var initAddressCreation = () => {
          var flashState = Flash.master.newAddress(_this.props.roomData.mySeed, _this.props.roomData.flashState)
          var eventFn = (message) => {
            message = message.data
            if(message.cmd === 'signAddressResult') {
              webRTC.off('message', eventFn)
              initTransactionCreation(message.flashState)
            }
          }
          webRTC.on('message', eventFn)
          webRTC.broadcastMessage({
            cmd: 'signAddress',
            flashState: flashState
          })
        }
        initAddressCreation()
      }
    })()
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

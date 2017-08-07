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

  async createTransaction() {
    var _this = this
    return new Promise(function(resolve, reject) {
      if(_this.props.roomData.isMaster) {
        // The master can just create the transaction and push it to the slave
        var initTransactionCreation = async (flashState) => {
          var amount = parseInt(_this.state.amount)
          // Start new transaction
          var flashState = await Flash.master.newTransaction(flashState, amount)
          var eventFn = (message) => {
            message = message.data
            if(message.cmd === 'signTransactionResult') {
              webRTC.events.off('message', eventFn)
              resolve(message.flashState)
            }
          }
          webRTC.events.on('message', eventFn)
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
              webRTC.events.off('message', eventFn)
              initTransactionCreation(message.flashState)
            }
          }
          webRTC.events.on('message', eventFn)
          webRTC.broadcastMessage({
            cmd: 'signAddress',
            flashState: flashState
          })
        }
        initAddressCreation()
      }
    });
  }

  createTransactionClick() {
    (async () => {
      await this.createTransaction()
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

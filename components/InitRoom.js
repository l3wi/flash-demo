import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {
    amountOfTransactions: 100
  }

  handleChange(event) {
    this.setState({
      amountOfTransactions: event.target.value
    })
  }

  createRoom() {
    var maxTransactions = this.state.amountOfTransactions
    var mySeed = seedGen(81)
    var flashState = Flash.master.initalize(mySeed, maxTransactions)
    var roomData = {
      isMaster: true, // The creator is always the master
      flashState,
      mySeed
    }
    this.props.callback(roomData)
  }

  render() {
    return (
      <div>
        Max amount of transactions: <input onChange={this.handleChange} type="number" value={this.state.amountOfTransactions}></input>
        <input value="Create room" onClick={this.createRoom.bind(this)} type="button"></input>
      </div>
    )
  }
}

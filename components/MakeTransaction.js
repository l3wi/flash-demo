import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
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

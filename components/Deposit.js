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
        Please deposit { this.props.roomData.depositAmount } iota to the multisig wallet address: 
      </div>
    )
  }
}

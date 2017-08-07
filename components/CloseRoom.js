import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node";
import Flash from "../libs/flash";

export default class extends React.Component {
  state = {

  }

  walkTree(counters) {
    // New Obj
    var arr = Object.assign([], counters);

    // ADD FLAGS TO INDICATE NEW BUNDLES TO BE GENERATED
    var requiredBundles = [];
    var requiredAddresses = [];

    // Set a counter for the loop
    var index = counters.length - 1;
    // Flag to kill the loop when done
    var again = true;
    // While loop.... lol
    while (again) {
      // Check to see if we need another loop and to reset this level counter
      if (counters[index] === 2) {
        // Mark the bundles that need to be generated
        requiredAddresses.push(index);
        requiredBundles.push(index);

        // Set the counter to 0
        arr[index] = 0;
        // Move the index up a level
        index--;
      } else {
        // Mark the bundles that need to be generated
        requiredAddresses.push(index);
        // Also get parent to change to new child
        requiredBundles.push(index);
        if (index !== 0) requiredBundles.push(index - 1); // Escape the root of the tree
        // Increase counter
        arr[index]++;
        // Break loop
        again = false;
      }
    }
    return {
      counter: arr,
      reqBundles: requiredBundles,
      reqAddresses: requiredAddresses
    };
  };

  closeRoom() {
    // todo: get bundles...
    // todo: sign of all the balance from the remainder 50/50 to the 2 peers
    iota.api.sendTransfer(this.props.roomData.mySeed, 4, 10, transfers, (e, bundle) => {
      if (e) throw e;
      console.log("Successfully sent your transfer: ", bundle);
    })
  }

  render() {
    return (
      <div>
        Closing the room means that both parties will get their final balance and the channel will be destroyed. Are you sure you want to close?
        <br />
        <input value="Close Room" onClick={this.closeRoom.bind(this)} type="button"></input>
      </div>
    )
  }
}

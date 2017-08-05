import React from "react";
import styled from "styled-components";

import { seedGen, initiateAddress, finishAddress } from "../libs/flash/iota";
import { calculateDepth, initialFlash, walkTree } from "../libs/flash/flash";

import { webRTC } from "../libs/flash";

export default class extends React.Component {
  state = {
    one: { seed: seedGen(81), input: 50 },
    two: { seed: seedGen(81), input: 50 },
    flash: {
      depth: 5,
      counter: [1, 2, 2, 2, 2],
      addressIndex: 0,
      addresses: [
        ["KJFJGFJHGJHG"],
        ["JKGFJKGFJGFHJGFJFK", "JGFGFUKFUFUKTFJFJHGIUHI"],
        ["TUKDYTDUTKDKTDKUTDUKYFYFYFFY", "QJGFQUFKAUSGVAVA"]
      ],
      bundles: []
    }
  };

  componentDidMount() {
    /// User one
    var digest = initiateAddress({
      seed: this.state.one.seed,
      index: this.state.flash.addressIndex
    });
    // User two
    var address = finishAddress(
      {
        seed: this.state.two.seed,
        index: this.state.flash.addressIndex
      },
      digest
    );
    /// New Addy
    console.log(address);
  }

  render() {
    console.log(initialFlash(5));

    return <div>Herro</div>;
  }
}

import React from "react";
import styled from "styled-components";

import { seedGen } from "../libs/flash/iota";
import { webRTC } from "../libs/flash"

export default class extends React.Component {
  state = {
    one: { seed: seedGen(81), input: 50 },
    two: { seed: seedGen(81), input: 50 },
    flash: {
      depth: 3,
      counter: [0, 0, 0],
      addressIndex: 0,
      addresses: [
        ["KJFJGFJHGJHG"],
        ["JKGFJKGFJGFHJGFJFK", "JGFGFUKFUFUKTFJFJHGIUHI"],
        ["TUKDYTDUTKDKTDKUTDUKYFYFYFFY", "QJGFQUFKAUSGVAVA"]
      ],
      bundles: [{ lvl: 1 }, { lvl: 2 }, { lvl: 3 }]
    }
  };
  render() {
    console.log(this.state);
    return <div>Herro</div>;
  }
}

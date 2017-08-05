import React from "react";
import styled from "styled-components";

import { seedGen } from "../libs/flash/iota";
import { webRTC } from "../libs/flash"

export default class extends React.Component {
  render() {
    (async() => {
      var result = await webRTC.initChannel({
        roomId: this.props.url.query.id
      })
      console.log('initChannel result', result);
      webRTC.connectToPeers()
    })()
    return <div>Herro</div>;
  }
}

import React from "react";
import styled from "styled-components";

import { seedGen } from "../libs/flash/iota";
import { webRTC } from "../libs/flash"
import { isClient } from '../libs/utils'

export default class extends React.Component {
  state = {
    peers: [],
    messages: []
  }

  componentDidMount() {
    if(isClient) {
      (async() => {
        var result = await webRTC.initChannel({
          roomId: this.props.url.query.id
        })
        console.log('initChannel result', result);
        webRTC.connectToPeers()
        var _this = this
        webRTC.events.on('message', (message) => {
          var messages = _this.state.messages
          messages.push({
            from: message.connection.peer,
            data: message.data
          })
          _this.setState({
            messages: messages
          })
        })
        webRTC.events.on('peerJoined', () => {
          _this.setState({
            peers: Object.values(webRTC.connections)
          })
        })
      })()
    }
  }

  renderMessage(message) {
    return (
      <div>{message.from}: {message.data}</div>
    )
  }

  render() {
    return (
      <div>
        Herro! We are connected to { this.state.peers.length } peers!
        <b>Latest messages:</b><br />
        { this.state.messages.map(this.renderMessage) }
      </div>
    )
  }
}

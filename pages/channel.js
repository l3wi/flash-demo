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

  componentWillUnmount() {
    clearInterval(connectToPeersTimer)
  }

  componentDidMount() {
    if(isClient) {
      (async() => {
        var result = await webRTC.initChannel({
          roomId: this.props.url.query.id
        })
        console.log('initChannel result', result);
        // Keep trying to find new peers
        this.connectToPeersTimer = setInterval(() => {
          webRTC.connectToPeers()
        }, 1000)
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
        
        webRTC.events.on('peerLeft', () => {
          _this.setState({
            peers: Object.values(webRTC.connections)
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
      <div key={message.data}>{message.from}: {message.data}</div>
    )
  }

  msgKeyPress(e) {
    if (e.key === 'Enter') {
      webRTC.broadcastMessage({
        data: e.currentTarget.value
      })
      e.currentTarget.value = ''
    }
  }

  render() {
    return (
      <div>
        Herro! We are connected to { this.state.peers.length } peers!
        <br /><b>Latest messages:</b><br />
        <input type="text" placeholder="Type new message" onKeyPress={this.msgKeyPress} /><br />
        { this.state.messages.map(this.renderMessage) }
      </div>
    )
  }
}

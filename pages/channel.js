import React from "react";
import styled from "styled-components";

import { seedGen } from "../libs/flash/iota";
import { webRTC } from "../libs/flash"
import { isClient, get, set } from '../libs/utils'

export default class extends React.Component {
  state = {
    status: 'loaded',
    peers: [],
    messages: [],
    roomData: {
      mySeed: null,
      flashState: null
    }
  }

  connectToPeersTimer = null

  tryGetRoomData() {
    this.state.roomData = get(`room-${this.props.url.query.id}`)
  }

  clearConnectTimer() {
    if(typeof this.connectToPeersTimer !== null) {
      clearInterval(this.connectToPeersTimer)
      this.connectToPeersTimer = null
    }
  }

  componentWillUnmount() {
    this.clearConnectTimer()
  }

  initWebRTC() {
    (async() => {
      var _this = this
      var result = await webRTC.initChannel({
        roomId: _this.props.url.query.id
      })
      console.log('initChannel result', result);
      // Keep trying to find new peers
      _this.connectToPeersTimer = setInterval(() => {
        webRTC.connectToPeers()
      }, 1000)
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

      webRTC.events.once('peerJoined', () => {
        if(Object.values(webRTC.connections).length > 0) {
          _this.clearConnectTimer()
        }
        _this.setState({
          peers: Object.values(webRTC.connections),
          status: 'peer-joined'
        })
      })
    })()
  }

  componentDidMount() {
    if(isClient) {
      this.tryGetRoomData()
      this.initWebRTC()
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

  renderStatus() {
    return (<div>Status: { this.state.status }</div>)
  }

  render() {
    return (
      <div>
        Herro! We are connected to { this.state.peers.length } peers!
        <br /><b>Latest messages:</b><br />
        <input type="text" placeholder="Type new message" onKeyPress={this.msgKeyPress} /><br />
        { this.state.messages.map(this.renderMessage) }
        { this.renderStatus() }
      </div>
    )
  }
}

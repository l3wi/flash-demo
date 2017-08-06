import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { webRTC } from "../libs/flash"
import { isClient, get, set } from '../libs/utils'
import Flash from "../libs/flash";
import InitRoom from '../components/InitRoom'
import MakeTransaction from '../components/MakeTransaction'
import Deposit from '../components/Deposit'

export default class extends React.Component {
  state = {
    status: 'loaded',
    peers: [],
    messages: [],
    roomData: {
      isMaster: null,
      mySeed: null,
      flashState: null,
      fullDepositMade: false
    }
  }

  connectToPeersTimer = null

  tryGetRoomData() {
    this.setState({
      roomData: Object.assign(this.state.roomData, get(`room-${this.props.url.query.id}`))
    })
  }

  storeRoomDataLocally(roomData = this.state.roomData) {
    set(`room-${this.props.url.query.id}`, roomData)
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

  handleMessage(message) {
    if(message.cmd === 'flashState') {
      // TODO: add better checks (is the state of the peer newer?)
      if(this.state.roomData.flashState === null) {
        var mySeed = seedGen(81)
        // Now we need to co-sign the room
        var settlementAddress = prompt('Please enter your settlement address')
        var newFlashState = Flash.slave.initalize(mySeed, message.flashState, settlementAddress)
        // Now send the new state back to the other peer
        this.broadcastFlashState(newFlashState)
        var roomData = {
          flashState: newFlashState,
          mySeed,
          isMaster: false // the creator is always the master, so we are a slave
        }
        this.setState({
          roomData
        })
        this.storeRoomDataLocally(roomData)
      }
      else {
        this.state.roomData.flashState = message.flashState
        this.setState({
          roomData: this.state.roomData
        })
        this.storeRoomDataLocally()
      }
    }
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
        var messageJSON = JSON.parse(message.data)
        _this.handleMessage(messageJSON)
        if(_this.state.roomData.isMaster) {
          Flash.master.handleMessage(messageJSON)
        }
        else {
          Flash.slave.handleMessage(messageJSON)
        }
      })

      webRTC.events.on('peerLeft', () => {
        _this.setState({
          peers: Object.values(webRTC.connections)
        })
      })

      webRTC.events.once('peerJoined', ({ connection }) => {
        if(Object.values(webRTC.connections).length > 0) {
          _this.setState({
            status: 'peer-joined',
            peers: Object.values(webRTC.connections)
          })
          if(this.state.roomData.flashState !== null) {
            _this.broadcastFlashState()
          }
          _this.clearConnectTimer()
        }
      })
    })()
  }

  componentDidMount() {
    if(isClient) {
      this.tryGetRoomData()
      this.initWebRTC()
    }
  }

  broadcastFlashState(flashState = this.state.roomData.flashState) {
    webRTC.broadcastMessage({
      cmd: 'flashState',
      flashState: flashState
    })
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

  didDeposit() {
    this.state.roomData.fullDepositMade = true
    this.setState({
      roomData: this.state.roomData
    })
  }

  initialRoomMade() {
    // Checking if mySeed is null
    // means that you haven't generated any private room data from this room yet.
    // we can assume that there was no initial data made yet.
    return this.state.roomData.mySeed !== null
  }

  initializeRoomCallback(roomData) {
    // We also move back to loaded-state
    // This makes us wait for another peer again, which is fine now. We are the creator.
    this.setState({
      roomData,
      status: 'loaded'
    })

    this.broadcastFlashState(roomData.flashState)
  }

  renderInit() {
    if(this.state.status === 'init') {
      return (<InitRoom callback={ this.initializeRoomCallback.bind(this) }></InitRoom>)
    }
  }

  renderWait() {
    if(isClient) {
      if(!this.initialRoomMade() && (this.state.status === 'loaded' || this.state.status === 'peer-joined')) {
        return (<div>
          We haven't found any local room data yet. You can wait until a peer joins who does, or initialize the room yourself.
          <br />
          <input type="button" onClick={() => { this.setState({ status: 'init' }) }} value="Initialize"></input>
        </div>)
      }
    }
  }

  renderFlashObjectDebug() {
    if(this.initialRoomMade()) {
      var flash = this.state.roomData.flashState
      return (
        <div>
          <h4>Flash Object</h4>
          <p>
            Depth: {flash.depth} Address Index: {flash.addressIndex}
          </p>
          {flash.addresses &&
            flash.addresses.map((level, index) =>
              <div key={index}>
                <strong>
                  Level: {index}
                </strong>
                <p>
                  {level.address && level.address.substring(0, 10)} ...
                </p>
              </div>
            )}
        </div>
      )
    }
  }

  renderDeposit() {
    if(!this.state.roomData.fullDepositMade && this.initialRoomMade()) {
      return (<Deposit callback={this.didDeposit.bind(this)} roomData={this.state.roomData}></Deposit>)
    }
  }

  renderCreateTransaction() {
    if(this.state.status === 'make-transaction') {
      return (<MakeTransaction></MakeTransaction>)
    }
  }

  render() {
    return (
      <div>
        Herro! We are connected to { this.state.peers.length } peers!
        <br /><b>Latest messages:</b><br />
        <input type="text" placeholder="Type new message" onKeyPress={this.msgKeyPress} /><br />
        <input type="button" onClick={() => { this.setState({ status: 'make-transaction' }) }} value="Make Transaction"></input>
        <br />
        { this.state.messages.map(this.renderMessage) }
        { this.renderStatus() }
        { this.renderWait() }
        { this.renderInit() }
        { this.renderDeposit() }
        { this.renderCreateTransaction() }
        { this.renderFlashObjectDebug() }
      </div>
    )
  }
}

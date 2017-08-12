import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import { webRTC } from "../libs/flash"
import { isClient, get, set } from '../libs/utils'
import { iota } from "../libs/iota-node";
import Flash from "../libs/flash";
import InitRoom from '../components/InitRoom'
import CloseRoomComponent from '../components/CloseRoom'
import MakeTransaction from '../components/MakeTransaction'
import Deposit from '../components/Deposit'
import CloseRoom from '../libs/flash/close-room.js'

export default class extends React.Component {
  closeRoom = new CloseRoom()
  state = {
    status: 'loaded',
    peers: [],
    roomData: {
      index: -1,
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

    // Remove later
    var _this = this
    window.setState = (s) => {
      _this.didMakeSuccessfulTransaction(s)
    }
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
    if(message.cmd === 'signAddress' && this.state.roomData.index != 0) {
      // co-sign the address as the slave
      var newFlashState = Flash.slave.closeAddress(this.state.roomData.mySeed, message.flashState)
      webRTC.broadcastMessage({
        cmd: 'signAddressResult',
        flashState: newFlashState
      })
    }

    if(message.cmd === 'signTransaction' && this.state.roomData.index != 0) {
      // Finsh signing the bundles
      (async() => {
        var newFlashState = await Flash.slave.closeTransaction(message.flashState, this.state.roomData.mySeed)
        // Dirty, temporary workaround. So we can rely on a good callback for slave.
        this.didMakeSuccessfulTransaction(newFlashState)
        webRTC.events.emit('signTransactionResult', newFlashState)
        webRTC.broadcastMessage({
          cmd: 'signTransactionResult',
          flashState: newFlashState
        })
      })()
    }

    if(message.cmd === 'createTransaction' && this.state.roomData.index == 0) {
      (async() => {
        // True at the end make sure that if the slave asks the master to create a transaction
        // the amount is always sent to master (since in essence, slave will be paying)
        var createAddress = true
        if('createAddress' in message) {
          createAddress = message.createAddress
        }
        var from = "slave"
        var to = "master"
        var newFlashState = await webRTC.createTransaction(this.state.roomData, message.amount, to, from)
        this.didMakeSuccessfulTransaction(newFlashState)
      })()
    }

    if(message.cmd === 'closeChannel' && this.state.roomData.index == 0) {
      (async() => {
        await webRTC.closeChannel(this.state.roomData)
      })()
    }

    if(message.cmd === 'signCloseChannel' && this.state.roomData.index == 1) {
      (async() => {
        var newFlashState = await Flash.slave.closeFinalBundle(message.flashState, this.state.roomData.mySeed)
        this.didMakeSuccessfulTransaction(newFlashState)
        webRTC.broadcastMessage({
          cmd: 'signCloseChannelResult',
          flashState: newFlashState
        })
        var results = await this.closeRoom.attachAndPOWClosedBundle(newFlashState.finalBundles)
        for(var bundle of results) {
          console.log(
            "attachAndPOWClosedBundle > validateSignatures",
            iota.utils.validateSignatures(bundle, newFlashState.addresses[0].address)
          );
        }
      })()
    }

    if(message.cmd === 'signCloseChannelResult' && this.state.roomData.index == 0) {
      this.didMakeSuccessfulTransaction(message.flashState)
    }

    if(message.cmd === 'didDeposit') {
      this.state.roomData.flashState = message.flashState
      this.storeRoomDataLocally()
      this.setState({
        roomData: this.state.roomData
      })
    }

    if(message.cmd === 'initRoomResult' && this.state.roomData.index == 0) {
      this.state.roomData.flashState = message.flashState
      this.setState({
        roomData: this.state.roomData
      })
      this.storeRoomDataLocally()
    }

    if(message.cmd === 'initRoom' && this.state.roomData.index == -1) {
      var mySeed = seedGen(81)
      // Now we need to co-sign the room
      var settlementAddress = prompt('Please enter your settlement address')
      console.log('settlementAddress', settlementAddress);
      var newFlashState = Flash.slave.initalize(mySeed, message.flashState, settlementAddress)
      console.log('initalized', JSON.stringify(newFlashState));
      var roomData = {
        flashState: newFlashState,
        mySeed,
        index: 1 // hardcoded for now (this.state.peers.length seems to fail sometimes)
      }
      this.setState({
        roomData
      })
      this.storeRoomDataLocally(roomData)

      // Now send the new state back to the other peer
      webRTC.broadcastMessage({
        cmd: 'initRoomResult',
        flashState: newFlashState
      })
    }
  }

  initWebRTC() {
    (async() => {
      var _this = this
      // Super huge hack. Don't try at home
      webRTC.channel = this
      var result = await webRTC.initChannel({
        roomId: _this.props.url.query.id
      })
      console.log('initChannel result', result);
      // Keep trying to find new peers
      _this.connectToPeersTimer = setInterval(() => {
        webRTC.connectToPeers()
      }, 1000)
      webRTC.events.on('message', (message) => {
        console.log(`${message.connection.peer}:`, message.data)
        _this.handleMessage(message.data)
        if(_this.state.roomData.index == 0) {
          Flash.master.handleMessage(message.data)
        }
        else {
          Flash.slave.handleMessage(message.data)
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
          _this.clearConnectTimer()
        }
      })
    })()
  }

  didMakeSuccessfulTransaction(flashState) {
    console.log('didMakeSuccessfulTransaction', flashState);
    this.state.roomData.flashState = flashState
    this.setState({
      roomData: this.state.roomData
    })
    this.storeRoomDataLocally()
  }

  componentDidMount() {
    if(isClient) {
      this.tryGetRoomData()
      this.initWebRTC()
    }
  }

  msgKeyPress(e) {
    if (e.key === 'Enter') {
      webRTC.broadcastMessage({
        data: e.currentTarget.value
      })
      e.currentTarget.value = ''
    }
  }

  renderBalance() {
    if(this.state.roomData.flashState !== null) {
      return (<div>
        Balance: (master: { this.state.roomData.flashState.total['master'] } slave: { this.state.roomData.flashState.total['slave'] })<br />
        Stake: (master: { this.state.roomData.flashState.stake['master'] } slave: { this.state.roomData.flashState.stake['slave'] })<br />
        Remainder: { Object.values(this.state.roomData.flashState.stake).reduce((sum, value) => sum + value, 0) }
      </div>)
    }
  }

  renderStatus() {
    return (
      <div>
        Status: { this.state.status }<br />
        { this.renderBalance() }
      </div>
    )
  }

  didDeposit() {
    this.state.roomData.fullDepositMade = true
    this.state.roomData.flashState.stake[this.state.roomData.index == 0? "master" : "slave"] += this.state.roomData.flashState.depositAmount
    webRTC.broadcastMessage({
      cmd: 'didDeposit',
      flashState: this.state.roomData.flashState
    })
    this.storeRoomDataLocally()
    this.setState({
      roomData: this.state.roomData
    })
  }

  shouldCloseRoom() {
    return Object.values(this.state.roomData.flashState.stake).reduce((sum, value) => sum + value) == 0
  }

  allPeersDeposited() {
    if(typeof this.state.roomData.flashState === undefined || this.state.roomData.flashState === null) {
      return false
    }
    var totalInRoom =
        Object.values(this.state.roomData.flashState.stake).reduce((sum, value) => sum + value)
      + Object.values(this.state.roomData.flashState.total).reduce((sum, value) => sum + value)
    return totalInRoom === (this.state.roomData.flashState.depositAmount * 2)
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

  renderClose() {
    if(this.state.status === 'close-room') {
      return (<CloseRoomComponent roomData={this.state.roomData}></CloseRoomComponent>)
    }
  }

  renderDeposit() {
    if(!this.state.roomData.fullDepositMade && this.initialRoomMade()) {
      return (<Deposit callback={this.didDeposit.bind(this)} roomData={this.state.roomData}></Deposit>)
    }
  }

  renderCreateTransaction() {
    if(this.state.status === 'make-transaction') {
      return (<MakeTransaction callback={this.didMakeSuccessfulTransaction.bind(this)} roomData={this.state.roomData}></MakeTransaction>)
    }
  }

  renderButtons() {
    if(this.allPeersDeposited()) {
      return (<div>
        <input disabled={this.shouldCloseRoom()} type="button" onClick={() => { this.setState({ status: 'make-transaction' }) }} value="Make Transaction"></input>
        <input type="button" onClick={() => { this.setState({ status: 'close-room' }) }} value="Close Room"></input>
      </div>)
    }
  }

  render() {
    return (
      <div>
        { this.renderButtons() }
        <br />
        Hello! We are the <b>{ ['nothing', 'master', 'slave'][this.state.roomData.index + 1] }</b> connected to { this.state.peers.length } peers!
        <br />
        { this.renderStatus() }
        { this.renderWait() }
        { this.renderInit() }
        { this.renderDeposit() }
        { this.renderClose() }
        { this.renderCreateTransaction() }
        { this.renderFlashObjectDebug() }
      </div>
    )
  }
}

import { isClient } from '../utils'
const EventEmitter = require('eventemitter3')
import Flash from "../flash";

var Peer
if(isClient) {
  Peer = require('peerjs')
}

export default class WebRTC {
  constructor() {
    this.connections = {}
    this.events = new EventEmitter()
  }

  async createAddress(roomData) {
    var _this = this
    return new Promise(function(resolve, reject) {
      if(roomData.isMaster) {
        // The master can just create an address and pass it on to slave to sign
        var newFlash = Flash.master.newAddress(roomData.mySeed, roomData.flashState)
        this.broadcastMessage({
          cmd: 'signAddress',
          flashState: newFlash
        })
        this.events.on('message', eventFn = (message) => {
          if(message.cmd === 'flashState') {
            // The flashstate from the slave now should contain the newest state
            _this.events.off('message', eventFn)
            resolve(message.flashState)
          }
        })
      }
      else {
        // For the slave, we have to ask the master to create an address (order of signatures is important)
        var _this = this
        this.events.on('message', eventFn = (message) => {
          if(message.cmd === 'signAddress') {
            // We just have this event to check if we get to sign the final address
            // Since the previous message event already signed the address, we can just return flash state
            _this.events.off('message', eventFn)
            resolve(_this.channel.state.roomData.flashState)
          }
        })
        this.broadcastMessage({
          cmd: 'createAddress'
        })
      }
    });
  }

  async getProbabilisticPeer() {
    // Keep trying to connect to a peer id
    // consisting of <channel address> + <peer number>
    // Peer number will keep increasing by until we hit a nonexisting address
    var _this = this
    return new Promise(function(resolve, reject) {
      var peerNumber = 0
      var getCurrentId = () => {
        return `${_this.channel.roomId}-${peerNumber}`
      }
      var tryCreateId = () => {
        var tryId = getCurrentId()
        var peer = new Peer(tryId, WebRTC.signalingServer)
        var errorFn = (e) => {
          if(e.type === 'unavailable-id') {
            peer.destroy()
            peerNumber++
            tryCreateId()
          }
        }
        var openFn = () => {
          peer.off('open', openFn)
          peer.off('error', errorFn)
          resolve(peer)
        }
        peer.on('error', errorFn)
        peer.on('open', openFn)
      }
      tryCreateId()
    });
  }

  connectToPeers() {
    for(var i = 0; i < 5; i++) {
      var tryId = `${this.channel.roomId}-${i}`
      if(tryId !== this.peer.id && (typeof this.connections[tryId] === 'undefined')) {
        var conn = this.peer.connect(tryId, {
          reliable: true
        })
        this.onConnection(conn)
      }
    }
  }

  async initChannel(channel) {
    if(isClient) {
      this.channel = channel

      this.peer = await this.getProbabilisticPeer()
      this.peer.on('error', this.onError)
      this.peer.on('close', this.onClose)
      this.peer.on('disconnected', this.onDisconnected)
      this.peer.on('connection', this.onConnection.bind(this))
      console.log('connected to signaling server as peer id ' + this.peer.id);
    }
  }

  broadcastMessage(message) {
    for(var k in this.connections) {
      var conn = this.connections[k]
      conn.send(JSON.stringify(message))
    }
  }

  onConnection(conn) {
    var _this = this
    conn.on('open', () => {
      _this.connections[conn.peer] = conn
      console.log(`connected to ${conn.peer}`);
      _this.events.emit('peerJoined', {
        connection: conn
      })
    })
    conn.on('close', () => {
      delete _this.connections[conn.peer]
      _this.events.emit('peerLeft', {
        connection: conn
      })
    })
    conn.on('data', (data) => {
      _this.events.emit('message', {
        connection: conn,
        data: JSON.parse(data)
      })
    })
  }

  onDisconnected() {
    this.peer.reconnect()
  }

  onOpen(connection) {
    console.log(connection);
  }

  onClose() {

  }

  onError(error) {
    console.error(`WebRTC Error (${error.type}):`, error)
  }
}

WebRTC.signalingServer = {
  host: 'localhost',
  port: 3000,
  path: '/peerjs'
}
Object.freeze(WebRTC.signalingServer)

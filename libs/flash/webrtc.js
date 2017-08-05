import { isClient } from '../utils'
const EventEmitter = require('eventemitter3')

var Peer
if(isClient) {
  Peer = require('peerjs')
}

export default class WebRTC {
  constructor() {
    this.connections = {}
    this.events = new EventEmitter()
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
    for(var i = 0; i < 100; i++) {
      var tryId = `${this.channel.roomId}-${i}`
      if(tryId !== this.peer.id) {
        this.peer.connect(tryId)
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
      this.peer.on('connection', this.onConnection)
      console.log('connected to signaling server as peer id ' + this.peer.id);
    }
  }

  onConnection(conn) {
    console.log(`connected to ${conn.peer}`);
    this.connections[conn.peer] = conn
    conn.on('close', () => {
      delete this.connections[conn.peer]
    })
    var _this = this
    conn.on('data', (data) => {
      _this.events.emit('message', {
        connection: conn,
        data: data
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
    console.error('WebRTC Error:', error)
  }

  onMessage() {

  }
}

WebRTC.signalingServer = {
  host: 'localhost',
  port: 3000,
  path: '/peerjs'
}
Object.freeze(WebRTC.signalingServer)

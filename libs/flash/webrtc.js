import { isClient } from '../utils'

var Peer
if(isClient) {
  Peer = require('peerjs')
}

export default class WebRTC {
  constructor() {
    this.connections = {}
  }

  async getProbabilisticPeer(channel) {
    // Keep trying to connect to a peer id
    // consisting of <channel address> + <peer number>
    // Peer number will keep increasing by until we hit a nonexisting address
    return new Promise(function(resolve, reject) {
      var peerNumber = 0
      var getCurrentId = () => {
        return `${channel.roomId}-${peerNumber}`
      }
      var tryConnect = () => {
        var tryId = getCurrentId()
        var peer = new Peer(tryId, WebRTC.signalingServer)
        var errorFn = (e) => {
          if(e.type === 'unavailable-id') {
            peer.destroy()
            peerNumber++
            tryConnect()
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
      tryConnect()
    });
  }

  async initChannel(channel) {
    if(isClient) {
      this.peer = await this.getProbabilisticPeer(channel)
      this.peer.on('error', this.onError)
      this.peer.on('open', this.onOpen)
      console.log('connected to signaling server as peer id ' + this.peer.id);
    }
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

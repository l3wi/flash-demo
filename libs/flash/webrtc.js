import { isClient } from '../utils'

var Peer
if(isClient) {
  Peer = require('peerjs')
}

export default class WebRTC {
  constructor() {
  }

  async getProbabilisticAdress(channel) {
    // Keep trying to connect to a peer id
    // consisting of <channel address> + <peer number>
    // Peer number will keep increasing by until we hit a nonexisting address
    return new Promise(function(resolve, reject) {
      var peer = new Peer(channel.address, WebRTC.signalingServer)
      var peerNumber = 0
      var getCurrentId = () => {
        return `${channel.roomId}-${peerNumber}`
      }
      var tryConnect = () => {
        var tryId = getCurrentId()
        peer.connect(tryId)
      }

      peer.on('error', (e) => {
        console.error('getProbabilisticAdress', e)
        if(e.type === 'peer-unavailable') {
          peer.destroy()
          resolve(getCurrentId())
        }
      })

      peer.on('connection', (e) => {
        console.log('getProbabilisticAdress', 'connection, this address is occupied, so we make a new one.')
        peerNumber++
        tryConnect()
      })

      tryConnect()
    });
  }

  async initChannel(channel) {
    if(isClient) {
      var peerId = await this.getProbabilisticAdress(channel)
      this.peer = new Peer(channel.roomId, WebRTC.signalingServer)
      this.peer.on('error', this.onError)
      console.log('connected with peer id ' + peerId);
    }
  }

  onOpen() {

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

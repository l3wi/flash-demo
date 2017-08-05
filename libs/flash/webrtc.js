import { isClient } from '../utils'

var Peer
if(isClient) {
  Peer = require('peerjs')
}

export default class WebRTC {
  constructor() {

  }

  initChannel(channel) {
    if(isClient) {
      this.peer = new Peer(channel.address, {
        host: 'localhost',
        port: 3000,
        path: '/peerjs'
      })
    }
  }

  onOpen() {

  }

  onClose() {

  }

  onError() {

  }

  onMessage() {

  }
}

import { isClient } from '../utils'

export default class WebRTC {
  constructor() {
    if(isClient) {
      this.peerConnection = new RTCPeerConnection()
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

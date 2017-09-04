const EventEmitter = require("eventemitter3")
import { isClient } from "./utils"

var Peer
if (isClient) {
  Peer = require("peerjs")
}
export const events = new EventEmitter()
let peer
let connections = []

export default class RTC {
  static async initChannel(roomID) {
    if (isClient) {
      peer = await RTC.getID(roomID)
      console.log(peer)
      peer.on("error", this.onError)
      peer.on("close", this.onClose)
      peer.on("disconnected", this.onDisconnected)
      peer.on("connection", this.onConnection)
      console.log("My ID is " + peer.id)
      return events
    }
  }

  static getID = async roomID => {
    // Need to rewrite with loops
    return new Promise(function(resolve, reject) {
      var peerNumber = 0
      var tryCreateId = () => {
        var tryId = `${roomID}-${peerNumber}`
        var peer = new Peer(tryId, signalingServer)
        var errorFn = e => {
          if (e.type === "unavailable-id") {
            peer.destroy()
            peerNumber++
            tryCreateId()
          }
        }
        var openFn = () => {
          peer.off("open", openFn)
          peer.off("error", errorFn)
          resolve(peer)
        }
        peer.on("error", errorFn)
        peer.on("open", openFn)
      }
      tryCreateId()
    })
  }

  static connectToPeers(roomID) {
    for (var i = 0; i < 3; i++) {
      var tryId = `${roomID}-${i}`
      if (tryId !== peer.id && typeof connections[tryId] === "undefined") {
        var conn = peer.connect(tryId, {
          reliable: true
        })
        RTC.onConnection(conn)
      }
    }
  }

  static broadcastMessage(message) {
    for (var k in connections) {
      var conn = connections[k]
      conn.send(JSON.stringify(message))
    }
  }

  static onConnection(conn) {
    conn.on("open", () => {
      connections[conn.peer] = conn
      console.log(`connected to ${conn.peer}`)
      events.emit("peerJoined", {
        connection: conn
      })
    })
    conn.on("close", () => {
      delete connections[conn.peer]
      events.emit("peerLeft", {
        connection: conn
      })
    })
    conn.on("data", data => {
      if (JSON.parse(data).return) {
        events.emit("return", {
          connection: conn,
          data: JSON.parse(data)
        })
      } else {
        events.emit("message", {
          connection: conn,
          data: JSON.parse(data)
        })
      }
    })
  }

  static onDisconnected() {
    console.log("Peer disconnected")
    peer.reconnect()
  }

  static onOpen(connection) {
    console.log(connection)
  }

  static onClose() {}

  static onError(error) {
    if (error.type !== "peer-unavailable") {
      console.error(`WebRTC Error (${error.type}):`, error)
    }
  }
}

const signalingServer = {
  host: "localhost",
  port: 3000,
  path: "/peerjs"
}
Object.freeze(signalingServer)

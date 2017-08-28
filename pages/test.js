import React from "react"
import styled from "styled-components"

import RTC from "../libs/rtc"
import Channel from "../libs/channel"
export default class extends React.Component {
  state = {
    flash: {},
    seeds: {},
    total: {
      master: 50,
      slave: 50
    },
    remainder: 100
  }

  async componentDidMount() {
    var Events = await RTC.initChannel("dsfd")
    RTC.connectToPeers("dsfd")

    Events.on("message", message => {
      console.log(`${message.connection.peer}:`, message.data)
      if (message.data.cmd === "startSetup") {
        Channel.signSetup(message)
      } else if (message.data.cmd === "signSetup") {
        Channel.closeSetup(message)
      } else if (message.data.cmd === "shareFlash") {
        Channel.initFlash(message.data.flash)
      }
    })
    Events.on("peerLeft", message => {
      console.log(`Peer Left`)
    })
    Events.on("peerJoined", message => {
      console.log(`Peer Joined`)
    })
  }

  render() {
    var { seeds, flash, transactions } = this.state
    return (
      <Wrapper>
        <button onClick={() => Channel.startSetup()}>SendMEssage</button>
      </Wrapper>
    )
  }
}

const Wrapper = styled.section`
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
`

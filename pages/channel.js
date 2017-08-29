import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"
import ChannelInterface from "../components/channel"
import Setup from "../components/channelSetup"

import Header from "../components/channel/header"

import RTC from "../libs/rtc"
import Channel from "../libs/channel"

const SideBar = () =>
  <RightContent>
    <h3>Channel History</h3>
    <History>
      {[
        "Waiting for a mate...",
        "Mate connected.",
        "Signing addresses",
        "Deposit address generated",
        "1st deposit complete",
        "2nd deposit complete",
        "Channel is now setup",
        "Partner has initiated a transfer of 50 to themself",
        "You confirmed the transfer of 50"
      ]
        .reverse()
        .map(item =>
          <Item>
            {item}
          </Item>
        )}
    </History>
  </RightContent>

export default class extends React.Component {
  static async getInitialProps({ query }) {
    return query
  }

  state = {
    setup: true,
    form: 0,
    address: "",
    peer: false,
    channel: "share",
    flash: {},
    userID: 0,
    transfer: 0,
    title: `Waiting for peer to connect...`
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ form: 1 })
    }, 300)
    this.initChannel()
  }

  initChannel = async () => {
    var Events = await RTC.initChannel(this.props.id)
    RTC.connectToPeers(this.props.id)

    Events.on("message", message => {
      console.log(`${message.connection.peer}:`, message.data)
      if (message.data.cmd === "startSetup") {
        Channel.signSetup(message)
      } else if (message.data.cmd === "signSetup") {
        Channel.closeSetup(message)
      } else if (message.data.cmd === "shareFlash") {
        Channel.initFlash(message.data.flash)
        this.setState({ flash: message.data.flash })
      }
    })
    Events.on("peerLeft", message => {
      console.log(`Peer Left`)
      this.setState({ peer: false })
    })
    Events.on("peerJoined", message => {
      console.log(`Peer Joined`)
      console.log(message.connection.peer)
      this.setState({
        peer: true,
        channel: "deposit",
        userID: message.connection.peer.slice(-1)
      })

      if (message.connection.peer.slice(-1) !== 0) {
        Channel.startSetup()
      }
    })
  }

  sendTransaction = (value, address) => {
    console.log("Creating transactions")
    Channel.composeTransfer(value, address)
  }

  confirmDeposit = async amount => {
    var state = await store.get("state")
    state.flash.deposit[this.state.userID === "0" ? 1 : 0] = amount
    state.flash.balance += amount
    Channel.shareFlash(state.flash)
    this.setState({ channel: "main", flash: state.flash })
  }

  setChannel = (address, deposits) => {
    this.setState({ setup: true })
  }

  render() {
    var { form, peer, setup, channel, flash, userID, transfer } = this.state
    console.log(this.state)
    if (!setup) {
      return (
        <Layout right={setup && SideBar()}>
          <LeftContent noBg={!setup} active={form === 1}>
            <Setup setChannel={this.setChannel} />
          </LeftContent>
        </Layout>
      )
    } else {
      return (
        <Layout right={setup && SideBar()}>
          <LeftContent noBg={!setup} active={form === 1}>
            {channel === "share" &&
              <div>
                <Header
                  {...this.state}
                  {...this.props}
                  title={`Waiting for peer to connect...`}
                />

                <h2>Share this room link with your partner:</h2>
                <p>
                  {/* {window && window.localStorage ? window.location.href : null} */}
                </p>
              </div>}
            {channel === "deposit" &&
              <div>
                <Header {...this.state} title={`Waiting for deposits`} />

                <h2>Deposit 50 IOTA into this multisig address:</h2>
                <p>
                  {`SFDYSHYROSXOFMNFSJTNJYZGJDLSVOPDOEKVRB9KOGHXRFPPLXPVANRKIRGLBCVHGMVMMNNBWFFXASURD`}
                </p>
                <Row>
                  <Button full accent onClick={() => this.confirmDeposit(50)}>
                    Deposited
                  </Button>
                </Row>
              </div>}

            {channel === "main" &&
              <div>
                <Header {...this.state} title={`Channel Setup!`} />

                <Row>
                  <h5>
                    Your Balance: {flash.deposit[userID === 0 ? 0 : 1]} IOTA
                  </h5>
                  <h5>
                    Partner Balance: {flash.deposit[userID === 0 ? 1 : 0]} IOTA
                  </h5>
                  <h5>
                    Remaining transactable:{" "}
                    {flash.deposit.reduce((a, b) => a + b, 0)} IOTA
                  </h5>
                </Row>
                <h4>Send IOTA:</h4>
                <Row>
                  <Field
                    value={transfer}
                    placeholder={"Enter amount in IOTA"}
                    onChange={data =>
                      this.setState({ transfer: data.target.value })}
                  />
                  <div />
                </Row>
                <Row>
                  <Button
                    full
                    onClick={() =>
                      this.sendTransaction(
                        transfer,
                        `PFIOSG9QAPULHVFGOFOLLMAXHUV9OERMB9GSJWHDJJRTYOHGQKIDVJUAFYX9IYWXQMZUAMEPAZNHXHXXE`
                      )}
                  >
                    Send Transfer
                  </Button>
                  <Button full accent left>
                    Close Channel
                  </Button>
                </Row>
              </div>}
          </LeftContent>
        </Layout>
      )
    }
  }
}

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: ${props => (props.border ? "2px solid #222" : "none")};
`
const Field = styled.input`
  flex: 1;
  background: none;
  font-size: 100%;
  padding: 5px 0px;
  width: 100%;
  border: none;
  color: #222;
  border-bottom: 2px solid #222;
  &:focus {
    outline: none;
  }
`
const Button = styled.button`
  flex: ${props => (props.full ? "1" : null)};
  padding: 15px 20px;
  background: ${props => (props.accent ? "#d30c7b" : "#222")};
  border: none;
  color: white;
  font-weight: 600;
  margin: ${props => (props.full ? "1rem 0rem" : "0 1rem")};
  margin: ${props => (props.left ? "1rem 0rem 1rem 3rem" : null)};
  &:focus {
    outline: none;
  }
`

const AnimatedLeftBox = styled.span`
  position: absolute;
  width: 100%;
  transition: all .5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

const History = styled.div`
  border-top: 2px solid white;
  margin: 0 0 5px;
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
  flex: 1;
  &:before {
    content: '';
    position: absolute;
    bottom: 14px;
    width: 90%;
    height: 2rem;
    background: linear-gradient(
      to bottom,
      rgba(180, 180, 180, 0),
      rgba(180, 180, 180, 1)
    );
  }
`
const Item = styled.p`
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, .5);
`

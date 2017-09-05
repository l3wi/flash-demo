import React from "react"
import styled from "styled-components"
import { Layout, SingleBox } from "../components/layout"
import Setup from "../components/channelSetup"

import Header from "../components/channel/header"

import { isClient } from "../libs/utils"
import RTC from "../libs/rtc"
import Channel from "../libs/channel"

const history = ["Waiting for a partner..."]

export default class extends React.Component {
  static async getInitialProps({ query }) {
    return query
  }

  state = {
    setup: true,
    form: 0,
    address:
      "GQMHDLS9XPSNURUCPKKJJTULZRPH9WSKUKQQQPJOY9CPRCNAUSIFWCLHVDSUHJJCPMQDARUIFFXKXFVQD",
    peer: false,
    pendingTransfer: false,
    channel: "share",
    flash: {},
    userID: 0,
    transfer: "",
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

    Events.on("message", async message => {
      console.log(`${message.connection.peer}:`, message.data)
      if (message.data.cmd === "startSetup") {
        Channel.signSetup(message, this.state.address)
      } else if (message.data.cmd === "signSetup") {
        var flash = await Channel.closeSetup(message, this.state.address)
        this.setState({ flash })
      } else if (message.data.cmd === "shareFlash") {
        Channel.initFlash(message.data.flash)
        this.setState({ flash: message.data.flash })
        history.push("Deposit address generated")
      } else if (message.data.cmd === "composeTransfer") {
        history.push(`Recieved transfer for ${message.data.value}`)
        // Get diff and set the state
        this.setState({
          channel: "confirm",
          pendingTransfer: {
            value: message.data.value,
            address: message.data.settlementAddress,
            bundles: message.data.bundles
          }
        })
      } else if (message.data.cmd === "getBranch") {
        Channel.returnBranch(message.data.digests, message.data.address)
      } else if (message.data.cmd === "closeChannel") {
        Channel.signTransfer(message.data.bundles)
        history.push(`Closing Channel`)
      } else if (message.data.cmd === "error") {
        history.push(`${message.data.error}`)

        alert(message.data.error)
      }
    })
    Events.on("peerLeft", message => {
      console.log(`Peer Left`)
      history.push("Partner Disconnected")
      this.setState({ peer: false })
    })
    Events.on("peerJoined", message => {
      console.log(`Peer Joined`)
      console.log(message.connection.peer)
      history.push("Partner Connected")
      this.setState({
        peer: true,
        channel: "deposit",
        userID: message.connection.peer.slice(-1) === "0" ? 1 : 0
      })

      if (message.connection.peer.slice(-1) !== "0") {
        Channel.startSetup()
      }
    })
  }

  confirmTransaction = async transaction => {
    if (!transaction) {
      this.setState({ channel: "main" })
      return RTC.broadcastMessage({
        cmd: "error",
        error: "Transaction Denied."
      })
    }
    console.log(transaction)

    var state = await Channel.signTransfer(transaction.bundles)
    this.setState({ ...state, channel: "main" })
  }

  sendTransaction = async (value, address) => {
    history.push(`Creating transaction for ${parseInt(value)}`)
    var state = await Channel.composeTransfer(
      parseInt(value),
      address,
      this.state.userID
    )
    this.setState({ flash: state.flash })
  }

  request = (value, address) => {
    return RTC.broadcastMessage({
      cmd: "requestTransfer",
      value,
      address
    })
  }

  closeChannel = async () => {
    history.push("Closing Channel")
    var state = await Channel.close()
    console.log(state)
  }

  confirmDeposit = async amount => {
    history.push(`Confirmed deposit of ${amount}`)
    var state = await store.get("state")
    state.flash.deposit[this.state.userID] = amount
    state.flash.balance += amount
    Channel.shareFlash(state.flash)
    await store.set("state", state)
    this.setState({ channel: "main", flash: state.flash })
  }

  setChannel = (address, deposits) => {
    this.setState({ setup: true, address, deposits })
  }

  render() {
    var {
      form,
      peer,
      setup,
      channel,
      address,
      flash,
      userID,
      transfer,
      pendingTransfer
    } = this.state
    if (!flash) var flash = { deposit: [] }
    console.log(this.state)
    if (!setup) {
      return (
        <Layout right={!setup && SideBar()}>
          <SingleBox noBg={setup} active={form === 1}>
            <Setup setChannel={this.setChannel} />
          </SingleBox>
        </Layout>
      )
    } else {
      return (
        <Layout>
          <SingleBox noBg={!setup} active={form === 1} row wide>
            <Left>
              {channel === "share" && (
                <div>
                  <Header
                    {...this.state}
                    {...this.props}
                    title={`Waiting for peer to connect...`}
                  />
                  <p>Share this room link with your partner:</p>
                  <p>{isClient ? window.location.href : null}</p>
                </div>
              )}
              {channel === "loading" && (
                <div>
                  <Header
                    {...this.state}
                    {...this.props}
                    title={`Loading...`}
                  />
                  <Spinner {...this.props} src={"/static/loading-dark.svg"} />
                </div>
              )}
              {channel === "closed" && (
                <div>
                  <Header
                    {...this.state}
                    {...this.props}
                    title={`Channel has been closed`}
                  />
                  <p>
                    {`See the link below to view the closing transaction that has been attached to the network`}
                  </p>
                </div>
              )}
              {channel === "confirm" && (
                <div>
                  <Header
                    {...this.state}
                    title={`${pendingTransfer.address == address
                      ? "Recieve"
                      : "Send"} ${pendingTransfer.value}i`}
                  />

                  <h2 />
                  <p>Do you want to confirm or deny this transaction?</p>
                  <Row>
                    <Button
                      full
                      accent
                      onClick={() => this.confirmTransaction(pendingTransfer)}
                    >
                      Confirm Transaction
                    </Button>
                    <Button
                      full
                      left
                      onClick={() => this.confirmTransaction(false)}
                    >
                      Deny Transaction
                    </Button>
                  </Row>
                </div>
              )}
              {channel === "deposit" && (
                <div>
                  <Header
                    {...this.state}
                    title={
                      !flash.remainderAddress ? (
                        `Generating the deposit address`
                      ) : (
                        `Waiting for deposits`
                      )
                    }
                  />
                  {flash.remainderAddress ? (
                    <div>
                      <h2>Deposit 50 IOTA into this multisig address:</h2>
                      <p style={{ maxWidth: "25rem" }}>
                        {flash.remainderAddress.address}
                      </p>
                      <Row>
                        <Button
                          full
                          accent
                          onClick={() => this.confirmDeposit(50)}
                        >
                          Deposited
                        </Button>
                      </Row>
                    </div>
                  ) : (
                    <div>
                      <Spinner
                        {...this.props}
                        src={"/static/loading-dark.svg"}
                      />
                    </div>
                  )}
                </div>
              )}

              {channel === "main" && (
                <div>
                  <Header {...this.state} title={`Channel Setup!`} />

                  <Row>
                    <h5>
                      Your Balance: {flash.deposit[userID === 0 ? 0 : 1]} IOTA
                    </h5>
                    <h5>
                      Partner Balance: {flash.deposit[userID === 0 ? 1 : 0]}{" "}
                      IOTA
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
                    <Button
                      full
                      accent
                      left
                      onClick={() => this.closeChannel()}
                    >
                      Close Channel
                    </Button>
                  </Row>
                </div>
              )}
            </Left>
            <Right>
              <h3>Channel History</h3>
              <History>
                {history
                  .reverse()
                  .map((item, i) => <Item key={i}>{item}</Item>)}
              </History>
            </Right>
          </SingleBox>
        </Layout>
      )
    }
  }
}

const Left = styled.div`
  position: relative;
  flex: 1.7;
  flex-direction: column;
  height: 100%;
  padding: 10px 20px;
  box-sizing: border-box;
`

const Right = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  background: rgba(232, 206, 230, 1);
  padding: 10px 20px;
  box-sizing: border-box;
`

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
  background: ${props =>
    props.accent ? "linear-gradient(135deg, #ef7564, #f06263)" : "#222"};
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
  transition: all 0.5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

const History = styled.div`
  border-top: 2px solid #222;
  margin: 0 0 5px;
  overflow: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
  flex: 1;
  &:before {
    content: "";
    position: absolute;
    bottom: 0px;
    width: 36%;
    height: 2rem;
    background: linear-gradient(
      to bottom,
      rgba(232, 206, 230, 0),
      rgba(232, 206, 230, 1)
    );
  }
`
const Item = styled.p`
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(56, 26, 54, 0.2);
`
const Spinner = styled.img`
  height: 5rem !important;
  width: 5rem;
  position: absolute;
  left: 50%;
  bottom: 50%;
  margin-bottom: -2.5rem;
  margin-left: -2.5rem;
`

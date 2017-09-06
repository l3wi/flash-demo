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
    setup: false,
    form: 0,
    address: "",
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
        this.setState({ currentMessage: message })
      } else if (message.data.cmd === "signSetup") {
        var flash = await Channel.closeSetup(
          message,
          this.state.address,
          this.state.deposits
        )
        this.setState({ flash })
      } else if (message.data.cmd === "deposited") {
        this.confirmDeposit(
          this.state.flash.depositRequired,
          message.data.index
        )
        history.unshift("Deposit address generated")
      } else if (message.data.cmd === "composeTransfer") {
        history.unshift(`Recieved transfer for ${message.data.value}`)
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
        history.unshift(`Closing Channel`)
        this.setState({ channel: "closed" })
      } else if (message.data.cmd === "error") {
        history.unshift(`${message.data.error}`)
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
    this.setState({ channel: "loading" }, async () => {
      history.unshift(`Creating transaction for ${parseInt(value)}`)
      var state = await Channel.composeTransfer(
        parseInt(value),
        address,
        this.state.userID
      )
      this.setState({ channel: "main", flash: state.flash })
    })
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
    this.setState({
      channel: "closed",
      flash: { ...this.state.flash, finalBundle: state[0][0].bundle }
    })
    Channel.shareFlash(this.state.flash)
    console.log(state)
  }

  confirmDeposit = async (amount, index) => {
    history.unshift(`Confirmed deposit of ${amount}`)
    var state = await store.get("state")
    state.flash.deposit[index] = amount
    state.flash.balance += amount
    await store.set("state", state)
    if (index === this.state.userID) {
      RTC.broadcastMessage({ cmd: "deposited", index: this.state.userID })
      this.setState({ channel: "main", flash: state.flash })
    } else {
      this.setState({ flash: state.flash })
    }
  }

  setChannel = (address, deposits) => {
    if (this.state.currentMessage) this.saveAddress(address)
    this.setState({ setup: true, address, deposits: parseInt(deposits) })
  }

  // IF you are recieving the signing request return after you've added your settlement addresss
  saveAddress = async address => {
    var flash = await Channel.signSetup(this.state.currentMessage, address)
    this.setState({ flash })
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
    if (!setup) {
      return (
        <Layout>
          <SingleBox noBg={!setup} active={form === 1}>
            <Setup setChannel={this.setChannel} {...this.state} />
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
                  {flash.finalBundle ? (
                    <a
                      target={"_blank"}
                      href={`https://tanglertestnet.codebuffet.co/search/?kind=bundle&hash=${flash.finalBundle}`}
                    >
                      View Transaction
                    </a>
                  ) : (
                    <Spinner {...this.props} src={"/static/loading-dark.svg"} />
                  )}
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
                      <h2>{`Deposit ${this.state.flash
                        .depositRequired} IOTA into this multisig address:`}</h2>
                      <p style={{ maxWidth: "25rem" }}>
                        {flash.remainderAddress.address}
                      </p>
                      <Row>
                        <Button
                          full
                          accent
                          onClick={() =>
                            this.confirmDeposit(
                              this.state.flash.depositRequired,
                              this.state.userID
                            )}
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
                      Your Balance:{" "}
                      {flash.transfers.length > 0 &&
                      flash.transfers[flash.transfers.length - 1].find(
                        tx => tx.address === this.state.address
                      ) ? (
                        flash.transfers[flash.transfers.length - 1].find(
                          tx => tx.address === this.state.address
                        ).value / 2
                      ) : (
                        0
                      )}{" "}
                      IOTA
                    </h5>

                    <h5>
                      Remaining Deposit:{" "}
                      {flash.deposit.reduce((a, b) => a + b, 0) / 2} IOTA
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
                          flash.settlementAddresses[userID === 0 ? 1 : 0]
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
          {setup && (
            <Info>
              <h2>What is Flash?</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Curabitur sit amet dolor scelerisque, fringilla quam in, luctus
                dui. Vivamus ac dapibus felis. Vivamus id sem in orci rhoncus
                consectetur.
              </p>
              <p>
                Donec eu sagittis metus. Duis bibendum dui in arcu ultricies, in
                pharetra tellus vehicula. Donec fringilla rhoncus efficitur.
                Fusce eu augue dignissim, pulvinar dolor ut, lacinia dui.
                Vestibulum in eleifend tortor. Aliquam a eleifend libero. Nulla
                finibus rutrum justo, nec tempor tellus cursus vel. Nulla
                consectetur ante vitae nisl sodales, lacinia ullamcorper libero
                vestibulum. Maecenas tempor leo et mi fermentum posuere.
              </p>
            </Info>
          )}
          {setup && (
            <Info>
              <h2>How does it work</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                Curabitur sit amet dolor scelerisque, fringilla quam in, luctus
                dui. Vivamus ac dapibus felis. Vivamus id sem in orci rhoncus
                consectetur.
              </p>
              <p>
                Donec eu sagittis metus. Duis bibendum dui in arcu ultricies, in
                pharetra tellus vehicula. Donec fringilla rhoncus efficitur.
                Fusce eu augue dignissim, pulvinar dolor ut, lacinia dui.
                Vestibulum in eleifend tortor. Aliquam a eleifend libero. Nulla
                finibus rutrum justo, nec tempor tellus cursus vel. Nulla
                consectetur ante vitae nisl sodales, lacinia ullamcorper libero
                vestibulum. Maecenas tempor leo et mi fermentum posuere.
              </p>
            </Info>
          )}
        </Layout>
      )
    }
  }
}

const Info = styled.div`
  max-width: 50rem;
  margin: 4rem 2rem 0;
`

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

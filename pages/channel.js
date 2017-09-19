import React from "react"
import styled from "styled-components"
import { Link, Router } from "../routes"
import { Layout, SingleBox } from "../components/layout"
import Setup from "../components/channelSetup"
import History from "../components/history"

import Header from "../components/channel/header"

import { isClient, seedGen } from "../libs/utils"
import RTC from "../libs/rtc"
import Channel from "../libs/channel"
import { fundChannel } from "../libs/iota"

export default class extends React.Component {
  static async getInitialProps({ query }) {
    return query
  }

  state = {
    history: [
      { msg: "Waiting for a partner...", type: "system", time: Date.now() }
    ],
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
    var started = false
    var Events = await RTC.initChannel(this.props.id)
    RTC.connectToPeers(this.props.id)

    Events.on("message", async message => {
      // console.log(`${message.connection.peer}:`, message.data)
      if (message.data.cmd === "startSetup") {
        var flash = await Channel.signSetup(message)
        this.setState({ flash })
      } else if (message.data.cmd === "deposited") {
        this.confirmDeposit(message.data.index)
        this.updateHistory({
          msg: "Deposit address generated",
          type: "system",
          time: Date.now()
        })
      } else if (message.data.cmd === "composeTransfer") {
        this.updateHistory({
          msg: `Recieved transfer for ${message.data.value}`,
          type: "system",
          time: Date.now()
        })
        // Get diff and set the state
        this.setState({
          channel: "confirm",
          pendingTransfer: {
            title: `Recieve ${message.data.value}i`,
            value: message.data.value,
            address: message.data.settlementAddress,
            bundles: message.data.bundles
          }
        })
      } else if (message.data.cmd === "getBranch") {
        Channel.returnBranch(message.data.digests, message.data.address)
      } else if (message.data.cmd === "message") {
        this.updateHistory({
          msg: message.data.msg,
          type: "partner",
          time: Date.now()
        })
      } else if (message.data.cmd === "closeChannel") {
        this.updateHistory({
          msg: `Recieved request to close`,
          type: "system",
          time: Date.now()
        })
        // Get diff and set the state
        this.setState({
          channel: "confirm",
          pendingTransfer: {
            close: true,
            title: `Requesting to close the Flash Channel`,
            bundles: message.data.bundles
          }
        })
      } else if (message.data.cmd === "closedChannel") {
        this.setState({ flash: message.data.flash })
      } else if (message.data.cmd === "error") {
        this.updateHistory({
          msg: `${message.data.error}`,
          type: "system",
          time: Date.now()
        })
        this.setState({
          channel: "main",
          alert: true,
          alertText: message.data.error
        })
      }
    })
    Events.on("peerLeft", message => {
      console.log(`Peer Left`)
      this.updateHistory({
        msg: "Partner Disconnected",
        type: "system",
        time: Date.now()
      })
      this.setState({ peer: false })
      RTC.connectToPeers(this.props.id)
    })
    Events.on("peerJoined", async message => {
      console.log(`Peer Joined`)
      this.updateHistory({
        msg: "Partner Connected",
        type: "system",
        time: Date.now()
      })
      this.setState({
        peer: true,
        channel: "deposit",
        userID: message.connection.peer.slice(-1) === "0" ? 1 : 0
      })

      if (message.connection.peer.slice(-1) !== "0" && !started) {
        var flash = await Channel.startSetup()
        started = true
        this.setState({ flash })

        var deposit = await fundChannel(flash.depositAddress)
        this.updateHistory({
          msg: "Channel funded from faucet",
          type: "system",
          time: Date.now()
        })
        RTC.broadcastMessage({ cmd: "funded" })
        this.setState({ funded: true })
      }
    })
  }

  updateHistory = data => {
    var history = this.state.history
    history.push(data)
    this.setState({ history })
  }

  sendMessage = e => {
    e.preventDefault()
    if (!this.state.message) return
    this.updateHistory({
      msg: this.state.message,
      type: "me",
      time: Date.now()
    })
    RTC.broadcastMessage({ cmd: "message", msg: this.state.message })
    this.setState({ message: "" })
  }

  confirmTransaction = async transaction => {
    var close = transaction.close

    if (!transaction) {
      this.setState({ channel: "main" })
      return RTC.broadcastMessage({
        cmd: "error",
        error: "Transaction Denied."
      })
    }
    this.setState(
      {
        channel: close ? "closed" : "loading",
        title: "Responding with confimation",
        transfer: ""
      },
      async () => {
        this.updateHistory({
          msg: "Approving Transaction",
          type: "system",
          time: Date.now()
        })
        var state = await Channel.signTransfer(transaction.bundles)
        if (close) {
          this.setState({ ...state, channel: "closed" })
        } else {
          this.setState({ ...state, channel: "main" })
        }
      }
    )
  }

  sendTransaction = async (value, address) => {
    if (value < 1)
      return this.setState({
        alert: true,
        alertText: "Please enter a positive value "
      })
    if (value > this.state.flash.deposit.reduce((a, b) => a + b, 0) / 2)
      return this.setState({
        alert: true,
        alertText: "You can not spend more than you have"
      })

    this.setState(
      {
        channel: "loading",
        title: "Sending transaction to partner",
        transfer: ""
      },
      async () => {
        this.updateHistory({
          msg: `Creating transaction for ${parseInt(value)}`,
          type: "system",
          time: Date.now()
        })
        var state = await Channel.composeTransfer(
          parseInt(value),
          address,
          this.state.userID
        )
        this.setState({ channel: "main", flash: state.flash })
      }
    )
  }

  closeChannel = async () => {
    this.setState(
      { channel: "closed", title: "Closing the channel" },
      async () => {
        this.updateHistory({
          msg: "Closing Channel",
          type: "system",
          time: Date.now()
        })
        var state = await Channel.close()
        console.log("Result: ", state)
        if (state.message) {
          this.setState({
            channel: "main",
            alert: true,
            alertText: `Error when closing. Ask your partner to close`
          })
          return RTC.broadcastMessage({
            cmd: "error",
            error: `Error when closing.`
          })
        }

        this.setState({
          channel: "closed",
          flash: { ...this.state.flash, finalBundle: state[0][0].bundle }
        })
        RTC.broadcastMessage({ cmd: "closedChannel", flash: this.state.flash })
      }
    )
  }

  confirmDeposit = async index => {
    this.updateHistory({
      msg: "Deposit Completed",
      type: "system",
      time: Date.now()
    })
    if (index === this.state.userID) {
      this.setState({ channel: "main" })
    }
  }

  // Change screen to channel start
  setChannel = (address, deposits) => {
    this.setState({ setup: true })
  }

  // Create new channel
  startChannel = async (address, transactions, deposit) => {
    this.setState({ form: 0 })
    const channelID = seedGen(10)

    setTimeout(() => {
      Router.pushRoute(`/channel/${channelID}`)
    }, 500)
    await store.set("state", null)
    this.setState({
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
    })
    window.location.reload(false)
  }

  render() {
    var {
      history,
      title,
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
          <Alert alert={this.state.alert}>
            <AlertBox>
              <h2 style={{ zIndex: 300 }}>
                {this.state.alertText && this.state.alertText}
              </h2>
              <Button
                onClick={() => this.setState({ alert: false })}
              >{`   Clear Notification  `}</Button>
            </AlertBox>
          </Alert>
          <SingleBox noBg={!setup} active={form === 1} row wide>
            <WordLogo src={`/static/iota-white.png`} />
            <Left>
              {channel === "share" && (
                <div>
                  <Header {...this.state} {...this.props} title={title} />
                  <p>Share this room link with your partner:</p>
                  <p>{isClient ? window.location.href : null}</p>
                </div>
              )}
              {channel === "loading" && (
                <div>
                  <Header {...this.state} {...this.props} title={title} />
                  <Spinner {...this.props} src={"/static/loading-dark.svg"} />
                </div>
              )}
              {channel === "closed" && (
                <div>
                  <Header
                    {...this.state}
                    {...this.props}
                    title={
                      flash.finalBundle ? (
                        `Channel has been closed`
                      ) : (
                        `Closing the channel`
                      )
                    }
                  />
                  <p>
                    {`Once completed the link below will display the closing transaction that has been attached to the network`}
                  </p>
                  <p>
                    {flash.finalBundle ? (
                      <a
                        target={"_blank"}
                        href={`https://tanglertestnet.codebuffet.co/search/?kind=bundle&hash=${flash.finalBundle}`}
                      >
                        View Transaction
                      </a>
                    ) : (
                      <Spinner
                        {...this.props}
                        src={"/static/loading-dark.svg"}
                      />
                    )}
                  </p>
                  {flash.finalBundle ? (
                    <Button full onClick={() => this.startChannel()}>
                      Start new channel
                    </Button>
                  ) : null}
                </div>
              )}
              {channel === "confirm" && (
                <div>
                  <Header {...this.state} title={pendingTransfer.title} />
                  <h2 />
                  <p>Do you want to confirm or deny this action?</p>
                  <Row>
                    <Button
                      full
                      accent
                      onClick={() => this.confirmTransaction(pendingTransfer)}
                    >
                      {pendingTransfer.close ? (
                        `Close Channel`
                      ) : (
                        `Confirm Transaction`
                      )}
                    </Button>
                    <Button
                      full
                      left
                      onClick={() => this.confirmTransaction(false)}
                    >
                      {pendingTransfer.close ? (
                        `Deny Close`
                      ) : (
                        `Deny Transaction`
                      )}
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
                        `Deposit address generated.`
                      )
                    }
                  />
                  {flash.depositAddress ? (
                    <div>
                      <p>
                        {`In a normal Flash channel, you would deposit funds into
                        the a multi-signature wallet before you begin transactions.`}
                      </p>
                      <p>
                        Multisig address for this channel:{" "}
                        <span
                          style={{
                            maxWidth: "25rem",
                            fontSize: 10,
                            wordBreak: "break-word"
                          }}
                        >
                          {flash.depositAddress}
                        </span>{" "}
                      </p>
                      <h3
                      >{`This demo does not require you to deposit IOTA.`}</h3>
                      <Row>
                        <Button
                          full
                          accent
                          onClick={() => this.confirmDeposit(this.state.userID)}
                        >
                          Continue
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
                        tx => tx.address === this.state.userSeed
                      ) ? (
                        flash.transfers[flash.transfers.length - 1].find(
                          tx => tx.address === this.state.userSeed
                        ).value / 2
                      ) : (
                        0
                      )}{" "}
                      IOTA
                    </h5>

                    <h5>
                      Remaining spendable IOTA:{" "}
                      {flash.deposit.reduce((a, b) => a + b, 0) / 2}
                    </h5>
                  </Row>
                  <h4>Send IOTA:</h4>
                  <Row>
                    <Field
                      type="number"
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
              <History messages={this.state.history} />
              <Form onSubmit={e => this.sendMessage(e)}>
                <Input
                  type={"text"}
                  placeholder={"Send a message"}
                  value={this.state.message}
                  onChange={msg => this.setState({ message: msg.target.value })}
                />
                <Send type={`submit`}>Send</Send>
              </Form>
            </Right>
          </SingleBox>
          {/* {setup && (
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
          )} */}
        </Layout>
      )
    }
  }
}

const WordLogo = styled.img`
  position: absolute;
  top: -3.6rem;
  height: 3rem;
  left: 1rem;
`

const AlertBox = styled.div`
  background: white;
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #222;
  padding: 2rem 4rem;
  text-align: center;
  &::before {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 25%;
    background: rgba(232, 206, 230, 1);
  }
`

const Alert = styled.div`
  z-index: 200;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${props => (props.alert ? "1" : "0")};
  visibility: ${props => (props.alert ? "visible" : "hidden")};
  transition: all 0.4s ease;
`

const Input = styled.input`
  flex: 1;
  border: none;
  background: none;
  font-size: 16px;
  border-bottom: 2px solid rgba(56, 26, 54, 0.2);
  &:focus {
    outline: none;
  }
`
const Form = styled.form`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: ${props => (props.border ? "2px solid #222" : "none")};
`

const Send = styled.button`
  background: rgba(56, 26, 54, 0.6);
  border: none;
  color: white;
  padding: 5px 10px;
  margin-left: 10px;
`

const Info = styled.div`
  max-width: 50rem;
  margin: 4rem 2rem 0;
`

const Left = styled.div`
  position: relative;
  flex: 1.7 0;
  flex-direction: column;
  height: 100%;
  padding: 10px 20px;
  box-sizing: border-box;
  @media screen and (max-width: 640px) {
    width: 100%;
    min-height: 20rem;
  }
`

const Right = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  background: rgba(232, 206, 230, 1);
  padding: 10px 20px 20px;
  box-sizing: border-box;
  @media screen and (max-width: 640px) {
    width: 100%;
    min-height: 20rem;
  }
}
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

const Spinner = styled.img`
  height: 5rem !important;
  width: 5rem;
  position: absolute;
  left: 50%;
  bottom: 50%;
  margin-bottom: -2.5rem;
  margin-left: -2.5rem;
`

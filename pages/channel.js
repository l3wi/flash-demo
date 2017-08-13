import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"
import Channel from "../components/channel"
import Setup from "../components/channelSetup"

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
    setup: false,
    form: 0,
    transactions: 0,
    address: "",
    peer: false
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ form: 1 })
    }, 300)
  }

  setChannel = (address, transactions, deposits) => {
    this.setState({ setup: true })
  }

  render() {
    var { form, peer, setup } = this.state
    console.log(this.props)
    return (
      <Layout right={setup && SideBar()}>
        <LeftContent noBg={!setup}>
          {!setup ? <Setup setChannel={this.setChannel} /> : <Channel />}
        </LeftContent>
      </Layout>
    )
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
  color: white;
  border-bottom: 2px solid #222;
  &:focus {
    outline: none;
  }
`
const Button = styled.button`
  padding: 15px 20px;
  background: #d30c7b;
  border: none;
  color: white;
  font-weight: 600;
  margin: 0 2rem;
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

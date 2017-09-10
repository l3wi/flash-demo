import React from "react"
import styled from "styled-components"
import { Layout, SingleBox } from "../components/layout"
import { Link, Router } from "../routes"
import { isClient, seedGen } from "../libs/utils"

export default class extends React.Component {
  state = {
    form: 0
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ form: 1 })
    }, 300)
  }

  startChannel = (address, transactions, deposit) => {
    this.setState({ form: 0 })
    const channelID = seedGen(10)
    setTimeout(() => {
      Router.pushRoute(`/channel/${channelID}`)
    }, 500)
  }

  render() {
    var { form } = this.state
    return (
      <Layout>
        <SingleBox noBg active={form === 1}>
          <Logo src={"/static/iota.svg"} />
          <h2>IOTA Flash Channels</h2>
          <p>
            {`Flash channels enables instant, fee-less, peer-to-peer transactions.
            In Flash, users can create a private off-network transaction channel. `}
          </p>
          <p
          >{`Flash is for specific instances that require high-frequency transactions. 
            Scenarios could include Pay-per-second video streaming or EV charging. Since IOTA is 
            fee-less, Flash channels can be opened and closed for free.`}</p>
          {/* <p>
            {`Once a channel is funded by both users can start transacting. Transactions within the channel are signed off-network. 
            This allows for instant transaction without doing continual Proof of Work.`}
          </p> */}
          <Button onClick={() => this.startChannel()}>Start a channel</Button>
        </SingleBox>
      </Layout>
    )
  }
}

const Logo = styled.img`height: 80px;`

const Button = styled.button`
  padding: 15px 20px;
  background: linear-gradient(135deg, #ef7564, #f06263);
  border: none;
  color: white;
  font-weight: 600;
  &:focus {
    outline: none;
  }
`

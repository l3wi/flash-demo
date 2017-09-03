import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"
import { Link, Router } from "../routes"
import shortid from "shortid"
shortid.characters(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
)
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
    const channelID = shortid.generate()
    setTimeout(() => {
      Router.pushRoute(`/channel/${channelID}`)
    }, 500)
  }

  render() {
    var { form } = this.state
    return (
      <Layout>
        <LeftContent noBg active={form === 1}>
          <Logo src={"/static/iota.svg"} />
          <h2>IOTA Flash Channels</h2>
          <p
          >{`Flash channels enable for instant, peer-to-peer transactions.`}</p>
          <p>
            {`In Flash users can create and send transactions between each other off the
      network without doing Proof of Work while remaining secure. `}
          </p>
          <Button onClick={() => this.startChannel()}>Start a channel</Button>
        </LeftContent>
      </Layout>
    )
  }
}

const Logo = styled.img`
  height: 80px;
  margin-top: -80px;
`

const Field = styled.input`
  background: none;
  font-size: 150%;
  padding: 5px 0px;
  width: 100%;
  border: none;
  color: white;
  border-bottom: 2px solid white;
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
  &:focus {
    outline: none;
  }
`

const AnimatedLeftBox = styled.span`
  position: absolute;
  padding: 10px;
  transition: all 0.5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

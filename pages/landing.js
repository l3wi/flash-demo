import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"

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

const AnimatedLeftBox = styled.figure`
  transition: all .5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

export default class extends React.Component {
  state = {
    form: true,
    transactions: 0,
    address: ""
  }

  render() {
    var { form } = this.state
    return (
      <Layout>
        <LeftContent noBg>
          <AnimatedLeftBox active={form}>
            <img src={"/static/iota.svg"} />
            <h2>IOTA Flash Channels</h2>
            <p
            >{`Flash channels enable for instant, peer-to-peer transactions.`}</p>
            <p>
              {`In Flash users can create and send transactions between each other off the
      network without doing Proof of Work while remaining secure. `}
            </p>
            <Button onClick={() => this.setState({ form: false })}>
              Start a channel
            </Button>
          </AnimatedLeftBox>
        </LeftContent>
      </Layout>
    )
  }
}

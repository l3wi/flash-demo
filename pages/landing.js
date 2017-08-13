import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"
import { Link } from "../routes"

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
  transition: all .5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

export default class extends React.Component {
  state = {
    form: 0,
    transactions: 0,
    address: ""
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ form: 1 })
    }, 300)
  }

  render() {
    var { form } = this.state
    return (
      <Layout>
        <LeftContent noBg>
          <AnimatedLeftBox active={form === 1}>
            <img src={"/static/iota.svg"} />
            <h2>IOTA Flash Channels</h2>
            <p
            >{`Flash channels enable for instant, peer-to-peer transactions.`}</p>
            <p>
              {`In Flash users can create and send transactions between each other off the
      network without doing Proof of Work while remaining secure. `}
            </p>
            <Button onClick={() => this.setState({ form: 2 })}>
              Start a channel
            </Button>
          </AnimatedLeftBox>
          <AnimatedLeftBox active={form === 2}>
            <div>
              <Field type="text" placeholder={`Enter maxium transactions`} />
            </div>

            <p>
              {`The channel requires a maximum number of transactions to be defined 
            before hand. Try 100 to start.`}
            </p>
            <div>
              <Field
                type="text"
                placeholder={`Enter your settlement address`}
              />
            </div>
            <p
            >{`This is the address your final balance will be deposited into when the channel is complete`}</p>
            <Link href="/main">
              <Button type={"submit"}>Launch Channel</Button>
            </Link>
          </AnimatedLeftBox>
        </LeftContent>
      </Layout>
    )
  }
}

const Field = styled.input`
  background: none;
  font-size: 200%;
  padding: 5px 0px;
  width: 100%;
  border: none;
  color: white;
  border-bottom: 2px solid white;
  &:focus {
    outline: none;
  }
`

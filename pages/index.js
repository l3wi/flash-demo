import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"
import { Link, Router } from "../routes"
import shortid from "shortid"

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
  transition: all .5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

export default class extends React.Component {
  state = {
    form: 0,
    transactions: "",
    address: "",
    deposit: ""
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ form: 1 })
    }, 300)
  }

  startChannel = (address, transactions, deposit) => {
    const channelID = shortid.generate()
    console.log(channelID)

    if (transactions <= 3)
      return alert(
        "Need more than 3 transaction to make a Flash channel worth while."
      )

    if (deposit < 0)
      return alert(
        "The whole point is to send IOTA. Deposits must be larger than 0"
      )

    if (address.length !== 81 && address.length !== 90)
      return alert("Address not long enough")

    Router.pushRoute(`/channel/${channelID}`, { transactions })
  }

  render() {
    var { form, transactions, address, deposit } = this.state
    return (
      <Layout>
        <LeftContent noBg>
          <AnimatedLeftBox active={form === 1}>
            <Logo src={"/static/iota.svg"} />
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
            <h2>Setup Channel</h2>

            <div>
              <Field
                type="text"
                value={transactions}
                onChange={data =>
                  this.setState({ transactions: data.target.value })}
                placeholder={`Enter maxium transactions`}
              />
            </div>

            <p>
              {`Flash requires a maximum number of transactions to be defined 
            before hand. Try 100 to start.`}
            </p>
            <div>
              <Field
                type="text"
                placeholder={`Enter your inital deposit amount`}
              />
            </div>
            <p
            >{`Specify the amount that you will deposit into the channel to use for transfering. Your partner will have to deposit the same amount.`}</p>
            <div>
              <Field
                type="text"
                value={address}
                onChange={data => this.setState({ address: data.target.value })}
                placeholder={`Enter your settlement address`}
              />
            </div>
            <p
            >{`This is the address your final balance will be deposited into when the channel is complete`}</p>
            <Button
              onClick={() => this.startChannel(address, transactions, deposit)}
            >
              Launch Channel
            </Button>
          </AnimatedLeftBox>
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

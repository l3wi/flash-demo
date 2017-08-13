import React from "react"
import styled, { css } from "styled-components"
import Header from "./header"
export default class extends React.Component {
  state = {
    setup: false,
    form: 0,
    transactions: 0,
    address: "",
    peer: false,
    title: `Waiting for peer to connect...`
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
      <div>
        {/* <Header {...this.state} title={`Waiting for peer to connect...`} />

        <h2>Share this room link with your partner:</h2>
        <p>
          {window && window.location.href}
        </p> */}
        {/* <Header {...this.state} title={`Waiting for deposits`} />

        <h2>Deposit 50 IOTA into this multisig address:</h2>
        <p>
          {`SFDYSHYROSXOFMNFSJTNJYZGJDLSVOPDOEKVRB9KOGHXRFPPLXPVANRKIRGLBCVHGMVMMNNBWFFXASURD`}
        </p> */}
        <Header {...this.state} title={`Channel Setup!`} />

        <Row>
          <h5>Your Balance: 80 IOTA</h5>
          <h5>Partner Balance: 20 IOTA</h5>
          <h5>Remaining transactable: 0 IOTA</h5>
        </Row>
        <h4>Send IOTA:</h4>
        <Row>
          <Field type={"number"} placeholder={"Enter amount in IOTA"} />
          <div />
        </Row>
        <Row>
          <Button full>Send Transfer</Button>
          <Button full left>
            Request Transfer
          </Button>
        </Row>

        <Row>
          <Button full accent>
            Close Channel
          </Button>
        </Row>
      </div>
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

import React from "react"
import styled from "styled-components"
import Header from "./header"
export default class extends React.Component {
  state = {
    setup: false,
    form: 0,
    transactions: 0,
    address: "",
    peer: false,
    title: `Waiting for peer`
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
        <Header {...this.state} />

        <Row>
          <h5>Your Balance: 5 IOTA</h5>
          <h5>Partner Balance: 20 IOTA</h5>
          <h5>Partner Balance: 20 IOTA</h5>
        </Row>
        <h4>Send IOTA to your partner:</h4>
        <Row>
          <Field type={"number"} placeholder={"Enter amount to send"} />
          <Button>Send Transfer</Button>
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

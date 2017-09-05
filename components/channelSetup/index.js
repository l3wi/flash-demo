import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../layout"

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
    // if (transactions <= 3)
    //   return alert(
    //     "Need more than 3 transaction to make a Flash channel worth while."
    //   )

    if (deposit < 0)
      return alert(
        "The whole point is to send IOTA. Deposits must be larger than 0"
      )

    if (address.length !== 81 && address.length !== 90)
      return alert("Address not long enough")
    this.setState({ form: 0 })

    setTimeout(() => {
      this.props.setChannel(address, deposit)
    }, 500)
  }
  render() {
    var { form, address, transactions, deposit } = this.state
    return (
      <AnimatedLeftBox active={form === 1}>
        <h2>Setup Channel</h2>
        {/* <div>
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
        </p> */}
        <div>
          <Field
            type="text"
            value={deposit}
            onChange={data => this.setState({ deposit: data.target.value })}
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
    )
  }
}

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
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
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

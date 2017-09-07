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

    // if (address.length !== 81 && address.length !== 90)
    //   return alert("Address not long enough")

    this.setState({ form: 0 })

    setTimeout(() => {
      this.props.setChannel()
    }, 500)
  }
  render() {
    var { form, address, transactions, deposit } = this.state
    return (
      <AnimatedLeftBox active={form === 1}>
        <h2>Welcome to the Flash Channel demo</h2>
        {/* {!this.props.currentMessage && (
          <div>
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
          </div>
        )}

        <div>
          <Field
            type="text"
            value={address}
            onChange={data => this.setState({ address: data.target.value })}
            placeholder={`Enter your settlement address`}
          />
        </div> */}
        <p
        >{`The demo uses a seed, a settlement address that has been generated on your behalf.
        In a real world use case, you'll enter these yourself and specify the amount of IOTA 
        you would like to transact in the channel.`}</p>
         <p
        >{`The channel will have 10,000 testnet IOTA deposited into it when it is opened.`}</p>
        <Button
          onClick={() => this.startChannel()}
        >
          Enter the Channel
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

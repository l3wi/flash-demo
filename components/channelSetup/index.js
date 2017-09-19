import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../layout"
import { isGL } from "../../libs/utils.js"

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
    this.setState({ form: 0 })

    setTimeout(() => {
      this.props.setChannel()
    }, 500)
  }
  render() {
    var { form, address, transactions, deposit } = this.state
    return (
      <AnimatedLeftBox active={form === 1}>
        <h2>Enter a Flash Channel</h2>
        <p
        >{`In a real world use case, you'll enter a settlement address and specify the amount of IOTA 
        you would like to transact in the channel. The demo uses a seed, a settlement 
        address that has been generated on your behalf.`}</p>
        <p
        >{`The demo channel will have 2,000 IOTA from the testnet deposited into it when it is opened. 
        You can also chat with your partner in the sidebar.`}</p>
        <Button
          active={!isGL()}
          onClick={() => (!isGL() ? null : this.startChannel())}
        >
          {!isGL() ? `Enable WebGL to Continue` : `Enter the Channel`}
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
  background: ${props =>
    props.active ? "grey" : "linear-gradient(135deg, #ef7564, #f06263)"};
  border: none;
  color: white;
  font-weight: 600;
  &:focus {
    outline: none;
  }
`

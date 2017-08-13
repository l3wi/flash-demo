import React from "react"
import styled from "styled-components"
import { Layout, LeftContent, RightContent } from "../components/layout"

const AnimatedLeftBox = styled.span`
  position: absolute;
  transition: all .5s ease;
  transform: ${props =>
    props.active ? "translateY(0px)" : "translateY(20px)"};
  visibility: ${props => (props.active ? "visible" : "hidden")};
  opacity: ${props => (props.active ? "1" : "0")};
`

const SideBar = () =>
  <RightContent>
    <h3>Channel History</h3>
    <div>
      {[
        "Waiting for a mate...",
        "Mate connected.",
        "Signing addresses",
        "Deposit address generated"
      ]
        .reverse()
        .map(item =>
          <p>
            {item}
          </p>
        )}
    </div>
  </RightContent>

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
      <Layout right={SideBar()}>
        <LeftContent>
          <AnimatedLeftBox active={form === 1}>
            <h3>Waiting for a mate...</h3>
          </AnimatedLeftBox>
        </LeftContent>
      </Layout>
    )
  }
}

import React from "react"
import styled from "styled-components"

export const Layout = props =>
  <Main>
    <Left>
      {props.children}
    </Left>
    <Right>
      {props.right}
    </Right>
  </Main>

export const LeftContent = props =>
  <LeftBox {...props}>
    {props.children}
  </LeftBox>

export const RightContent = props =>
  <RightBox>
    {props.children}
  </RightBox>

const Main = styled.div`
  display: flex;
  flex-direction: row;
  color: white;
  height: 100vh;
  @media screen and (max-width: 640px) {
    flex-direction: column;
  }
`

const Left = styled.section`
  position: relative;
  flex: 1.5;
  background: #222222;
`

const Right = styled.section`
  position: relative;
  flex: 1;
  background: #73877b;
`

const LeftBox = styled.div`
  position: absolute;
  top: 20%;
  right: 0%;
  min-height: 25rem;
  max-width: 35rem;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  background: ${props => (props.noBg ? "none" : "#fff")};
  color: ${props => (props.noBg ? "none" : "#222")};
  @media screen and (max-width: 640px) {
    top: 20%;
    right: 0%;
    min-width: 100vw;
  }
`

const RightBox = styled.div`
  position: absolute;
  top: 20%;
  left: 0%;
  min-height: 25rem;
  min-width: 16rem;
  box-sizing: border-box;
  padding: 10px;
  background: #b4b4b4;
  @media screen and (max-width: 640px) {
    top: 0%;
    right: 0%;
    min-height: 20rem;
    min-width: 100vw;
  }
`

import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import Flash from "../libs/flash";

import { webRTC } from "../libs/flash";

export default class extends React.Component {
  state = {
    one: "",
    two: "",
    flash: {}
  };

  componentDidMount() {
    // Bundddles
  }

  startChannel = transactions => {
    var initial = {
      one: seedGen(81),
      two: seedGen(81)
    };
    /// Act as Player 1
    console.log(transactions);
    var flash = Flash.master.initalize(initial.one, transactions);
    // Act as player 2
    flash = Flash.slave.initalize(initial.two, flash);

    Flash.master.newTransaction(flash);

    // Flash.master.closeTransaction(flash);

    this.setState({ flash, ...initial });
  };

  newAddresses = (one, two, flash) => {
    // New trany from Player 1
    flash = Flash.master.newAddress(one, flash);
    // Confirm transaction as Player 2
    flash = Flash.slave.closeAddress(one, flash);
    console.log(flash);
    this.setState({ flash });
  };

  render() {
    var { one, two, flash, transactions } = this.state;
    return (
      <Wrapper>
        <div>
          <h4>Flash Object</h4>
          <div>
            <input
              value={transactions}
              placeholder={`Max number of transactions`}
              onChange={data =>
                this.setState({ transactions: data.target.value })}
            />
            <button onClick={() => this.startChannel(transactions)}>
              Start Channel
            </button>
          </div>
          <div>
            <button onClick={() => this.newAddresses(one, two, flash)}>
              New addy
            </button>
            <p>
              Depth: {flash.depth} Address Index: {flash.addressIndex}
            </p>
            {flash.addresses &&
              flash.addresses.map((level, index) =>
                <div key={index}>
                  <strong>
                    Level: {index}
                  </strong>
                  <p>
                    {level.address && level.address.substring(0, 10)} ...
                  </p>
                </div>
              )}
          </div>
        </div>
        <div>
          <h2>Player 1</h2>
          <p>
            Seed: {one && one.substring(0, 10)}...
          </p>
        </div>
        <div>
          <h2>Player 2</h2>
          <p>
            Seed: {two && two.substring(0, 10)}...
          </p>
        </div>
      </Wrapper>
    );
  }
}

const Wrapper = styled.section`
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
`;

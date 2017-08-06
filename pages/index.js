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
    var initial = {
      one: seedGen(81),
      two: seedGen(81)
    };
    /// Act as Player 1
    var flash = Flash.master.initalize(initial.one, 10);
    // Act as player 2
    flash = Flash.slave.startup(initial.two, flash);

    this.setState({ flash, ...initial });
  }

  newAddresses = (one, two, flash) => {
    // New trany from Player 1
    flash = Flash.master.startTransfer(one, flash);
    // Confirm transaction as Player 2
    flash = Flash.slave.closeTransfer(two, flash, flash.reqBundles);
    console.log(flash);
    this.setState({ flash });
  };

  render() {
    var { one, two, flash } = this.state;
    return (
      <Wrapper>
        <div>
          <h2>Player 1</h2>
          <p>
            Seed: {one && one.substring(0, 10)}...
          </p>
        </div>
        <div>
          <h4>Flash Object</h4>
          <button onClick={() => this.nedAddresses(one, two, flash)}>
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

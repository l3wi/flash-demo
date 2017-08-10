import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import Flash from "../libs/flash";

import { webRTC } from "../libs/flash";

export default class extends React.Component {
  state = {
    one: "",
    two: "",
    flash: {},
    total: { master: 50, slave: 50 },
    remainder: 100
  };

  componentDidMount() {
    // Bundddles
  }

  startChannel = async transactions => {
    var initial = {
      one: seedGen(81),
      two: seedGen(81)
    };
    /// Act as Player & Create inital addresses
    console.log(transactions);
    var flash = Flash.master.initalize(
      initial.one,
      transactions,
      50,
      initial.one
    );
    // Act as Player 2 & Sign those addeses
    flash = Flash.slave.initalize(initial.two, flash, initial.two);

    flash = await Flash.master.newTransaction(
      flash,
      { master: 10, slave: 10 },
      initial.one
    );

    // Sign those transactionbundles
    flash = await Flash.slave.closeTransaction(flash, initial.two);
    console.log('updated flash', flash);
    this.setState({ flash, ...initial });
  };

  newTransaction = async (one, two, flash) => {
    // New trany from Player 1
    flash = Flash.master.newAddress(one, flash);
    // Confirm transaction as Player 2
    flash = Flash.slave.closeAddress(one, flash);
    // Start new transaction
    flash = await Flash.master.newTransaction(
      flash,
      { master: 0, slave: 0 },
      one
    );
    // Finsh signing the bundles
    flash = await Flash.slave.closeTransaction(flash, two);
    console.log("Updated Bundle: ", flash);
    this.setState({ flash });
  };

  closeChannel = async (one, two, flash) => {
    flash = await Flash.master.closeChannel(flash, one);
    console.log(flash);
    flash = await Flash.slave.closeFinalBundle(flash, two);
    console.log("Updated Bundle: ", flash);
  };

  send = (uid, amount, flash) => {
    flash.balance.remainder = flash.balance.remainder - amount * 2;
    if ("master") {
      flash.balance.master = flash.balance.master + amount;
      flash.balance.slave = flash.balance.slave - amount;
    } else {
      flash.balance.master = flash.balance.master - amount;
      flash.balance.slave = flash.balance.slave + amount;
    }
    if (flash.balance.remainder <= 0)
      return alert(
        "You have no more balance. You should close this channel nowish.s"
      );
    this.setState({ ...flash });
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
            <button onClick={() => this.startChannel(parseInt(transactions))}>
              Start Channel
            </button>
          </div>
          <div>
            <button onClick={() => this.newTransaction(one, two, flash)}>
              New Transaction
            </button>

            <p>
              {/* Balance left: {flash && flash.balance.remainder} */}
            </p>
          </div>
          <div>
            <button onClick={() => this.closeChannel(one, two, flash)}>
              Close Channel
            </button>

            <p>
              {/* Balance left: {flash && flash.balance.remainder} */}
            </p>
          </div>
        </div>
        <div>
          <h2>Player 1</h2>
          <p>
            Seed: {one && one.substring(0, 10)}...
          </p>
          <button onClick={() => this.send("master", 10, flash)}>
            Send 10
          </button>
        </div>
        <div>
          <h2>Player 2</h2>
          <p>
            Seed: {two && two.substring(0, 10)}...
          </p>
          <button onClick={() => this.send("slave", 5, flash)}>Send 5</button>
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

import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import Flash from "../libs/flash";
import CloseRoom from "../libs/flash/close-room.js"

export default class extends React.Component {
  state = {
    flash: {},
    seeds: {},
    total: { master: 50, slave: 50 },
    remainder: 100
  };

  closeRoom = new CloseRoom()

  componentDidMount() {
    // Bundddles
  }

  startChannel = async (maxTransactions) => {
    if(isNaN(maxTransactions)) {
      maxTransactions = 100
    }
    console.log(maxTransactions);
    var seeds = {
      master: seedGen(81),
      slave:  seedGen(81)
    };
    /// Act as Player & Create inital addresses
    var flash = Flash.master.initalize(
      seeds.master,
      maxTransactions,
      50,
      'KFENNTAJQPKKL9TQISCID9ERYXQNGBJWEUIKVH9QEUSC9PLMFLJOGHYPYGSUZXRXHBAMAKWIFZWYCP9FYLTMKNOVEB'
    );
    flash.stake = {
      master: 50,
      slave: 50
    }
    flash.index = 0
    console.log('first half of room', flash);

    // Act as Player 2 & Sign those addeses
    flash = Flash.slave.initalize(seeds.slave, flash, 'KFENNTAJQPKKL9TQISCID9ERYXQNGBJWEUIKVH9QEUSC9PLMFLJOGHYPYGSUZXRXHBAMAKWIFZWYCP9FYLTMKNOVEE');

    flash.index = 1
    flash.stake = {
      master: 50,
      slave: 50
    }
    console.log('updated flash', flash);
    this.setState({ flash, seeds });
  };

  closeChannel = async (seeds, flash) => {
    flash = await Flash.master.closeChannel(flash, seeds.master)
    flash = await Flash.slave.closeFinalBundle(flash, seeds.slave)
    await this.closeRoom.attachAndPOWClosedBundle()
  };

  send = (to, from, amount, flash, seeds) => {
    for(var key of Object.keys(flash.stake)) {
      flash.stake[key] -= amount
      flash.total[key] += amount
    }
    flash.total[from] -= amount
    flash.total[to] += amount
    var remainder = Object.values(flash.stake).reduce((sum, value) => sum + value)
    if(remainder < 0) {
      alert("This flash channel has no transportable balance left. The room should be closed.")
      return
    }

    (async() => {
      flash = await Flash.master.newTransaction(flash, seeds[to])
    })()
  };

  render() {
    var { seeds, flash, transactions } = this.state;
    return (
      <Wrapper>
        <div>
          <h4>Flash Object</h4>
          <div>
            Max number of transactions (defaults to 100)<br />
            <input
              value={transactions}
              type='number'
              onChange={data =>
                this.setState({ transactions: data.target.value })}
            />
            <button onClick={() => this.startChannel(parseInt(transactions))}>
              Start Channel
            </button>
          </div>
          <div>
            <p>
              {/* Balance left: {flash && flash.balance.remainder} */}
            </p>
          </div>
          <div>
            <button onClick={() => this.closeChannel(seeds, flash)}>
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
            Seed: {seeds.master && seeds.master.substring(0, 10)}...
          </p>
          <button onClick={() => this.send("master", "slave", 10, flash, seeds)}>
            Send 10
          </button>
        </div>
        <div>
          <h2>Player 2</h2>
          <p>
            Seed: {seeds.slave && seeds.slave.substring(0, 10)}...
          </p>
          <button onClick={() => this.send("master", "slave", 10, flash, seeds)}>Send 10</button>
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

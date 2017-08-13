import React from "react";
import styled from "styled-components";

import { seedGen, startAddresses, closeAddresses } from "../libs/flash/iota";
import Flash from "../libs/flash";
import CloseRoom from "../libs/flash/close-room.js";

export default class extends React.Component {
  state = {
    flash: {},
    seeds: {},
    total: {
      master: 50,
      slave: 50
    },
    remainder: 100
  };

  closeRoom = new CloseRoom();

  componentDidMount() {
    // Bundddles
  }

  testMultisig = async () => {
    // First co-signer uses index 0 and security level 3
    var digestOne = iota.multisig.getDigest("ABCDFG", 0, 3);

    // Second cosigner also uses index 0 and security level 3 for the private key
    var digestTwo = iota.multisig.getDigest("FDSAG", 0, 3);

    // Multisig address constructor
    var Address = iota.multisig.address;

    // Initiate the multisig address generation
    var address = new Address()
      // Absorb the first cosigners key digest
      .absorb(digestOne)
      // Absorb the second cosigners key digest
      .absorb(digestTwo)
      // and finally we finalize the address itself
      .finalize()

    console.log("MULTISIG ADDRESS: ", address);

    // Simple validation if the multisig was created correctly
    // Can be called by each cosigner independently
    var isValid = iota.multisig.validateAddress(address, [
      digestOne,
      digestTwo
    ]);

    console.log("IS VALID MULTISIG ADDRESS:", isValid);

    //  SIGNING EXAMPLE
    //
    //  Even though these functions are c alled subsequently, the addSignature functions have to be called by each
    //  cosigner independently. With the previous signer sharing the output (bundle with the transaction objects)
    //
    //  When it comes to defining the remainder address, you have to generate that address before making a transfer
    //  Important to know here is the total sum of the security levels used by the cosigners.
    var multisigTransfer = [
      {
        address:
          "ZGHXPZYDKXPEOSQTAQOIXEEI9K9YKFKCWKYYTYAUWXK9QZAVMJXWAIZABOXHHNNBJIEBEUQR",
        value: 999
      }
    ];
    // Define remainder address
    var remainderAddress =
      "NZRALDYNVGJWUVLKDWFKJVNYLWQGCWYCURJIIZRLJIKSAIVZSGEYKTZRDBGJLOA9AWYJQB9IPWRAKUC9F";

    iota.multisig.initiateTransfer(
      6,
      address,
      remainderAddress,
      multisigTransfer,
      function(e, initiatedBundle) {
        if (e) {
          console.log(e);
        }

        iota.multisig.addSignature(
          initiatedBundle,
          address,
          iota.multisig.getKey("ABCDFG", 0, 3),
          function(e, firstSignedBundle) {
            if (e) {
              console.log(e);
            }

            iota.multisig.addSignature(
              firstSignedBundle,
              address,
              iota.multisig.getKey("FDSAG", 0, 3),
              function(e, finalBundle) {
                if (!e) {
                  console.log(
                    "IS VALID SIGNATURE: ",
                    iota.utils.validateSignatures(finalBundle, address)
                  );
                }
              }
            );
          }
        );
      }
    );
  };

  startChannel = async maxTransactions => {
    // lewis iota vanlla here
    if (isNaN(maxTransactions)) {
      maxTransactions = 100;
    }
    console.log(maxTransactions);
    var seeds = {
      master: seedGen(81),
      slave: seedGen(81)
    };
    //seeds.slave = seeds.master; // a thing
    /// Act as Player & Create inital addresses
    var flash = Flash.master.initalize(
      seeds.master,
      maxTransactions,
      50,
      "KFENNTAJQPKKL9TQISCID9ERYXQNGBJWEUIKVH9QEUSC9PLMFLJOGHYPYGSUZXRXHBAMAKWIFZWYCP9FYLTMKNOVEB"
    );
    flash.stake = {
      master: 50,
      slave: 50
    };
    flash.index = 0;
    console.log("first half of room", Object.assign({}, flash));

    // Act as Player 2 & Sign those addeses
    flash = Flash.slave.initalize(
      seeds.slave,
      flash,
      "KFENNTAJQPKKL9TQISCID9ERYXQNGBJWEUIKVH9QEUSC9PLMFLJOGHYPYGSUZXRXHBAMAKWIFZWYCP9FYLTMKNOVEE"
    );
    flash.index = 1;
    flash.stake = {
      master: 50,
      slave: 50
    };
    console.log("second half of room", Object.assign({}, flash));
    console.log("deposit address: ", flash.addresses[0].address);
    this.setState({ flash, seeds });
  };

  closeChannel = async (seeds, flash) => {
    flash = await Flash.master.closeChannel(flash, seeds.master);
    flash = await Flash.slave.closeFinalBundle(flash, seeds.slave);
    var results = await this.closeRoom.attachAndPOWClosedBundle(flash.finalBundles);
    console.log("attachAndPOWClosedBundle", results);
    for(var bundle of results) {
      console.log(
        "attachAndPOWClosedBundle > validateSignatures",
        iota.utils.validateSignatures(bundle, flash.addresses[0].address)
      );
    }
  };

  send = (to, from, amount, flash, seeds) => {
    for (var key of Object.keys(flash.stake)) {
      flash.stake[key] -= amount;
      flash.total[key] += amount;
    }
    flash.total[from] -= amount;
    flash.total[to] += amount;
    var remainder = Object.values(flash.stake).reduce(
      (sum, value) => sum + value
    );
    if (remainder < 0) {
      alert(
        "This flash channel has no transportable balance left. The room should be closed."
      );
      return;
    }

    (async () => {
      flash = await Flash.master.newTransaction(flash, seeds[to]);
      console.log("first half of tx: ", flash);
      flash = await Flash.slave.closeTransaction(flash, seeds[from]);
      console.log("second half of tx: ", flash);
      this.setState({ flash });
    })();
  };

  render() {
    var { seeds, flash, transactions } = this.state;
    return (
      <Wrapper>
        <div>
          <h4>Flash Object</h4>
          <button onClick={() => this.testMultisig()}>Test Multisig</button>
          <div>
            Max number of transactions (defaults to 100)<br />
            <input
              value={transactions}
              type="number"
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
          <button
            onClick={() => this.send("master", "slave", 10, flash, seeds)}
          >
            Send 10
          </button>
        </div>
        <div>
          <h2>Player 2</h2>
          <p>
            Seed: {seeds.slave && seeds.slave.substring(0, 10)}...
          </p>
          <button
            onClick={() => this.send("master", "slave", 10, flash, seeds)}
          >
            Send 10
          </button>
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

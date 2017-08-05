## How it works:

### Establish State

Player 1 enters:

- Say how many transactions
- calculate the depth: log(base3 X) & generate index counter
- Initiate multisig address genny
- Waits for other user to join

Player 2 enter:

- Establish RTC connection
- **Reconcile State** (Recieve state)
- Complete mulitsig address setup
- Generate address
- **Reconcile State** (Send state)

Player 1 & 2:

- Send IOTA to the multisig address
- They also enter their settlement addresses

### Change State

Player 1 wants to change state:

- Initiate new address genneration for outputs
- **Complete two party address generation**


- Initiate the transaction request w/ outputs pointing to the new address
- **Run the tree** to determine the terminating Root.
- Check to see if the signature for each parents in the tree has been used 3 times.
  - If so move on to the parent's sibling and generate a new bundle for that item.
- Generate bundle root itself.
- **Reconcile State**

Player 2:

- **Reconcile State** (Recieve the bundles )
- Accept the proposed transaction and sign the bundles
- **Reconcile State** (Send back the signed bundles )

Player 1:

- Verify signed bundles

### End Channel

Player 1 or 2 ends the session

- Leaving user attaches the latest set of bundles to finalise the channel.

## Limitations

1. Once tokens are spent you aren't allowed to reuse them

   - This is to prevent double spends


- So the more transactions that occur the less tokens available left to send. 

2. Multisig arrangements require collateral (or trust).

   - There needs to be an equal incentive for both users to work together, other wise one party can lock up the money forever.
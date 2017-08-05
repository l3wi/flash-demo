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
- Complete mulitsig setup
- Generate address
- **Reconcile State** (Send state)

Player 1 & 2:

- Send IOTA to the multisig address

### Change State

Player 1 wants to change state:

- Initiate the transaction request
- **Run the tree** to determine the terminating Root.
- Generate bundles for Root's parents & the root itself.
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
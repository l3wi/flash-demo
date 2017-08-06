# Flash POC

Flash is IOTA's approach to payment channels (TL;DR off-tangle transactions with on-Tangle settlement if users desire so). In order to showcase how Flash works and why it is quite powerful, we intend to develop a public demonstration website so that people can try it out themselves.

## The Setup

The Proof of Concept will consist of a website, where users can go to to open up a new payment channel. The user will then be redirected to a unique page, where they get an address for funding a browser wallet. The user then makes a deposit to that address, once it's confirmed the user can now start sharing the link with a friend (only works with a single person atm) and then they can initiate the payment channel with each other via WebRTC.

Once the payment channel is initiated, they can start sending funds between each other (think kind of ping pong). And then they can also go into high frequency trading mode, where they can basically deplet the funds between each other in real time to showcase how fast payments are processed.

Once they are done, they can settle in real time and both users then see their respective balance in the browser and can withdraw it to their walelts.



### Approach

The Flash payment system uses a tree topology reduce the number of transactions to be attached. Usually each transfer would have to be attached to the tangle, requiring a large amount of PoW. 

This approach takes advantage of the fact that a signature can be used upto 3 times while remaining reasonably secure. This lets us build a tree, where the terminating roots are the individual transactions that will occur in the Flash channel.

![Tree image](http://i.imgur.com/v90BcQ0.png)



The number of transactions required to settle a Flash channel relates directly to the depth of the tree. The depth is determined by assesing the number of inidividual transactions that will occur offline within the Flash channel then applying `log(base3)x` to that number. 

For example: if you require a **60** transaction channel you'll require a tree with a depth **4**. As `log(base3)60 = 3.726` which we will round up to a depth of **4**.

Each time you create a transaction you move left to right along the bottom of the tree. If a parent node has been used 3 times then the transaction will have to shift to the parent's sibling and generate a bundle for that node.

The result of this approach is only needing to attach **4** transactions for upto **81** offline Flash transactions and for only **8** transactions you can upto **6561** Flash transactions.

## How it works:

Very very rough way the Flash system will work

#### Establish State

Player 1 enters:

- [ ] Say how many transactions
- [x] calculate the depth: `log(base3)x` 
- [x] Generate fresh Flash object w/ counter
- [x] Initiate multisig address genny
- [ ] Waits for other user to join

Player 2 enter:

- [ ] Establish RTC connection
- [ ] **Reconcile State** (Recieve state)
- [x] Complete mulitsig address 
- [ ] **Reconcile State** (Return Address)

Player 1 & 2:

- [ ] Send IOTA to the multisig address
- [ ] They also enter their settlement addresses

#### Change State

Player 1 wants to change state:

- [ ] Initiate the transaction request w/ outputs pointing to the new address
- [x] **Run the tree** to determine the terminating Root.
- [x] Initiate new address genneration for outputs

-**Two party address generation happens here**-

- [x] Check to see if the signature for each parent in the tree has been used 3 times.
- [ ] If so move on to the parent's sibling and generate a new bundle for that item.If so move on to the parent's sibling and generate a new bundle for that item.
- [ ] Generate bundle root itself.
- [ ] Send to Player 2

-**Two party address generation happens here**-


Player 2:

- [ ] Accept the proposed transaction and sign the bundles
- [ ] Send bundle to Player 1

Player 1:

- [ ] Verify signed bundles

#### End Channel

Player 1 or 2 ends the session

- [ ] Leaving user attaches the latest set of bundles to finalise the channel.

## Limitations

1. Once tokens are spent you aren't allowed to reuse them

   - This is to prevent double spends


- So the more transactions that occur the less tokens available left to send. 

2. Multisig arrangements require collateral (or trust).

   - There needs to be an equal incentive for both users to work together, other wise one party can lock up the money forever.

## Getting Started

```
git clone https://github.com/l3wi/flashDemo.git

yarn

yarn dev
```



lewi
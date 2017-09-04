import RTC, { events } from "./rtc"
import shortid from "shortid"
import Flash from "../git_modules/flash/lib/flash.js"
import multisig from "../git_modules/flash/lib/multisig"
import transfer from "../git_modules/flash/lib/transfer"
import { Attach, iota } from "./iota"
import Presets from "./presets"
const IOTACrypto = require("iota.crypto.js")

shortid.characters(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@"
)

export default class Channel {
  // Security level
  static SECURITY = 2

  // Number of parties taking signing part in the channel
  static SIGNERS_COUNT = 2

  // Flash tree depth
  static TREE_DEPTH = 4

  static flash = {}

  // Initiate the local state and store it localStorage
  static async startSetup(
    userIndex = 0,
    userID = shortid.generate(),
    index = 0,
    security = Channel.SECURITY,
    signersCount = Channel.SIGNERS_COUNT,
    treeDepth = Channel.TREE_DEPTH,
    balance = 0,
    deposit = Array(Channel.SIGNERS_COUNT).fill(0)
  ) {
    // Escape the function when server rendering
    if (!isWindow()) return false

    var userSeed = seedGen(81)

    console.log("Initialising Channel")

    // Initialize state object
    const state = {
      userIndex: userIndex,
      userID: userID,
      userSeed: userSeed,
      index: index,
      security: security,
      depth: treeDepth,
      bundles: [],
      flash: {
        signersCount: signersCount,
        balance: balance,
        deposit: deposit,
        outputs: {},
        transfers: []
      }
    }
    await store.set("state", state)

    // Get a new digest
    state.partialDigests = []
    for (let i = 0; i < treeDepth + 1; i++) {
      const digest = await Channel.getNewDigest()
      state.partialDigests.push(digest)
    }

    RTC.broadcastMessage({
      cmd: "startSetup",
      digests: state.partialDigests,
      balance
    })

    await store.set("state", state)
  }

  // Sets up other users
  static async signSetup(message) {
    // Create the state object for the others
    const state = {
      userIndex: message.connection.peer.slice(-1) === "0" ? 1 : 0,
      userID: shortid.generate(),
      userSeed: seedGen(81),
      index: 0,
      security: Channel.SECURITY,
      depth: Channel.TREE_DEPTH,
      bundles: [],
      flash: {
        signersCount: Channel.SIGNERS_COUNT,
        balance: 0,
        deposit: Array(Channel.SIGNERS_COUNT).fill(0),
        outputs: {},
        transfers: []
      }
    }
    const digests = message.data.digests

    state.partialDigests = digests.map(() =>
      multisig.getDigest(state.userSeed, state.index++, state.security)
    )

    RTC.broadcastMessage({ cmd: "signSetup", digests: state.partialDigests })
    await store.set("state", state)
  }

  // Will only work with one partner. Easy to add N
  static async closeSetup(message) {
    console.log("Server Digests: ", message.data.digests)
    var state = await store.get("state")

    var digests = state.partialDigests
    const serverDigests = message.data.digests

    let multisigs = digests.map((digest, index) => {
      let addy = multisig.composeAddress([digest, serverDigests[index]])
      addy.index = digest.index
      addy.securitySum = digest.security + serverDigests[index].security
      addy.security = digest.security
      return addy
    })

    // Get remainder addy
    const remainderAddress = multisigs.shift()

    for (let i = 1; i < multisigs.length; i++) {
      multisigs[i - 1].children.push(multisigs[i])
    }

    console.log(remainderAddress)
    console.log(iota.utils.addChecksum(multisigs[0].address))

    // Update root and remainder address
    state.flash.remainderAddress = remainderAddress
    state.flash.root = multisigs.shift()

    // Update root & remainder in state
    await store.set("state", state)
    Channel.shareFlash(state.flash)
    return state.flash
  }

  // Send flash object with partner
  static async shareFlash(flash) {
    RTC.broadcastMessage({ cmd: "shareFlash", flash })
  }

  static async getNewBranch(address, digests) {
    console.log("Branch Event", "Digests: ", digests)
    // Request New Branch
    RTC.broadcastMessage({
      cmd: "getBranch",
      address: address.address,
      digests
    })
    // Subscribe once to a get branch emitter.
    return new Promise((res, rej) => {
      events.once("message", async message => {
        if (message.data.cmd === "returnBranch") {
          const newAddress = await Channel.applyBranch(
            digests,
            message.data.digests,
            address
          )
          console.log(message.data.digests)
          res(newAddress)
        }
      })
    })
  }

  static async returnBranch(digests, address) {
    var state = await store.get("state")

    let myDigests = digests.map(() =>
      multisig.getDigest(state.userSeed, state.index++, state.security)
    )
    {
      // compose multisigs, write to remainderAddress and root
      let multisigs = digests.map((digest, i) => {
        let addy = multisig.composeAddress([digest, myDigests[i]])
        addy.index = myDigests[i].index
        addy.security = myDigests[i].security
        return addy
      })
      for (let i = 1; i < multisigs.length; i++) {
        multisigs[i - 1].children.push(multisigs[i])
      }
      let node = multisig.getMultisig(state.flash.root, address)
      if (!node)
        RTC.broadcastMessage({
          cmd: "returnBranch",
          error: "Multisig not found"
        })
      node.children.push(multisigs[0])
    }

    await store.set("state", state)

    console.log(myDigests)
    RTC.broadcastMessage({
      cmd: "returnBranch",
      digests: myDigests
    })

    return myDigests
  }

  static async applyBranch(digests, serverDigests, address) {
    var state = await store.get("state")
    let multisigs = digests.map((digest, index) => {
      let addy = multisig.composeAddress([digest, serverDigests[index]])
      addy.index = digest.index
      addy.securitySum = digest.security + serverDigests[index].security
      addy.security = digest.security
      return addy
    })

    multisigs.unshift(address)
    for (let i = 1; i < multisigs.length; i++) {
      multisigs[i - 1].children.push(multisigs[i])
    }
    return address
  }

  // Get a new digest and update index in state
  static async getNewDigest() {
    // Fetch state from localStorage
    const state = await store.get("state")

    // Create new digest
    const digest = multisig.getDigest(
      state.userSeed,
      state.index,
      state.security
    )

    // Increment digests key index
    state.index++
    state.init = true

    // Update local state
    await store.set("state", state)
    return digest
  }

  // Initiate transaction from anywhere in the app.
  static async composeTransfer(value, settlementAddress, index) {
    // Get latest state from localstorage
    const state = await store.get("state")

    // TODO: check/generate tree
    if (!state.flash.root) {
      return
    }
    let toUse = multisig.updateLeafToRoot(state.flash.root)
    if (toUse.generate != 0) {
      // Tell the server to generate new addresses, attach to the multisig you give
      const digests = await Promise.all(
        Array(toUse.generate)
          .fill()
          .map(() => Channel.getNewDigest())
      )
      await Channel.getNewBranch(toUse.multisig, digests)
    }

    // Compose transfer
    const flash = state.flash
    let bundles
    try {
      // No settlement addresses and Index is 0 as we are alsways sending from the client
      let newTansfers = transfer.prepare(
        [Presets.ADDRESS, Presets.ADDRESS],
        flash.deposit,
        index,
        [
          {
            address: settlementAddress,
            value: value
          }
        ]
      )
      bundles = transfer.compose(
        flash.balance,
        flash.deposit,
        flash.outputs,
        toUse.multisig,
        flash.remainderAddress,
        flash.transfers,
        newTansfers
      )
    } catch (e) {
      console.log("Error: ", e)
      switch (e.message) {
        case "2":
          alert("Not enough funds")
          break
        case "4":
          alert("Incorrect bundle order")
          break
        default:
          alert("An error occured. Please reset channel")
      }
      return false
    }

    // Sign transfer
    const signedBundles = transfer.sign(
      state.flash.root,
      state.userSeed,
      bundles
    )

    const signatures = signedBundles.map((bundle, id) => {
      const address = bundle.find(tx => tx.value < 0).address
      return bundle
        .map((tx, i) => {
          return {
            signature: tx.signatureMessageFragment,
            address: tx.address,
            bundle: id,
            tx: i
          }
        })
        .filter(
          s =>
            !IOTACrypto.utils.inputValidator.isNinesTrytes(s.signature) &&
            s.address == address
        )
    })
    console.log("Signed: ", signatures)

    // Update bundles in local state
    state.bundles = signedBundles
    await store.set("state", state)
    RTC.broadcastMessage({
      cmd: "composeTransfer",
      signedBundles,
      value,
      settlementAddress,
      index
    })
    // Wait for RTC response
    return new Promise((res, rej) => {
      // Wait for messages back
      let sigs = Array(2).fill()
      sigs[state.userIndex] = signatures
      events.on("message", async message => {
        if (message.data.cmd === "returnSignature") {
          // Add user signatures into the correct spot in the array
          sigs[message.data.index] = message.data.signatures
          //
          if (sigs.find(sig => !sig)) {
            console.log("Waiting for all slots to be filled")
          } else {
            console.log(sigs)
            var finalBundles = bundles
            // Construct the signed bundles
            sigs.map(user => {
              user.map(bundle => {
                bundle.map(
                  tx =>
                    (finalBundles[tx.bundle][
                      tx.tx
                    ].signatureMessageFragment = IOTACrypto.signing.signatureFragment(
                      finalBundles[tx.bundle][tx.tx].signatureMessageFragment,
                      tx.signature
                    ))
                )
              })
            })

            console.log(finalBundles)
            transfer.applyTransfers(
              flash.root,
              flash.deposit,
              flash.outputs,
              flash.remainderAddress,
              flash.transfers,
              finalBundles
            )
            state.bundles = signedBundles
            console.log("Recieved Completed Bundles: ", signedBundles)
            state.flash = flash
            state.bundles = message.data.signedBundles
            await store.set("state", state)
            res(state)
          }
        }
      })
    })
  }

  static signTransfer = async bundles => {
    const state = await store.get("state")
    console.log(state)

    try {
      const signedBundles = transfer.sign(
        state.flash.root,
        state.userSeed,
        bundles
      )

      const signatures = signedBundles.map((bundle, id) => {
        const address = bundle.find(tx => tx.value < 0).address
        return bundle
          .map((tx, i) => {
            return {
              signature: tx.signatureMessageFragment,
              address: tx.address,
              bundle: id,
              tx: i
            }
          })
          .filter(
            s =>
              !IOTACrypto.utils.inputValidator.isNinesTrytes(s.signature) &&
              s.address == address
          )
      })
      console.log("Signatures: ", signatures)
      RTC.broadcastMessage({
        cmd: "returnSignature",
        signatures,
        index: state.userIndex
      })
    } catch (e) {
      console.log("Error: ", e)
      switch (e.message) {
        case "2":
          alert("Not enough funds")
          break
        case "4":
          alert("Incorrect bundle order")
          break
        default:
          alert("An error occured. Please reset channel")
      }
      return e
    }
  }

  static closeTransfer = async bundles => {
    const state = await store.get("state")
    console.log(state)

    try {
      const signedBundles = transfer.sign(
        state.flash.root,
        state.userSeed,
        bundles
      )

      transfer.applyTransfers(
        state.flash.root,
        state.flash.deposit,
        state.flash.outputs,
        state.flash.remainderAddress,
        state.flash.transfers,
        signedBundles
      )
      state.bundles = signedBundles
      console.log(state)
      // Save updated state
      await store.set("state", state)
      console.log("Signed Bundles: ", signedBundles)
      RTC.broadcastMessage({ cmd: "returnTransfer", signedBundles })
      return state
    } catch (e) {
      console.log("Error: ", e)
      switch (e.message) {
        case "2":
          alert("Not enough funds")
          break
        case "4":
          alert("Incorrect bundle order")
          break
        default:
          alert("An error occured. Please reset channel")
      }
      return e
    }
  }

  // Update bundles in local state by applying the diff
  static applyTransferDiff(diff) {
    // Get state
    const state = store.get("state")

    // Apply diff to bundles in state
    ///state.bundles = TODO: bundles with applied diff;

    store.set("state", state)
  }

  static close = async () => {
    // Get latest state from localstorage
    const state = await store.get("state")
    if (!state.flash.root) {
      return console.log()
    }
    // TODO: check/generate tree
    let toUse = multisig.updateLeafToRoot(state.flash.root)
    if (toUse.generate != 0) {
      // Tell the server to generate new addresses, attach to the multisig you give
      const digests = await Promise.all(
        Array(toUse.generate)
          .fill()
          .map(() => Channel.getNewDigest())
      )
      await Channel.getNewBranch(toUse.multisig, digests)
    }
    console.log(state)
    // Compose transfer
    const flash = state.flash
    let bundles
    try {
      // No settlement addresses and Index is 0 as we are alsways sending from the client
      let newTansfers = transfer.close([Presets.ADDRESS, null], flash.deposit)

      bundles = transfer.compose(
        flash.balance,
        flash.deposit,
        flash.outputs,
        flash.root,
        flash.remainderAddress,
        flash.transfers,
        newTansfers,
        true
      )
    } catch (e) {
      console.log("Error: ", e)
      switch (e.message) {
        case "2":
          alert("Not enough funds")
          break
        default:
          alert("An error occured. Please reset channel")
      }
      return false
    }
    console.log("Unsigned", bundles)

    // Sign transfer
    const signedBundles = transfer.sign(
      state.flash.root,
      state.userSeed,
      bundles
    )
    console.log("Bundles", signedBundles)

    // Update bundles in local state
    state.bundles = signedBundles

    // const res = await API("close", opts)
    RTC.broadcastMessage({
      cmd: "closeChannel",
      signedBundles
    })

    // Wait for RTC response
    return new Promise((res, rej) => {
      events.once("message", async message => {
        if (message.data.cmd === "returnClose") {
          // Apply the transfer to the state
          transfer.applyTransfers(
            flash.root,
            flash.deposit,
            flash.outputs,
            flash.remainderAddress,
            flash.transfers,
            message.data.signedBundles
          )

          state.bundles = message.data.signedBundles
          //Save the State
          await store.set("state", state)
          // Attach the bundles with PoW
          var result = await Attach.POWClosedBundle(state.bundles)
          console.log(result)
          res(result)
        }
      })
    })
  }

  static closeChannel = async bundles => {
    const state = await store.get("state")
    console.log(state)

    try {
      const signedBundles = transfer.sign(
        state.flash.root,
        state.userSeed,
        bundles
      )

      transfer.applyTransfers(
        state.flash.root,
        state.flash.deposit,
        state.flash.outputs,
        state.flash.remainderAddress,
        state.flash.transfers,
        signedBundles
      )
      state.bundles = signedBundles
      console.log(state)
      // Save updated state
      await store.set("state", state)
      console.log("Closing Bundles: ", signedBundles)
      RTC.broadcastMessage({ cmd: "returnClose", signedBundles })
      return state
    } catch (e) {
      console.log("Error: ", e)
      switch (e.message) {
        case "2":
          alert("Not enough funds")
          break
        case "4":
          alert("Incorrect bundle order")
          break
        default:
          alert("An error occured. Please reset channel")
      }
      return e
    }
  }

  // Update bundles in local state by applying the diff
  static async initFlash(flash) {
    // Get state
    if (!flash) {
      const state = await store.get("state")
      Channel.flash = new Flash({ ...state.flash })
    } else {
      const state = await store.get("state")
      state.flash = flash
      store.set("state", state)
      Channel.flash = new Flash({ ...flash })
    }
  }
}

// Generate a random seed. Higher security needed
const seedGen = length => {
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9"
  var i
  var result = ""
  if (window.crypto && window.crypto.getRandomValues) {
    var values = new Uint32Array(length)
    window.crypto.getRandomValues(values)
    for (i = 0; i < length; i++) {
      result += charset[values[i] % charset.length]
    }
    return result
  } else
    throw new Error(
      "Your browser is outdated and can't generate secure random numbers"
    )
}

// Store class utitlizing localStorage
class Store {
  static get(item) {
    return JSON.parse(localStorage.getItem(item))
  }
  static set(item, data) {
    localStorage.setItem(item, JSON.stringify(data))
  }
}
// Check if window is available
export const isWindow = () => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    // if (!("store" in global) || !(global.store instanceof Store)) {
    //   global.store = Store
    // }
    return false
  }
  global.store = Store
  return true
}
isWindow()

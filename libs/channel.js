import RTC, { events } from "./rtc"
import Flash from "../git_modules/flash/lib/flash.js"
import multisig from "../git_modules/flash/lib/multisig"
import transfer from "../git_modules/flash/lib/transfer"
import { Attach, iota } from "./iota"
import Presets from "./presets"
const IOTACrypto = require("iota.crypto.js")

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
    index = 0,
    security = Channel.SECURITY,
    signersCount = Channel.SIGNERS_COUNT,
    treeDepth = Channel.TREE_DEPTH,
    balance = 2000,
    deposit = Array(Channel.SIGNERS_COUNT).fill(1000)
  ) {
    // Escape the function when server rendering
    if (!isWindow()) return false

    // if (await store.get("state")) {
    //   return console.log("Channel already initialised")
    // }

    var userSeed = seedGen(81)

    console.log("Initialising Channel")

    // Initialize state object
    const state = {
      userIndex: userIndex,
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
    return new Promise((res, rej) => {
      // Create a digest object (2 people atm)
      var allDigests = []
      allDigests[state.userIndex] = state.partialDigests
      events.on("return", async message => {
        if (message.data.cmd === "returnSetup") {
          allDigests[message.data.index] = message.data.digests

          let multisigs = state.partialDigests.map((digest, index) => {
            let addy = multisig.composeAddress(
              allDigests.map(userDigests => userDigests[index])
            )
            addy.index = digest.index
            addy.signingIndex = state.userIndex * digest.security
            addy.securitySum = allDigests
              .map(userDigests => userDigests[index])
              .reduce((acc, v) => acc + v.security, 0)
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
          state.flash.settlementAddresses = [userSeed, message.data.address]
          state.index = message.data.digests.length

          RTC.broadcastMessage({
            cmd: "returnSetup",
            return: true,
            digests: state.partialDigests,
            index: state.userIndex,
            settlementAddresses: [userSeed, message.data.address]
          })
          console.log(state)

          // Update root & remainder in state
          await store.set("state", state)
          events.removeListener("return")
          res(state.flash)
        }
      })
    })
  }

  // Sets up other users
  static async signSetup(message) {
    const seedAddress = seedGen(81)
    // Create the state object for the others
    const state = {
      userIndex: message.connection.peer.slice(-1) === "0" ? 1 : 0,
      userSeed: seedAddress,
      index: 0,
      security: Channel.SECURITY,
      depth: Channel.TREE_DEPTH,
      bundles: [],
      flash: {
        signersCount: Channel.SIGNERS_COUNT,
        balance: 2000,
        deposit: Array(Channel.SIGNERS_COUNT).fill(1000),
        outputs: {},
        transfers: []
      }
    }
    const digests = message.data.digests

    state.partialDigests = digests.map(() =>
      multisig.getDigest(state.userSeed, state.index++, state.security)
    )
    console.log(state)
    RTC.broadcastMessage({
      cmd: "returnSetup",
      return: true,
      digests: state.partialDigests,
      address: seedAddress,
      index: state.userIndex
    })

    return new Promise((res, rej) => {
      // Create a digest object (2 people atm)
      var allDigests = []
      allDigests[state.userIndex] = state.partialDigests
      events.on("return", async message => {
        if (message.data.cmd === "returnSetup") {
          allDigests[message.data.index] = message.data.digests

          let multisigs = digests.map((digest, index) => {
            let addy = multisig.composeAddress(
              allDigests.map(userDigests => userDigests[index])
            )
            addy.index = digest.index
            addy.signingIndex = state.userIndex * digest.security
            addy.securitySum = allDigests
              .map(userDigests => userDigests[index])
              .reduce((acc, v) => acc + v.security, 0)
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
          state.flash.settlementAddresses = message.data.settlementAddresses

          // Update root & remainder in state
          console.log(state)
          await store.set("state", state)
          events.removeListener("return")
          res(state.flash)
        }
      })
    })
  }

  // Send flash object with partner
  static async shareFlash(flash) {
    RTC.broadcastMessage({ cmd: "shareFlash", flash })
  }

  static async getNewBranch(addressMultisig, generate) {
    var state = await store.get("state")

    var digests = Array(generate)
      .fill()
      .map((_, i) => {
        console.log(state.index)
        return multisig.getDigest(state.userSeed, state.index++, state.security)
      })
    console.log("New branch digests: ", digests)

    // Request New Branch
    RTC.broadcastMessage({
      cmd: "getBranch",
      address: addressMultisig.address,
      digests,
      index: state.userIndex
    })

    await store.set("state", state)
    // Subscribe once to a get branch emitter.
    return new Promise((res, rej) => {
      var allDigests = []
      allDigests[state.userIndex] = digests
      events.on("return", async message => {
        if (message.data.cmd === "returnBranch") {
          allDigests[message.data.index] = message.data.digests

          let multisigs = digests.map((digest, index) => {
            let addy = multisig.composeAddress(
              allDigests.map(userDigests => userDigests[index])
            )
            addy.index = digest.index
            addy.signingIndex = state.userIndex * digest.security
            addy.securitySum = allDigests
              .map(userDigests => userDigests[index])
              .reduce((acc, v) => acc + v.security, 0)
            addy.security = digest.security
            return addy
          })

          // multisigs.unshift(addressMultisig)

          for (let i = 1; i < multisigs.length; i++) {
            multisigs[i - 1].children.push(multisigs[i])
          }

          addressMultisig.children.push(multisigs[0])

          console.log("Address Mutlisig: ", addressMultisig)
          events.removeListener("return")

          RTC.broadcastMessage({
            cmd: "returnBranch",
            digests,
            return: true,
            index: state.userIndex
          })
          await store.set("state", state)
          res(addressMultisig)
        }
      })
    })
  }

  static async returnBranch(digests, address) {
    var state = await store.get("state")

    let myDigests = digests.map(() => {
      console.log(state.index)
      return multisig.getDigest(state.userSeed, state.index++, state.security)
    })

    console.log("New branch digests: ", myDigests)

    RTC.broadcastMessage({
      cmd: "returnBranch",
      digests: myDigests,
      return: true,
      index: state.userIndex
    })

    return new Promise((res, rej) => {
      var allDigests = []
      allDigests[state.userIndex] = myDigests
      events.on("return", async message => {
        if (message.data.cmd === "returnBranch") {
          allDigests[message.data.index] = message.data.digests
          let addressMultisig = {}

          let multisigs = digests.map((digest, index) => {
            console.log(digest.index)
            let addy = multisig.composeAddress(
              allDigests.map(userDigests => userDigests[index])
            )
            addy.index = digest.index
            addy.signingIndex = state.userIndex * digest.security
            addy.securitySum = allDigests
              .map(userDigests => userDigests[index])
              .reduce((acc, v) => acc + v.security, 0)
            addy.security = digest.security
            return addy
          })

          // Because we only pass the string, we need to find the mutlisig object to start from
          addressMultisig = multisig.getMultisig(state.flash.root, address)
          multisigs.unshift(addressMultisig)

          for (let i = 1; i < multisigs.length; i++) {
            multisigs[i - 1].children.push(multisigs[i])
          }
          console.log("Address Mutlisig: ", addressMultisig)

          await store.set("state", state)
          events.removeListener("return")
          res(addressMultisig)
        }
      })
    })
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
  static async composeTransfer(value, settlementAddress) {
    // Get latest state from localstorage
    const state = await store.get("state")

    // TODO: check/generate tree
    if (!state.flash.root) {
      return
    }
    let toUse = multisig.updateLeafToRoot(state.flash.root)
    if (toUse.generate != 0) {
      // Tell the server to generate new addresses, attach to the multisig you give
      await Channel.getNewBranch(toUse.multisig, toUse.generate)
      // state was modified
      let modifiedState = await store.get("state")
      state.index = modifiedState.index
    }
    // Compose transfer
    let bundles
    try {
      // empty transfers
      let transfers
      // Map over the tx's and add the totals on
      transfers = [
        {
          value: value,
          address: settlementAddress
        }
      ]

      console.log(transfers)
      // No settlement addresses and Index is 0 as we are alsways sending from the client
      let newTansfers = transfer.prepare(
        state.flash.settlementAddresses,
        state.flash.deposit,
        state.userIndex,
        transfers
      )
      bundles = transfer.compose(
        state.flash.balance,
        state.flash.deposit,
        state.flash.outputs,
        toUse.multisig,
        state.flash.remainderAddress,
        state.flash.transfers,
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

    console.log(state.index)
    console.log(state.flash.root)

    // Sign transfer
    const signatures = transfer.sign(
      toUse.multisig,
      state.userSeed,
      bundles,
      state.userIndex
    )

    console.log("Signed: ", signatures)
    console.log(state.flash)

    RTC.broadcastMessage({
      cmd: "composeTransfer",
      bundles,
      value,
      settlementAddress,
      index: state.userIndex,
      multisig: toUse.multisig
    })
    // Wait for RTC response
    return new Promise((res, rej) => {
      // Make counter for users
      let sigs = Array(2).fill()
      // Sign your bundle initially
      let signedBundles = transfer.appliedSignatures(bundles, signatures)
      console.log(signedBundles)
      // Start listening for messages
      events.on("return", async message => {
        if (message.data.cmd === "returnSignature") {
          // Add user signatures into the correct spot in the array
          signedBundles = transfer.appliedSignatures(
            signedBundles,
            message.data.signatures
          )
          console.log(signedBundles)

          // Mark off these sigs from the counter
          sigs[message.data.index] = true
          if (sigs.find(sig => !sig)) {
            console.log("Waiting for all slots to be filled")
          } else {
            console.log("Completed Bundles: ", signedBundles)

            transfer.applyTransfers(
              state.flash.root,
              state.flash.deposit,
              state.flash.outputs,
              state.flash.remainderAddress,
              state.flash.transfers,
              signedBundles
            )
            // Save state
            state.bundles = signedBundles
            await store.set("state", state)

            // Needs a share flash.
            RTC.broadcastMessage({
              cmd: "returnSignature",
              return: true,
              signatures,
              index: state.userIndex
            })

            events.removeListener("return")
            res(state)
          }
        }
      })
    })
  }

  // Sign transfer an wait for it to be returned.
  static signTransfer = async bundles => {
    const state = await store.get("state")

    const signatures = transfer.sign(
      state.flash.root,
      state.userSeed,
      bundles,
      state.userIndex
    )

    console.log("Signatures: ", signatures)
    console.log(state.flash.root)

    RTC.broadcastMessage({
      cmd: "returnSignature",
      return: true,
      signatures,
      index: state.userIndex
    })
    return new Promise((res, rej) => {
      // Make counter for users
      let sigs = Array(2).fill()
      // Sign your bundle initially
      let signedBundles = transfer.appliedSignatures(bundles, signatures)
      // Start listening for messages
      events.on("return", async message => {
        if (message.data.cmd === "returnSignature") {
          // Add user signatures into the correct spot in the array
          signedBundles = transfer.appliedSignatures(
            signedBundles,
            message.data.signatures
          )

          // Mark off these sigs from the counter
          sigs[message.data.index] = true
          if (sigs.find(sig => !sig)) {
            console.log("Waiting for all slots to be filled")
          } else {
            transfer.applyTransfers(
              state.flash.root,
              state.flash.deposit,
              state.flash.outputs,
              state.flash.remainderAddress,
              state.flash.transfers,
              signedBundles
            )
            console.log("Completed Bundles: ", signedBundles)
            // Save state
            state.bundles = signedBundles
            await store.set("state", state)

            // Needs a share flash.
            events.removeListener("return")
            res(state)
          }
        }
      })
    })
  }

  static close = async () => {
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
      let newTansfers = transfer.close(flash.settlementAddresses, flash.deposit)

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

    console.log("Bundles: ", bundles)

    // Sign transfer
    const signatures = transfer.sign(
      state.flash.root,
      state.userSeed,
      bundles,
      state.userIndex
    )

    console.log("Signed: ", signatures)

    RTC.broadcastMessage({
      cmd: "closeChannel",
      bundles,
      index: state.userIndex
    })
    // Wait for RTC response
    return new Promise((res, rej) => {
      // Make counter for users
      let sigs = Array(2).fill()
      // Sign your bundle initially
      let signedBundles = transfer.appliedSignatures(bundles, signatures)
      console.log(signedBundles)
      // Start listening for messages
      events.on("return", async message => {
        if (message.data.cmd === "returnSignature") {
          // Add user signatures into the correct spot in the array
          signedBundles = transfer.appliedSignatures(
            signedBundles,
            message.data.signatures
          )
          // Mark off these sigs from the counter
          sigs[message.data.index] = true
          if (sigs.find(sig => !sig)) {
            console.log("Waiting for all slots to be filled")
          } else {
            try {
              transfer.applyTransfers(
                flash.root,
                flash.deposit,
                flash.outputs,
                flash.remainderAddress,
                flash.transfers,
                signedBundles
              )
            } catch (e) {
              console.log("Error: ", e)
              switch (e.message) {
                case "4":
                  alert("Signature Error")
                  break
                default:
                  alert("An error occured. 😂")
              }
              return false
            }
            console.log("Completed Bundles: ", signedBundles)
            // Save state
            state.bundles = signedBundles
            state.flash = flash
            await store.set("state", state)

            var result = await Attach.POWClosedBundle(state.bundles)
            console.log(result)
            RTC.broadcastMessage({ cmd: "channelClosed", result })
            events.removeListener("return")
            res(result)
          }
        }
      })
    })
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

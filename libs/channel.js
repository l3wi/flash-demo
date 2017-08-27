import API from "./api"
import shortid from "shortid"
import Flash from "./flash/flash.js"
import multisig from "./flash/multisig"
import transfer from "./flash/transfer"
import {Attach, iota} from "./iota"
import Presets from './presets'

export default class Channel {
  // Security level
  static SECURITY = 2

  // Number of parties taking signing part in the channel
  static SIGNERS_COUNT = 2

  // Flash tree depth
  static TREE_DEPTH = 4

  static flash = {}

  // Initiate the local state and store it localStorage
  static async initialize(
    userID = shortid.generate(),
    index = 0,
    security = Channel.SECURITY,
    signersCount = Channel.SIGNERS_COUNT,
    treeDepth = Channel.TREE_DEPTH,
    balance = 0,
    deposit = Array(Channel.SIGNERS_COUNT).fill(0),
    stakes = [1].concat(Array(Channel.SIGNERS_COUNT - 1).fill(0))
  ) {
    // Escape the function when server rendering
    if (!isWindow()) return false
    
    var userSeed = seedGen(81)

    // Stop if local state exists
    const localState = await store.get("state")
    if (localState) {
       return localState
    }
    console.log('Initialising Channel')
    

    // Initialize state object
    const state = {
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
        stakes: stakes,
        outputs: {},
        transfers: []
      }
    }

    // Initiate the state in local storage
    await store.set("state", state);

    // Get a new digest
    // Fetch new multisig addresses
    // consists of { root, remainder }
    const digests = [];
    for (let i = 0; i < treeDepth + 1; i++) {
      const digest = await Channel.getNewDigest();
      digests.push(digest);
    }
    const addresses = await Channel.register(digests, userID);

    // Update root and remainder address
    state.flash.remainderAddress = addresses.remainder;
    state.flash.root = addresses.root;

    // Update root & remainder in state
    await store.set("state", state)

    // Create a flash instance
    Channel.flash = new Flash({
      ...state.flash
    })

    return state
  }

  static async register(digests, userID) {
    console.log('Address Digests: ', digests)

    const opts = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        id: userID,
        digests: digests
      })
    }
    console.log(opts)
    // Send digests to server and obtain new multisig addresses
    const response = await API("register", opts)

    console.log('Server Digests: ', response)
    const serverDigests = response.digests;
    let multisigs = digests.map((digest, index) => {      
      let addy = multisig.composeAddress([digest, serverDigests[index]]);
      addy.index = digest.index;
      addy.securitySum = digest.security + serverDigests[index].security;
      addy.security = digest.security;
      return addy;
    });
    
    const remainderAddress = multisigs.shift();

    for(let i = 1; i < multisigs.length; i++) {
        multisigs[i-1].children.push(multisigs[i]);
    }
    console.log(multisigs[0]);
    console.log(iota.utils.addChecksum(multisigs[0].address))
    
    return {
      remainder: remainderAddress,
      root: multisigs.shift()
    };
  }

  static async getNewBranch(userID, address, digests) {
    console.log('Branch Event', "Digests: ", digests)

    const opts = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        id: userID,
        address: address.address,
        digests: digests
      })
    }
    console.log("Sending: ", opts.body)
    // Send digests to server and obtain new multisig addresses
    const response = await API("branch", opts)

    console.log('Server Digests: ', response)
    const serverDigests = response.digests;
    let multisigs = digests.map((digest, index) => {      
      let addy = multisig.composeAddress([digest, serverDigests[index]]);
      addy.index = digest.index;
      addy.securitySum = digest.security + serverDigests[index].security;
      addy.security = digest.security;
      return addy;
    });
    
    multisigs.unshift(address);
    for(let i = 1; i < multisigs.length; i++) {
        multisigs[i-1].children.push(multisigs[i]);
    }
    return address;
  }

  // Get a new digest and update index in state
  static async getNewDigest() {
    // Fetch state from localStorage
    const state = store.get("state");

    // Create new digest
    const digest = multisig.getDigest(
      state.userSeed,
      state.index,
      state.security
    );

    // Increment digests key index
    state.index++;
    state.init = true


    // Update local state
    await store.set("state", state)

    return digest
  }

  // Obtain address by sending digest, update multisigs in state
  static async getNewAddress(digest) {
    
    const state = await store.get("state")

    if (!digest) {
      digest = getNewDigest()
    }

    // Send digest to server and obtain new multisig address
    const response = await API("address", {
      method: "POST",
      body: JSON.stringify({
        id: state.userID,
        digest: digest
      })
    })
    
    var addresses = multisig.composeAddress(digests)
    console.log(response)

    // Check to see if response is valid
    if (typeof addresses.address !== "string")
      return alert(":( something went wrong")

    return addresses
  }

  // Initiate transaction from anywhere in the app.
  static async composeTransfer(value, settlementAddress, id) {
    /// Check if Flash state exists
    await Channel.initFlash()
    // Get latest state from localstorage
    const state = await store.get("state")
    var purchases = await store.get("purchases")
    
    // TODO: check/generate tree
    if (!state.flash.root) return
    let toUse = multisig.updateLeafToRoot(state.flash.root);
    if(toUse.generate != 0) {
      // Tell the server to generate new addresses, attach to the multisig you give
      const digests = await Promise.all(Array(toUse.generate).fill().map(() => Channel.getNewDigest()));
      await Channel.getNewBranch(
        state.userID,
        toUse.multisig, 
        digests);
    }
    // Compose transfer
    const flash = state.flash;
    let bundles;
    try {
      // No settlement addresses and Index is 0 as we are alsways sending from the client
      let newTansfers = transfer.prepare([Presets.ADDRESS, null], flash.stakes, flash.deposit, 0, [{
        address: settlementAddress,
        value: value
      }])
       bundles = transfer.compose(
        flash.balance, 
        flash.deposit, 
        flash.outputs, 
        flash.stakes, 
        toUse.multisig, 
        flash.remainderAddress, 
        flash.transfers, 
        newTansfers);
    } 
    catch(e) {
      console.log("Error: ", e)
      switch (e.message) {
        case "2": alert("Not enough funds")
        break
        default: alert("An error occured. Please reset channel")
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

    // Return signed bundles
    const opts = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        id: state.userID,
        bundles: signedBundles,
        item: id
      })
    }
    console.log(opts)

    const res = await API('purchase', opts);
    if (res.bundles) {

      transfer.applyTransfers(
        state.flash.root, 
        state.flash.deposit, 
        state.flash.stakes, 
        state.flash.outputs, 
        state.flash.remainderAddress, 
        state.flash.transfers, 
        res.bundles);
      // Save updated state
      await store.set("state", state)

      // Check is purchases exists
      if (!purchases) var purchases = []
      // Push the purchase recipt to the browser
      purchases.push({...res, value})
      // save purchases for reload
      store.set("purchases", purchases)
    } else{
      console.error(res)
    }
 
    // Return recipt to be used by the calling function
    return res
  }

  // Update bundles in local state by applying the diff
  static applyTransferDiff(diff) {
    // Get state
    const state = store.get("state")

    // Apply diff to bundles in state
    ///state.bundles = TODO: bundles with applied diff;

    store.set("state", state)
  }

  // Update bundles in local state by applying the diff
  static async initFlash() {
    // Get state
    const state = await store.get("state")
    Channel.flash = new Flash({...state.flash})
    return
  }

  static async close() {
    /// Check if Flash state exists
    await Channel.initFlash()

    // Get latest state from localstorage
    const state = await store.get("state")

    // TODO: check/generate tree
    let toUse = multisig.updateLeafToRoot(state.flash.root);
    if(toUse.generate != 0) {
      // Tell the server to generate new addresses, attach to the multisig you give
      const digests = await Promise.all(Array(toUse.generate).fill().map(() => Channel.getNewDigest()));
      await Channel.getNewBranch(
        state.userID,
        toUse.multisig, 
        digests);
    }
    console.log(state)
    // Compose transfer
    const flash = state.flash;
    let bundles
      try {
          // No settlement addresses and Index is 0 as we are alsways sending from the client
        let newTansfers = transfer.close([Presets.ADDRESS, null], flash.deposit)

         bundles = transfer.compose(
          flash.balance, 
          flash.deposit, 
          flash.outputs, 
          flash.stakes, 
          flash.root, 
          flash.remainderAddress, 
          flash.transfers, 
          newTansfers,
          true);
     } 
     catch(e) {
       console.log("Error: ", e)
       switch (e.message) {
         case "2": alert("Not enough funds")
         break
         default: alert("An error occured. Please reset channel")
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

    // Return signed bundles
    const opts = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify({
        id: state.userID,
        bundles: signedBundles,
        item: null
      })
    }
    console.log(opts)
    const res = await API('close', opts);

    if (res.bundles) {
        transfer.applyTransfers(
        state.flash.root, 
        state.flash.deposit, 
        state.flash.stakes, 
        state.flash.outputs, 
        state.flash.remainderAddress, 
        state.flash.transfers, 
        res.bundles);
      // Save updated state
      await store.set("state", state)
    } else {
      return console.error(e)
    }

    console.log(res)
    if (!res.error) {
      var result = await Attach.POWClosedBundle(res.bundles)
      console.log(result)      
      return result
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

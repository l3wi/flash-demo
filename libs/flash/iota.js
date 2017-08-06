import IOTA from "iota.lib.js";
import Api from "./api";
// Create IOTA instance directly with provider
var iota = new IOTA({
  provider: "https://node.tangle.works"
});

//////////////////////////////////////
///// All functions are in pairs /////

///// Initialise a bunch of addresses for the left of the tree
export const startAddresses = (seed, index, depth) => {
  var trytes = Object.assign(
    [],
    Array(depth).fill().map((_, i) => {
      var obj = {
        depth: i,
        index: index,
        trytes: initiateAddress(seed, index)
      };
      index++;
      return obj;
    })
  );
  return trytes;
};

// Close off the addresses for the array
export const closeAddresses = (seed, trytes) => {
  var addresses = Object.assign(
    [],
    trytes.map((item, index) => {
      return {
        depth: item.depth,
        index: item.index,
        address: finishAddress(seed, item.index, item.trytes)
      };
    })
  );
  return addresses;
};

// Starts a multisig address in a spot on the tree
export const startSingleAddress = (seed, index, reqBundles, addresses) => {
  for (var i in reqBundles) {
    addresses[reqBundles[i]] = {
      depth: reqBundles[i],
      index: index,
      trytes: initiateAddress(seed, index)
    };
    // Push index up
    index++;
  }
  return { addresses, addressIndex: index };
};

// Closes the address and puts it in the tree
export const closeSingleAddress = (seed, reqBundles, addresses) => {
  for (var i in reqBundles) {
    var item = addresses[reqBundles[i]];
    addresses[reqBundles[i]] = {
      depth: reqBundles[i],
      index: item.index,
      address: finishAddress(seed, item.index, item.trytes)
    };
  }
  return addresses;
};

////// HELPERS
// Start new addresses
const initiateAddress = (seed, index) => {
  // Create new digest
  var digest = iota.multisig.getDigest(seed, index + 1, 2);
  // Add your digest to the trytes
  return iota.multisig.addAddressDigest(digest);
};

const finishAddress = (seed, index, curlTrytes) => {
  // Create new digest
  var digest = iota.multisig.getDigest(seed, index + 1, 2);
  // Add your digest to the trytes
  var finalTrytes = iota.multisig.addAddressDigest(digest, curlTrytes);
  // Squeeze out address
  return iota.multisig.finalizeAddress(finalTrytes);
};

// Generate a random seed. Higher security needed
export const seedGen = length => {
  if (!isWindow()) return;
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
  var i;
  var result = "";
  if (window.crypto && window.crypto.getRandomValues) {
    var values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  } else
    throw new Error(
      "Your browser sucks and can't generate secure random numbers"
    );
};

// Check if window is available
const isWindow = () => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    global.localStorage = {};
    return false;
  }
  return true;
};

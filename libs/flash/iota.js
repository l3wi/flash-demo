import Api from "./api";
import { iota } from "../iota-node";

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
///////////////////////////////////////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////////////////////////////////////
export const buildMultipleBundles = async (flash, value) => {
  /// Check to see if its the first run?
  if (!flash.reqBundles) {
    // Generate an array of promises to be to initialise the tree
    var bundleProms = Array(flash.depth - 1).fill().map(async (_, i) => {
      // Build a bundle with the whole value & point down the tree
      var transfers = [
        {
          address: flash.addresses[i + 1].address,
          value: value
        }
      ];
      var bundle = await startTransfer(flash.addresses[i].address, transfers);
      console.log(bundle);

      return {
        bundle,
        addressIndex: flash.addresses[i].index
      };
    });
    // Wait until all concurrent promises are returned
    return await Promise.all(bundleProms);
  }

  // Generate an array of promises to be to generate specific bundles
  var bundleProms = flash.reqBundles.map(async (item, i) => {
    // Make up the transfer
    var transfers = [
      {
        address: flash.addresses[item].address, // NEED TO HANDLE END OF TREE (Needs to be +1)
        value: value // need to actually pass through the value
      }
    ];
    var bundle = await startTransfer(flash.addresses[item].address, transfers);
    return {
      bundle,
      addressIndex: flash.addresses[item].index
    };
  });
  // Wait until all concurrent promises are returned
  return await Promise.all(bundleProms);
};

export const signMultipleBundles = async (bundles, seed) => {
  console.log("Signing Bundles: ", bundles);
  // Setup an array of promises to sign bundles
  var bundleProms = bundles.map(async object => {
    return {
      bundle: await signBundle(object, seed),
      addressIndex: object.addressIndex
    };
  });
  // Wait until all concurrent promises are returned
  return await Promise.all(bundleProms);
};

////// HELPERS /////////////////////////////////////////////////////////////////
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

//
const startTransfer = (inputAddress, transfers) => {
  var p = new Promise((res, rej) => {
    iota.multisig.initiateTransfer(4, inputAddress, null, transfers, function(
      error,
      success
    ) {
      if (error) {
        console.error(error);
      } else {
        res(success);
      }
    });
  });
  return p;
};

// Add the user's key to the bundle
const signBundle = (object, seed) => {
  var p = new Promise((res, rej) => {
    iota.multisig.addSignature(
      object.bundle,
      object.bundle[1].address,
      iota.multisig.getKey(seed, object.bundle[1].index, 4),
      function(error, success) {
        if (error) {
          console.error(error);
        } else {
          res(success);
        }
      }
    );
  });
  return p;
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

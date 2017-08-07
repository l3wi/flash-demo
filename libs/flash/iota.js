import Api from "./api";
import { iota } from "../iota-node"

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

export const buildBundles = (flash, transfers) => {
  console.log(flash);
  /// Check to see if its the runs run?
  if (!flash.reqBundles) {
    // if so loop the length (minus the last one) of the tree and build bundles
    var bundles = [];
    Array(flash.depth - 1).fill().map(async (_, i) => {
      // Build a bundle with the whole value & point down the tree
      var transfers = [
        {
          address: flash.addresses[i + 1].address,
          value: 10
        }
      ];
      bundles.push(await startTransfer(flash.addresses[i].address, transfers));
    });
    return bundles;
  }

  // for (var i in flash.reqBundles) {
  //   console.log(flash.addresses[flash.reqBundles[i]]);
  //   // startTransfer(flash.addresses[flash.reqBundles[i]], transfers);
  // }
};

// export const signBundle = (bundle, )

////// HELPERS
// Start new addresses
const initiateAddress = (seed, index) => {
  // Create new digest
  var digest = iota.multisig.getDigest(seed, index + 1, 2);
  // Add your digest to the trytes
  return iota.multisig.addAddressDigest(digest);
};

const getBalance = async (address) => {
  // TODO: implement for verification stuff
}

const finishAddress = (seed, index, curlTrytes) => {
  // Create new digest
  var digest = iota.multisig.getDigest(seed, index + 1, 2);
  // Add your digest to the trytes
  var finalTrytes = iota.multisig.addAddressDigest(digest, curlTrytes);
  // Squeeze out address
  return iota.multisig.finalizeAddress(finalTrytes);
};

const startTransfer = (inputAddress, transfers) => {
  var p = new Promise((res, rej) => {
    iota.multisig.initiateTransfer(4, inputAddress, null, transfers, function(
      error,
      success
    ) {
      if (error) {
        console.error(error);
      } else {
        console.log(success);
        res(success);
      }
    });
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

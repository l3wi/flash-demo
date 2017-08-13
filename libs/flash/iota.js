import Api from "./api";
import { iota } from "../iota-node";

//////////////////////////////////////
///// All functions are in pairs /////
console.log(iota);
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
export const buildMultipleBundles = async (flash, testFlag) => {
  const addy = `IIIMXMCGPOOUAS9YTBGAPNVEUWHEDSYIAEYXUEHPHFFVPUWKJQYSPGUSGIFZYWKFXRAQMWNOZOJJFHWXBMEXTPLKNX`;
  const testAddress = addy.substring(0, addy.length - 9)
  // Generate an array of promises to be to generate specific bundles
  /// Check to see if its the first run?
  if(!flash.reqBundles) {
    flash.reqBundles = Array(flash.depth).fill()
  }
  var bundleProms = flash.reqBundles.map(async (item, i) => {
    var transfers = [];
    if(i < flash.depth - 1) {
      transfers.push({
        address: flash.addresses[i + 1].address,
        value: (flash.depositAmount * 2)
      })
    }
    else {
      transfers.push({
        address: flash.poolAddress,
        value: Object.values(flash.stake).reduce((sum, value) => sum + value, 0)
      })
      if(flash.total.master > 0) {
        transfers.push({
          address: flash.settlementAddress.master,
          value: flash.total.master
        })
      }
      if(flash.total.slave > 0) {
        transfers.push({
          address: flash.settlementAddress.slave,
          value: flash.total.slave
        })
      }
      console.log('transfers', transfers);
    }
      // transfers.push({
      //   address: flash.settlementAddress.slave, // Pass to slave addresses
      //   value: value.slave // Set the amount send to slave
      // });
    var bundle = await startTransfer(
      flash,
      testFlag ? testAddress : flash.addresses[i].address,
      transfers,
      flash.poolAddress
    );
    return {
      bundle,
      addressIndex: flash.addresses[i].index,
      depth: i
    };
  });
  // Wait until all concurrent promises are returned
  return await Promise.all(bundleProms);
};

export const buildFinalBundles = async (flash, testFlag) => {
  const addy = `IIIMXMCGPOOUAS9YTBGAPNVEUWHEDSYIAEYXUEHPHFFVPUWKJQYSPGUSGIFZYWKFXRAQMWNOZOJJFHWXBMEXTPLKNX`;
  const testAddress = addy.substring(0, addy.length - 9);
  for(var key of Object.keys(flash.stake)) {
    flash.total[key] += flash.stake[key]
    flash.stake[key] = 0
  }
  var value = flash.total
  var bundleProms = flash.reqBundles.map(async (item, i) => {
    var transfers = [];
    // Make up the transfer for parent nodes
    console.log(item);
    console.log(flash.reqBundles.length - 1);
    console.log(item !== flash.reqBundles.length - 1);
    if (i === flash.reqBundles.length - 1) {
      // Build transfer object for the Root Bundle
      transfers.push({
        address: flash.settlementAddress.master, // Pass to master addresses
        value: value.master // Set the amount send to master
      });
      transfers.push({
        address: flash.settlementAddress.slave, // Pass to slave addresses
        value: value.slave // Set the amount send to slave
      });
    } else {
      transfers.push({
        address: flash.addresses[item + 1].address, // Pass balance to child address
        value: value.master + value.slave // Pass full value down tree
      });
    }
    var bundle = await startTransfer(
      flash,
      testFlag ? testAddress : flash.addresses[i].address,
      transfers,
      flash.poolAddress
    );
    return {
      bundle,
      addressIndex: flash.addresses[item].index,
      depth: item
    };
  });
  // Wait until all concurrent promises are returned
  return await Promise.all(bundleProms);
};

export const signMultipleBundles = async (flash, bundles, seed, offset) => {
  // Setup an array of promises to sign bundles
  console.log('signMultipleBundles > bundles', bundles);
  var bundleProms = bundles.map(async (object, index) => {
    var bundleInputAddress
    for(var i in object.bundle) {
      if(object.bundle[i].value < 0) {
        for(var addressObj of flash.addresses) {
          console.log('signMultipleBundles', addressObj.address, object.bundle[i].address);
          if(addressObj.address === object.bundle[i].address) {
            bundleInputAddress = addressObj
            console.log("signMultipleBundles > bundleInputAddress: " + bundleInputAddress, addressObj)
            break
          }
        }
        break
      }
    }
    return {
      bundle: await signBundle(bundleInputAddress, object, seed),
      ...object
    };
  });
  // Wait until all concurrent promises are returned
  return await Promise.all(bundleProms);
};

////// HELPERS //////////////////
// Start new addresses
export const initiateAddress = (seed, index) => {
  // Create new digest
  return iota.multisig.getDigest(seed, index, 2);
};

// Multisig address class
var Address = iota.multisig.address;
export const finishAddress = (seed, index, digest) => {
  // Create new digest
  var digest2 = iota.multisig.getDigest(seed, index, 2)
  var finalAddress = new Address()
    // Absorb the first cosigners key digest
    .absorb(digest)
    // Absorb the second cosigners key digest
    .absorb(digest2)
    //and finally we finalize the address itself
    .finalize()

  console.log('finishAddress', `finalAddress: ${finalAddress}`, iota.multisig.validateAddress(finalAddress, [digest, digest2]))
  return finalAddress
};

const startTransfer = (flash, inputAddress, transfers, poolAddress) => {
  console.log("Remainder Addy: ", poolAddress);
  var p = new Promise((res, rej) => {
    var input = {
      address: inputAddress,
      securitySum: 4,
      balance: (flash.depositAmount * Object.keys(flash.stake).length)
    }
    iota.multisig.initiateTransfer(
      input,
      poolAddress,
      transfers,
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

// Add the user's key to the bundle
const signBundle = (multisig, object, seed) => {
  console.log(object.bundle)
  console.log(iota.multisig.getKey(seed, multisig.index, 2))
  var p = new Promise((res, rej) => {
    iota.multisig.addSignature(
      object.bundle,
      multisig.address,
      iota.multisig.getKey(seed, multisig.index, 2),
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

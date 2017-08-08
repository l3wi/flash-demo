import WebRTC from "./webrtc";

import { calculateDepth, initialFlash, walkTree } from "./flash";
import {
  seedGen,
  startAddresses,
  closeAddresses,
  startSingleAddress,
  closeSingleAddress,
  buildMultipleBundles,
  signMultipleBundles
} from "./iota";

////////////////////
//// Global (keep in memory)
export const webRTC = new WebRTC();

////////////////////////////////////
// FLASH FACTORY FOR THE FIRST USER
class Master {
  // Handle the different contents of messages
  static handleMessage = message => {};

  // Start the channel off
  static initalize = (seed, number, depositAmount, settlementAddress) => {
    // Prompt user for Depth.
    const depth = calculateDepth(number);
    // Then generate flash object.
    var flash = initialFlash(depth);
    // Then generate the left of the tree's addresses.
    flash.addresses = startAddresses(seed, flash.addressIndex, depth);
    flash.depositAmount = depositAmount;
    flash.total = { master: 0, slave: 0 };
    flash.stake = { master: 0, slave: 0 };
    flash.settlementAddress = {
      master: settlementAddress
    };
    return flash;
  };

  // Check to see what addresses need to be generated and starts signing
  static newAddress = (seed, flash) => {
    var { counter, reqBundles, reqAddresses } = walkTree(flash);
    console.log("Need these bundles: ", reqBundles);
    console.log("Need these Addresses: ", reqAddresses);

    var { addresses, addressIndex } = startSingleAddress(
      seed,
      flash.addressIndex,
      reqAddresses,
      flash.addresses
    );
    return {
      ...flash,
      addresses,
      addressIndex,
      reqBundles,
      reqAddresses,
      counter
    };
  };

  static newTransaction = async (flash, value, seed) => {
    var bundles = await buildMultipleBundles(flash, value);
    return {
      ...flash,
      partialBundles: await signMultipleBundles(bundles, seed)
    };
  };
}

////////////////////////////////////
// FLASH FACTORY FOR THE SECOND USER
class Slave {
  // Handle the different contents of messages
  static handleMessage = message => {};

  // Finish setup of multisig wallet form Player 1
  static initalize = (seed, flash, settlementAddress) => {
    // Take flash object, and sign the other half of the addresses.
    flash.addresses = closeAddresses(seed, flash.addresses);
    flash.addressIndex = flash.depth;
    flash.settlementAddress.slave = settlementAddress;
    return flash;
  };
  //Finish up the signing of a new address
  static closeAddress = (seed, flash) => {
    var addresses = closeSingleAddress(
      seed,
      flash.reqAddresses,
      flash.addresses
    );
    return { ...flash, addresses };
  };

  static closeTransaction = async (flash, seed) => {
    // Sign the rest of the bundles
    var newBundles = await signMultipleBundles(flash.partialBundles, seed);
    var bundles = [...flash.bundles];
    // Strip out the index and only return the bundle
    newBundles.map(item => (bundles[item.depth] = item.bundle));
    return {
      ...flash,
      bundles
    };
  };
}

export default class Flash {
  static master = Master;
  static slave = Slave;
}

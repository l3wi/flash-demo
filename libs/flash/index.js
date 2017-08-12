import WebRTC from "./webrtc";

import { calculateDepth, initialFlash, walkTree, highestBundle } from "./flash";
import {
  seedGen,
  startAddresses,
  closeAddresses,
  startSingleAddress,
  closeSingleAddress,
  buildMultipleBundles,
  signMultipleBundles,
  buildFinalBundles,
  initiateAddress,
  finishAddress
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
    // Calculate depth.
    const depth = calculateDepth(number);
    // Then generate flash object.
    var flash = initialFlash(depth);

    // Generate Pool Addresss Digest
    flash.poolAddress = initiateAddress(seed, flash.addressIndex);
    flash.addressIndex = 1;
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

  static newTransaction = async (flash, seed) => {

    var bundles = await buildMultipleBundles(flash, false)

    var offset = flash.addresses.length - bundles.length

    return {
      ...flash,
      partialBundles: await signMultipleBundles(flash, bundles, seed, offset)
    };
  };

  static closeChannel = async (flash, seed) => {
    // Figure out many available tokens are around to share.
    const remainder = (flash.stake.master + flash.stake.slave) / 2;
    // Make a totals bundle
    ////////////////////////
    // Need to add logic here that halves the remainder and adds it
    // to the users balance.
    const updatedFlash = { ...flash, reqBundles: highestBundle(flash.counter) };

    var bundles = await buildFinalBundles(updatedFlash, false)
    var offset = flash.addresses.length - flash.bundles.length

    return {
      ...updatedFlash,
      partialBundles: await signMultipleBundles(flash, bundles, seed, offset)
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
    // Finish off pool address and set index
    flash.poolAddress = finishAddress(seed, 0, flash.poolAddress);

    // Take flash object, and sign the other half of the addresses. Also advance the index
    flash.addresses = closeAddresses(seed, flash.addresses);
    flash.addressIndex = flash.addressIndex + flash.depth;

    // Add second user's settlement address
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
    var offset = flash.addresses.length - flash.partialBundles.length
    console.log(offset)
    // Sign the rest of the bundles
    var newBundles = await signMultipleBundles(flash, flash.partialBundles, seed, offset);
    var bundles = [...flash.bundles];
    // Strip out the index and only return the bundle
    newBundles.map(item => (bundles[item.depth] = item.bundle));
    return {
      ...flash,
      bundles
    };
  };

  static closeFinalBundle = async (flash, seed) => {
    var newBundles = await signMultipleBundles(flash, flash.partialBundles, seed, 0)
    return {
      ...flash,
      finalBundles: Object.assign([], newBundles.map(item => item.bundle))
    };
  };
}

export default class Flash {
  static master = Master;
  static slave = Slave;
}

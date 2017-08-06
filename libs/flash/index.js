import WebRTC from "./webrtc";

import { calculateDepth, initialFlash, walkTree } from "./flash";
import {
  seedGen,
  startAddresses,
  closeAddresses,
  startSingleAddress,
  closeSingleAddress
} from "./iota";

////////////////////
//// Global (keep in memory)
export const webRTC = new WebRTC();

////////////////////////////////////
// FLASH FACTORY FOR THE FIRST USER
class Master {
  // Handle the different contents of messages
  static handleMessage = message => {};

  static initalize = (seed, number) => {
    // Prompt user for Depth.
    const depth = calculateDepth(number);
    // Then generate flash object.
    var flash = initialFlash(depth);
    // Then generate the left of the tree's addresses.
    flash.addresses = startAddresses(seed, flash.addressIndex, depth);
    return flash;
  };

  static startTransfer = (seed, flash) => {
    var { counter, reqBundles } = walkTree(flash.counter);
    console.log(reqBundles.length);

    var { addresses, addressIndex } = startSingleAddress(
      seed,
      flash.addressIndex,
      reqBundles,
      flash.addresses
    );
    return { ...flash, addresses, addressIndex, reqBundles, counter };
  };
}

////////////////////////////////////
// FLASH FACTORY FOR THE SECOND USER
class Slave {
  // Handle the different contents of messages
  static handleMessage = message => {};

  // Setup multisig wallet from depth
  static startup = (seed, flash) => {
    // Take flash object, and sign the other half of the addresses.
    flash.addresses = closeAddresses(seed, flash.addresses);
    flash.addressIndex = flash.depth;
    return flash;
  };

  static closeTransfer = (seed, flash, reqBundles) => {
    var addresses = closeSingleAddress(seed, reqBundles, flash.addresses);
    return { ...flash, addresses };
  };
}

class Flash {
  static master = Master;
  static slave = Slave;
}

export default Flash;

////////////////////
//// HELPERS

// Calculate Depth from a number of transactions
export const calculateDepth = num => {
  return Math.ceil(Math.log(num) / Math.log(3));
};

// Generate an empty flash object
export const initialFlash = depth => {
  var counter = [];
  var addresses = [];
  var bundles = [];
  // Add the correct amount of counters and arrays
  for (var i of Array(depth).keys()) {
    counter[i] = 0;
    addresses[i] = false;
    bundles[i] = false;
  }
  return {
    depth: depth,
    addressIndex: 0,
    bundles,
    counter,
    addresses
  };
};

// This recurisvly walks the tree from the tip and update values
export const walkTree = flash => {
  // New Obj
  var arr = Object.assign([], flash.counter);

  // ADD FLAGS TO INDICATE NEW BUNDLES TO BE GENERATED
  var requiredBundles = [];
  var requiredAddresses = [];

  // Gets all required items on startup minus the leaf transaction
  if (!flash.addresses[0]) {
    Array(flash.counter.length - 1).fill().map((_, i) => {
      requiredBundles.push(i);
      requiredAddresses.push(flash.counter.length - 1);
    });
  }

  // Set a counter for the loop
  var index = flash.counter.length - 1;
  // Flag to kill the loop when done
  var again = true;
  // While loop.... lol
  while (again) {
    // Check to see if we need another loop and to reset this level counter
    if (flash.counter[index] === 2) {
      // Mark the addresses that need to be generated
      requiredAddresses.push(index);
      // Mark the bundles that need to be generated
      requiredBundles.push(index);

      // Set the counter to 0
      arr[index] = 0;
      // Move the index up a level
      index--;
    } else {
      // Mark the bundles that need to be generated
      requiredAddresses.push(index);
      // Also get parent to change to new child
      requiredBundles.push(index);
      if (index !== 0) requiredBundles.push(index - 1); // Escape the root of the tree
      // Increase counter
      arr[index]++;
      // Break loop
      again = false;
    }
  }
  console.log(requiredBundles);

  return {
    counter: arr,
    reqBundles: requiredBundles,
    reqAddresses: requiredAddresses
  };
};

// Get the highest useable bundle by looking down the counter
export const highestBundle = counter => {
  var requiredBundles = [];

  for (var index in counter) {
    requiredBundles.push(index);
    // When you get to an address that hasn't been used three times
    if (counter[index] !== 2) return requiredBundles;
  }
  return Error(`You're at the end of the bundle`);
};

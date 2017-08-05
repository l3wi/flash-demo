import IOTA from "iota.lib.js";
import Api from "./api";
// Create IOTA instance directly with provider
var iota = new IOTA({
  provider: "https://node.tangle.works"
});

export const info = () => {
  iota.api.getNodeInfo(function(error, success) {
    if (error) {
      console.error(error);
    } else {
      console.log(success);
    }
  });
};

export const initialise = () => {
  // Escape the function when server rendering
  if (!isWindow()) return;
  // Grab seed from local
  var user = get("user");
  // No seed? Then go make one!
  if (user === null) {
    console.log("No User");
    user = Iota.setupUser();
  }
  console.log(user);
};

export const setupUser = async () => {
  // Make a user zero state
  var user = { seed: seedGen(81), index: 0, addresses: [], purchases: [] };
  // Push the first address to the array
  // user.addresses.push(await getAddress(user));
  // Save the new user obj
  set("user", user);
  console.log(user);
  return user;
};

// Initiate transaction from anywhere in the app.
export const purchaseItem = async item => {
  // Get latest user object
  var user = await get("user");
  // Create new multisig address
  const address = getAddress(user);

  // Build a transfer obj.
  const transfers = [
    {
      address,
      value: item.price,
      tag: item.id
    }
  ];

  // Generate partially signed budle
  var partialBundle = iota.multisig.initiateTransfer(
    4,
    address,
    address,
    transfers,
    callback // Does this need promises?
  );

  // Post the bundle to the server and wait for a response
  const response = await Api("https://server.com/purchase", {
    method: "POST",
    body: JSON.stringify({ bundle: partialBundle })
  });

  // Handle error below
  // ???????

  // Update the react component which initiated the purchase
};

////// HELPERS

// Get a new Address
export const getAddress = async user => {
  // Create new digest
  var digest = iota.multisig.getDigest(user.seed, user.index + 1, 2);
  // Send digest to server
  const response = await Api("https://server.com/new-address", {
    method: "POST",
    body: JSON.stringify({ object: "goes here" })
  });
  // Check to see if response is valid
  if (typeof response.address !== "string")
    return alert(":( something went wrong");
  // Save new address from the server
  user.addresses.push(response.address);
  // Add 1 to the index
  user.index = user.index++;
  // Save user
  set("user", user);

  console.log(response);
  // respond with the address
  return response.address;
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

// GET from localStorage
const get = item => {
  return JSON.parse(localStorage.getItem(item));
};

// SET item to localStorage
const set = (item, data) => {
  localStorage.setItem(item, JSON.stringify(data));
};

// Check if window is available
const isWindow = () => {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    global.localStorage = {};
    return false;
  }
  return true;
};

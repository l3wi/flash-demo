////////////////////
//// HELPERS

// Calculate Depth from a number of transactions
export const calculateDepth = num => {
  return Math.ceil(Math.log(num) / Math.log(3));
};

// Generate an empty flash object
export const initialFlash = depth => {
  return {
    depth: depth
  };
};

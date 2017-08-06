export const isClient = typeof window !== 'undefined' && window.document && window.document.createElement

// GET from localStorage
export const get = item => {
  return JSON.parse(localStorage.getItem(item));
};

// SET item to localStorage
export const set = (item, data) => {
  localStorage.setItem(item, JSON.stringify(data));
};

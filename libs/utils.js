export const isClient =
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement

export const isGL = () => {
  if (isClient) {
    var canvas = document.createElement("canvas")
    // Get WebGLRenderingContext from canvas element.
    var gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    // Report the result.
    if (gl && gl instanceof WebGLRenderingContext) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

// GET from localStorage
export const get = item => {
  return JSON.parse(localStorage.getItem(item))
}

// SET item to localStorage
export const set = (item, data) => {
  localStorage.setItem(item, JSON.stringify(data))
}
export const seedGen = length => {
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9876543210qwertyuiopasdfghjklzxcvbnm"
  var i
  var result = ""
  if (window.crypto && window.crypto.getRandomValues) {
    var values = new Uint32Array(length)
    window.crypto.getRandomValues(values)
    for (i = 0; i < length; i++) {
      result += charset[values[i] % charset.length]
    }
    return result
  } else
    throw new Error(
      "Your browser is outdated and can't generate secure random numbers"
    )
}

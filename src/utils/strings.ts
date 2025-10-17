export function isString(obj: any): obj is string {
  return Object.prototype.toString.call(obj) == '[object String]'
}

export function parseJSON(str: any): any {
  try {
    if (!str || !str.trim) {
      return
    }

    // Try to convert the "from" string to an object if it's a proper JSON
    if (isString(str)) {
      return JSON.parse(str)
    }
  } catch (err) {}
}

export default {
  isString,
  parseJSON,
}

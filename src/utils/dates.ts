export const isValidDate = (v: any): boolean => {
  if (v == undefined || (v == '' && v != 0)) return false
  const date = new Date(v)
  return date.toString() !== 'Invalid Date' && !isNaN(date.getTime()) ? true : false
}

export function isDate(obj: any): obj is Date {
  return Object.prototype.toString.call(obj) == '[object Date]' && !isNaN(obj.getTime())
}

export default {
  isValidDate,
  isDate,
}

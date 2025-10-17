import { DbObjectId } from '../types'

const VALID_OBJECT_ID_REGEX = new RegExp('^[0-9a-fA-F]{24}$')

export function isValidId(objectId: any): boolean {
  if (!objectId) return false
  return VALID_OBJECT_ID_REGEX.test(objectId)
}

export function areEqual(objectId1: any, objectId2: any): boolean {
  return isValidId(objectId1) && objectId1 + '' == objectId2 + ''
}

export const isValidOptionalId = function(id: any): boolean {
  return !id || isValidId(id)
}

export const areEqualIds = areEqual

export const dedubeIds = (ids: any[]): DbObjectId[] => {
  return Array.from(new Set(ids.map((id) => `${id}`))) as DbObjectId[]
}

export default {
  isValid: isValidId,
  isValidId,
  isValidOptionalId,
  areEqual,
  areEqualIds,
  VALID_OBJECT_ID_REGEX,
}

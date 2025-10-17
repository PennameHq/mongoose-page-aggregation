import mongoose from 'mongoose'

/**
 * Converts a string to an mongodb ObjectId
 */
export const toObjectId = (id: string | mongoose.Types.ObjectId) => {
  return new mongoose.Types.ObjectId(id)
}

export default { toObjectId }

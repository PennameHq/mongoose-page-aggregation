import { Model } from 'mongoose'

export const getModelCollectionName = (model: Model<any>) => {
  return model.collection?.collectionName
}

export default {
  getModelCollectionName,
}

import mongoose from 'mongoose'

export type DbObjectId = string | mongoose.Types.ObjectId

export enum DbPagerSortOrder {
  Ascending = 1,
  Descending = -1,
}

export type DbObject<T = any> = T & {
  [key: string]: any
  _id: DbObjectId
  createdAt?: Date
  updatedAt?: Date
}

export interface DbPagerOpts {
  [key: string]: any
  limit?: number
  from?: { [key: string]: any }
  skipCache?: boolean
}

export type DbFindQuery<D = Record<string, any>> = {
  [key: string]: any
} & D

export type IsoDate = string
export type Timestamp = number

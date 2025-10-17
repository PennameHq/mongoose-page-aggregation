import mongoose from "mongoose";
import { DbObject, DbPagerSortOrder, IsoDate } from "./types";

export interface PageAggregationConfig {
  Model: mongoose.Model<any>;
  findQuery: { [key: string]: any };
  pager: {
    field: string;
    groupBy?: {
      fields: string[];
      sortBefore?: true;
      projectFields?: string[];
      // The field to name the count of records in the group
      countAs?: string;
      /// This only works for fields that hold numbers
      fieldSumMap?: Record<string, string>;
    };
    sortAsc?: boolean;
    sortOrder?: DbPagerSortOrder;
    from?: { [key: string]: any };
    limit?: number | string;
  };
  shouldSecordarySortOnId?: boolean;
  populators?: ({
    Model: mongoose.Model<any>;
    localField: string;
    targetField?: string;
    as?: string;
  } & (
    | {
        shouldReplaceRoot: true;
        retainedFieldMap?: Record<string, string | true>;
      }
    | { shouldReplaceRoot?: never }
  ))[];
  postPopulatorFilter?: { [key: string]: any };
  skipCache?: boolean;
  runQuery?: <T = any>(query: { q: any; skipCache?: boolean }) => Promise<T>;
}

export interface PageAggregationResult<D extends DbObject = DbObject> {
  dbObjects: (D & { _retained?: Record<string, any> })[];
  from: { [key: string]: any } | null;
  total: number;
  canLoadMore: boolean;
  sortOrder: DbPagerSortOrder;
  size: number;
  limit: number;
  startedAt: IsoDate;
  finishedAt: IsoDate;
}

import { PipelineStage } from "mongoose";
import { isValidDate } from "./utils/dates";
import { compute } from "./utils/compute";
import strings from "./utils/strings";
import { getModelCollectionName } from "./utils/dbQuery";
import { isValidId } from "./utils/objectIds";
import { toObjectId } from "./utils/mongo";
import {
  PageAggregationConfig,
  PageAggregationResult,
} from "./pageAggregationTypes";
import { DbObject, DbPagerSortOrder } from "./types";

/**
 *
 * NOTE(lincoln): If there is a non-zero total but dbObjects.length is 0,
 * you probably forgot to call {@link toObjectId()} on any IDs in your {@link findQuery}
 */
export const pageAggregation = async <D extends DbObject = DbObject>({
  findQuery,
  pager,
  shouldSecordarySortOnId,
  Model,
  populators,
  postPopulatorFilter,
  skipCache,
  runQuery,
}: PageAggregationConfig): Promise<PageAggregationResult<D>> => {
  const startedAt = new Date().toISOString();
  if (!runQuery) {
    runQuery = async ({ q }) => {
      if (q.exec) {
        return q.exec();
      }

      return q;
    };
  }

  _castIds(findQuery);

  const defaultLimit = 10;
  const limit =
    compute(() => {
      if (!pager.limit) {
        return 0;
      }

      try {
        return parseInt(`${pager.limit}`);
      } catch (err) {
        return defaultLimit;
      }
    }) || defaultLimit;

  const sortOrder = _getSortOder({
    sortOrder: pager.sortOrder,
    sortAsc: pager.sortAsc,
  });
  const sortQuery = _genSortQuery({
    field: pager.field,
    sortOrder,
    shouldSecordarySortOnId,
  });

  const result: PageAggregationResult<D> = {
    startedAt,
    finishedAt: "",
    dbObjects: [],
    from: null as { [key: string]: any } | null,
    total: 0,
    size: 0,
    limit,
    canLoadMore: false,
    sortOrder,
  };

  const promises: Promise<any>[] = [];

  if (pager.from) {
    const from = compute(() => {
      try {
        return strings.parseJSON(pager.from) || pager.from;
      } catch (err) {
        return pager.from;
      }
    })[pager.field];

    findQuery[pager.field] = {
      $lt: compute(() => {
        if (isValidId(from)) {
          return toObjectId(from);
        }

        if (isValidDate(from)) {
          return new Date(from);
        }

        return from;
      }),
    };
  } else {
    // Instead of using cache, directly count documents
    promises.push(
      runQuery({
        q: Model.countDocuments(findQuery),
        skipCache,
      }).then((total: number) => {
        result.total = total;
      })
    );
  }

  const populatorStages: PipelineStage[] = [];

  const projection = { [pager.field]: 1 };

  const populatorCache = {
    pagerField: null as string | null,
    willReplaceRoot: false,
  };

  populators?.forEach((populator) => {
    const collectionName = getModelCollectionName(populator.Model);
    const as = populator.as || collectionName;

    const localField = populator.localField;
    projection[localField] = 1;

    const foreignField = populator.targetField || "_id";

    populatorStages.push({
      $lookup: {
        from: collectionName,
        localField,
        foreignField,
        as,
      },
    });

    if (populator.shouldReplaceRoot) {
      populatorCache.willReplaceRoot = true;
      populatorCache.pagerField = `_${pager.field}_${Date.now()}`;

      const fieldKey = `_${localField}_${Date.now()}`;

      const retainFieldsStage: Record<string, any> = {
        [`${as}.${fieldKey}`]: `$${localField}`,
        [`${as}.${populatorCache.pagerField}`]: `$${pager.field}`,
      };

      if (populator.retainedFieldMap) {
        Object.entries(populator.retainedFieldMap).forEach(
          ([incomingField, value]) => {
            const outgoingField = value !== true ? value : incomingField;
            retainFieldsStage[`${as}.${outgoingField}`] = `$${incomingField}`;
          }
        );
      }

      populatorStages.push({
        $set: retainFieldsStage,
      });

      populatorStages.push({
        $match: {
          [`${as}.0`]: {
            $exists: true,
          },
        },
      });

      populatorStages.push({
        $replaceRoot: {
          newRoot: {
            $first: `$${as}`,
          },
        },
      });

      populatorStages.push({
        $match: {
          $expr: { $eq: [`$${foreignField}`, `$${fieldKey}`] },
        },
      });
    }
  });

  const aggregationPipeline: PipelineStage[] = [{ $match: findQuery }];

  if (populatorCache.willReplaceRoot) {
    // We only want to minimize the projection
    // if the objects will be replaced by a populator
    aggregationPipeline.push({
      $project: projection,
    });
  }

  if (pager.groupBy) {
    const projectionFields: string[] = [pager.field];

    const {
      groupBy: { fields, projectFields, fieldSumMap, countAs, sortBefore },
    } = pager;

    if (sortBefore) {
      const preGroupSortStage = sortQuery;
      aggregationPipeline.push({ $sort: preGroupSortStage });
    }

    const groupByFields = fields.filter((field) => field !== "_id");

    const firstField = groupByFields[0];

    const isCompositeId = groupByFields.length > 1;
    const groupIdQuery = isCompositeId
      ? groupByFields.reduce((map: Record<string, any>, field) => {
          map[field] = `$${field}`;
          return map;
        }, {})
      : `$${firstField}`;

    const groupStage: Record<string, any> = {
      _id: groupIdQuery,
    };

    projectionFields.push(...groupByFields);
    projectionFields.push(...(projectFields || []));

    projectionFields.forEach((field) => {
      groupStage[field] = { [pager.sortAsc ? "$last" : "$first"]: `$${field}` };
    });

    // This only works for fields that hold numbers
    if (fieldSumMap) {
      Object.entries(fieldSumMap).forEach(([key, value]) => {
        groupStage[value] = { $sum: `$${key}` };
      });
    }

    if (countAs) {
      groupStage[countAs] = { $sum: 1 };
    }

    aggregationPipeline.push({
      $group: groupStage,
    });
  }

  // NOTES(lincoln):
  // 1. $group doesn't retain order, so $sort must come after
  aggregationPipeline.push({
    $sort: sortQuery,
  });

  aggregationPipeline.push({
    $limit: limit + 1,
  });

  aggregationPipeline.push(...populatorStages);
  if (postPopulatorFilter) {
    aggregationPipeline.push({ $match: postPopulatorFilter });
  }

  // == RUN THE AGGREGATION ==

  // Instead of using cache, directly run the aggregation
  result.dbObjects = await runQuery({
    q: Model.aggregate(aggregationPipeline),
    skipCache,
  });

  const numObjects = result.dbObjects.length;
  result.size = numObjects;
  result.canLoadMore = numObjects > limit;
  await Promise.allSettled(promises);

  if (numObjects) {
    const lastObject = result.dbObjects[numObjects - 1] as any as {
      [key: string]: any;
      _id: string;
    };

    const finalPagerField =
      populatorCache.willReplaceRoot && populatorCache.pagerField
        ? populatorCache.pagerField
        : pager.field;

    const nextBatchFromPrimaryValue: string | number =
      lastObject[finalPagerField];

    result.from = { [pager.field]: nextBatchFromPrimaryValue };

    if (shouldSecordarySortOnId) {
      result.from._id = lastObject._id;
    }
  }

  result.finishedAt = new Date().toISOString();

  return result;
};

const _genSortQuery = ({
  field,
  sortOrder,
  shouldSecordarySortOnId,
}: {
  field: string;
  sortOrder: DbPagerSortOrder;
  shouldSecordarySortOnId?: boolean;
}) => {
  const sortQuery: { [key: string]: DbPagerSortOrder } = {
    [field]: sortOrder,
  };

  if (shouldSecordarySortOnId) {
    sortQuery["_id"] = sortOrder;
  }

  return sortQuery;
};

const _getSortOder = ({
  sortOrder: providedSortOrder,
  sortAsc,
}: {
  sortOrder?: DbPagerSortOrder;
  sortAsc?: boolean;
}): DbPagerSortOrder => {
  if (providedSortOrder === 1 || providedSortOrder === -1) {
    return providedSortOrder;
  }

  if (sortAsc) {
    // order from least to greatest
    return 1;
  }

  // order from greatest to least
  return -1;
};

const _castIds = (findQuery: Record<string, any>) => {
  // Cast any ID fields in findQuery to ObjectId
  Object.entries(findQuery).forEach(([key, value]) => {
    if (!key.endsWith("Id")) {
      return;
    }

    if (!Array.isArray(value)) {
      if (isValidId(value)) {
        findQuery[key] = toObjectId(value);
      }
      return;
    }

    findQuery[key] = value.map((id) => {
      if (isValidId(id)) {
        return toObjectId(id);
      }

      return id;
    });
  });
};

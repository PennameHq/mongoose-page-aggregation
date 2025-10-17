# @pennameapi/page-aggregation

A standalone MongoDB pagination utility with aggregation support, extracted from PennameAPI.

## Features

- **Efficient Pagination**: Cursor-based pagination for large datasets
- **MongoDB Aggregation**: Full support for MongoDB aggregation pipelines
- **Population Support**: Join collections with advanced population options
- **Grouping & Sorting**: Built-in support for grouping and custom sorting
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies**: Only requires Mongoose as a peer dependency

## Installation

```bash
npm install @pennameapi/page-aggregation
```

**Peer Dependencies:**
- `mongoose >= 8.7.0`

## Usage

### Basic Pagination

```typescript
import { pageAggregation, PageAggregationConfig } from '@pennameapi/page-aggregation'
import { UserModel } from './models/User'

const config: PageAggregationConfig = {
  Model: UserModel,
  findQuery: { active: true },
  pager: {
    field: 'createdAt',
    limit: 20,
    sortAsc: false
  }
}

const result = await pageAggregation(config)
console.log(result.dbObjects) // Array of user documents
console.log(result.canLoadMore) // Boolean indicating if more pages exist
console.log(result.from) // Cursor for next page
```

### Pagination with Cursor

```typescript
// Load next page using cursor from previous result
const nextPageConfig: PageAggregationConfig = {
  Model: UserModel,
  findQuery: { active: true },
  pager: {
    field: 'createdAt',
    limit: 20,
    sortAsc: false,
    from: result.from // Use cursor from previous page
  }
}

const nextPage = await pageAggregation(nextPageConfig)
```

### Population (Joins)

```typescript
const config: PageAggregationConfig = {
  Model: PostModel,
  findQuery: { published: true },
  pager: {
    field: 'createdAt',
    limit: 10
  },
  populators: [
    {
      Model: UserModel,
      localField: 'authorId',
      targetField: '_id',
      as: 'author'
    }
  ]
}

const result = await pageAggregation(config)
// Each post will have an 'author' field with populated user data
```

### Grouping

```typescript
const config: PageAggregationConfig = {
  Model: OrderModel,
  findQuery: { status: 'completed' },
  pager: {
    field: 'createdAt',
    limit: 50,
    groupBy: {
      fields: ['customerId'],
      countAs: 'orderCount',
      fieldSumMap: {
        'amount': 'totalAmount'
      }
    }
  }
}

const result = await pageAggregation(config)
// Results grouped by customerId with order count and total amount
```

## API Reference

### `pageAggregation<T>(config: PageAggregationConfig): Promise<PageAggregationResult<T>>`

Main pagination function.

#### PageAggregationConfig

```typescript
interface PageAggregationConfig {
  Model: mongoose.Model<any>
  findQuery: { [key: string]: any }
  pager: {
    field: string
    groupBy?: {
      fields: string[]
      sortBefore?: true
      projectFields?: string[]
      countAs?: string
      fieldSumMap?: Record<string, string>
    }
    sortAsc?: boolean
    sortOrder?: DbPagerSortOrder
    from?: { [key: string]: any }
    limit?: number | string
  }
  shouldSecordarySortOnId?: boolean
  populators?: PopulatorConfig[]
  postPopulatorFilter?: { [key: string]: any }
  skipCache?: boolean
}
```

#### PageAggregationResult

```typescript
interface PageAggregationResult<D extends DbObject = DbObject> {
  dbObjects: (D & { _retained?: Record<string, any> })[]
  from: { [key: string]: any } | null
  total: number
  canLoadMore: boolean
  sortOrder: DbPagerSortOrder
  size: number
  limit: number
  startedAt: IsoDate
  finishedAt: IsoDate
}
```

## Utility Functions

The package also exports useful utility functions:

- `isValidId(id)` - Check if a string is a valid MongoDB ObjectId
- `toObjectId(id)` - Convert string to MongoDB ObjectId
- `getModelCollectionName(model)` - Get collection name from Mongoose model
- `isValidDate(date)` - Check if a value is a valid date
- `compute(fn)` - Simple computation helper

## Migration from PennameAPI

If you're migrating from the original PennameAPI implementation:

1. **Caching Removed**: The `skipCache` parameter is still accepted but ignored. Implement your own caching layer if needed.
2. **Direct Database Calls**: All queries now go directly to MongoDB without caching middleware.
3. **Same API**: All other functionality remains identical.

## License

MIT

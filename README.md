# Mongoose Page Aggregation

A standalone MongoDB Mongoose pagination utility powered by aggregation pipelines. This library provides efficient cursor-based pagination for MongoDB queries using Mongoose.

[![npm version](https://img.shields.io/npm/v/@penname/mongoose-page-aggregation.svg)](https://www.npmjs.com/package/@penname/mongoose-page-aggregation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Cursor-based Pagination**: Efficient pagination using MongoDB aggregation pipelines
- **Flexible Sorting**: Support for ascending and descending sort orders
- **Custom Queries**: Filter documents with custom find queries
- **Population Support**: Populate related documents using Mongoose populators
- **Grouping**: Group results by specified fields with optional aggregations
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Lightweight**: Zero dependencies (Mongoose is a peer dependency)
- **ESM & CJS**: Supports both ES modules and CommonJS

## Installation

```bash
npm install @penname/mongoose-page-aggregation mongoose
```

Or with yarn:

```bash
yarn add @penname/mongoose-page-aggregation mongoose
```

## Requirements

- **Node.js**: 14.0.0 or higher
- **Mongoose**: 8.7.0 or higher

## Quick Start

```typescript
import mongoose from 'mongoose'
import { pageAggregation, DbPagerSortOrder } from '@penname/mongoose-page-aggregation'

// Define your schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
})

const User = mongoose.model('User', UserSchema)

// Basic pagination
async function getUsers() {
  const result = await pageAggregation({
    Model: User,
    findQuery: { active: true },
    pager: {
      field: 'createdAt',
      limit: 10,
      sortOrder: DbPagerSortOrder.Descending
    }
  })

  console.log('Users:', result.dbObjects)
  console.log('Total:', result.total)
  console.log('Can load more:', result.canLoadMore)
}
```

## API Reference

### `pageAggregation(config)`

Main function for paginated queries.

#### Parameters

**`config: PageAggregationConfig`**

- **`Model`** (required): Mongoose model to query
- **`findQuery`** (required): MongoDB query filter object
- **`pager`** (required): Pagination configuration
  - **`field`** (required): Field to paginate on (typically a date or ID)
  - **`limit`** (optional): Number of documents per page (default: 10)
  - **`sortOrder`** (optional): `DbPagerSortOrder.Ascending` or `DbPagerSortOrder.Descending`
  - **`sortAsc`** (optional): Boolean alternative to `sortOrder`
  - **`from`** (optional): Cursor object for fetching next page
  - **`groupBy`** (optional): Group results by specified fields
- **`shouldSecordarySortOnId`** (optional): Enable secondary sorting by `_id`
- **`populators`** (optional): Array of population configurations
- **`postPopulatorFilter`** (optional): Filter after population
- **`skipCache`** (optional): Skip caching for this query
- **`runQuery`** (optional): Custom query execution function

#### Returns

**`PageAggregationResult<D>`**

- **`dbObjects`**: Array of paginated documents
- **`total`**: Total count of matching documents
- **`size`**: Number of documents in current page
- **`limit`**: Limit used for pagination
- **`canLoadMore`**: Whether more documents are available
- **`from`**: Cursor object for next page
- **`sortOrder`**: Sort order used
- **`startedAt`**: ISO timestamp when query started
- **`finishedAt`**: ISO timestamp when query finished

## Examples

### Pagination with Cursor

```typescript
// First page
const firstPage = await pageAggregation({
  Model: User,
  findQuery: { active: true },
  pager: {
    field: 'createdAt',
    limit: 10,
    sortOrder: DbPagerSortOrder.Descending
  }
})

// Next page
if (firstPage.canLoadMore) {
  const nextPage = await pageAggregation({
    Model: User,
    findQuery: { active: true },
    pager: {
      field: 'createdAt',
      limit: 10,
      sortOrder: DbPagerSortOrder.Descending,
      from: firstPage.from
    }
  })
}
```

### Grouping Results

```typescript
const grouped = await pageAggregation({
  Model: User,
  findQuery: { active: true },
  pager: {
    field: 'createdAt',
    limit: 10,
    groupBy: {
      fields: ['department'],
      countAs: 'count'
    }
  }
})
```

### Population

```typescript
const withPosts = await pageAggregation({
  Model: User,
  findQuery: { active: true },
  pager: {
    field: 'createdAt',
    limit: 10
  },
  populators: [
    {
      Model: Post,
      localField: '_id',
      targetField: 'userId',
      as: 'posts'
    }
  ]
})
```

## Utility Functions

The library exports several utility functions:

- **`isValidId(id)`**: Check if a string is a valid MongoDB ObjectId
- **`toObjectId(id)`**: Convert a string to MongoDB ObjectId
- **`isValidDate(value)`**: Check if a value is a valid date
- **`getModelCollectionName(model)`**: Get collection name from Mongoose model
- **`compute(fn)`**: Execute a function and return its result

## License

MIT © 2025 PennameHq

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


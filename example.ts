import mongoose from 'mongoose'
import { pageAggregation, PageAggregationConfig, DbPagerSortOrder } from './src/index'

// Example Mongoose schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
})

const User = mongoose.model('User', UserSchema)

// Example usage
async function exampleUsage() {
  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/test')

  // Basic pagination
  const basicConfig: PageAggregationConfig = {
    Model: User,
    findQuery: { active: true },
    pager: {
      field: 'createdAt',
      limit: 10,
      sortOrder: DbPagerSortOrder.Descending
    }
  }

  const result = await pageAggregation(basicConfig)
  
  console.log('Found users:', result.dbObjects.length)
  console.log('Can load more:', result.canLoadMore)
  console.log('Total:', result.total)
  
  // Pagination with cursor
  if (result.canLoadMore) {
    const nextPageConfig: PageAggregationConfig = {
      ...basicConfig,
      pager: {
        ...basicConfig.pager,
        from: result.from
      }
    }
    
    const nextPage = await pageAggregation(nextPageConfig)
    console.log('Next page users:', nextPage.dbObjects.length)
  }

  await mongoose.disconnect()
}

// Run example (uncomment to test)
// exampleUsage().catch(console.error)

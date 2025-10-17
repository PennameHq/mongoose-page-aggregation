import { pageAggregation } from '../pageAggregation'
import { PageAggregationConfig } from '../pageAggregationTypes'
import mongoose from 'mongoose'

// Mock Mongoose Model
const mockModel = {
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
} as any

describe('pageAggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('runQuery parameter', () => {
    it('should call runQuery with correct parameters for countDocuments', async () => {
      const mockRunQuery = jest.fn()
        .mockResolvedValueOnce(5) // count result
        .mockResolvedValueOnce([]) // aggregation result

      mockModel.countDocuments.mockReturnValue({})
      mockModel.aggregate.mockReturnValue({})

      const config: PageAggregationConfig = {
        Model: mockModel,
        findQuery: { active: true },
        pager: {
          field: 'createdAt',
          limit: 10,
        },
        runQuery: mockRunQuery,
      }

      await pageAggregation(config)

      // Verify runQuery was called for countDocuments
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.any(Object),
          skipCache: undefined,
        })
      )
    })

    it('should call runQuery with correct parameters for aggregation', async () => {
      const mockRunQuery = jest.fn()
        .mockResolvedValueOnce(10) // count result
        .mockResolvedValueOnce([{ _id: '1', createdAt: new Date() }]) // aggregation result

      mockModel.countDocuments.mockReturnValue({})
      mockModel.aggregate.mockReturnValue({})

      const config: PageAggregationConfig = {
        Model: mockModel,
        findQuery: { active: true },
        pager: {
          field: 'createdAt',
          limit: 10,
        },
        runQuery: mockRunQuery,
      }

      await pageAggregation(config)

      // Verify runQuery was called for aggregation
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          q: expect.any(Object),
          skipCache: undefined,
        })
      )
    })

    it('should pass skipCache parameter to runQuery', async () => {
      const mockRunQuery = jest.fn()
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce([])

      mockModel.countDocuments.mockReturnValue({})
      mockModel.aggregate.mockReturnValue({})

      const config: PageAggregationConfig = {
        Model: mockModel,
        findQuery: { active: true },
        pager: {
          field: 'createdAt',
          limit: 10,
        },
        skipCache: true,
        runQuery: mockRunQuery,
      }

      await pageAggregation(config)

      // Verify skipCache was passed to runQuery
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          skipCache: true,
        })
      )
    })

    it('should use default runQuery when not provided', async () => {
      const mockExec = jest.fn()
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce([{ _id: '1', createdAt: new Date() }])

      mockModel.countDocuments.mockReturnValue({ exec: mockExec })
      mockModel.aggregate.mockReturnValue({ exec: mockExec })

      const config: PageAggregationConfig = {
        Model: mockModel,
        findQuery: { active: true },
        pager: {
          field: 'createdAt',
          limit: 10,
        },
        // runQuery not provided
      }

      const result = await pageAggregation(config)

      // Should have called exec on the queries
      expect(mockExec).toHaveBeenCalled()
      expect(result.dbObjects).toEqual([{ _id: '1', createdAt: new Date() }])
    })

    it('should handle runQuery returning aggregation results', async () => {
      const mockResults = [
        { _id: '1', createdAt: new Date('2023-01-01'), name: 'Item 1' },
        { _id: '2', createdAt: new Date('2023-01-02'), name: 'Item 2' },
      ]

      const mockRunQuery = jest.fn()
        .mockResolvedValueOnce(2) // count
        .mockResolvedValueOnce(mockResults) // aggregation

      mockModel.countDocuments.mockReturnValue({})
      mockModel.aggregate.mockReturnValue({})

      const config: PageAggregationConfig = {
        Model: mockModel,
        findQuery: { active: true },
        pager: {
          field: 'createdAt',
          limit: 10,
        },
        runQuery: mockRunQuery,
      }

      const result = await pageAggregation(config)

      expect(result.dbObjects).toEqual(mockResults)
      expect(result.total).toBe(2)
      expect(result.size).toBe(2)
    })

    it('should not call countDocuments runQuery when pager.from is provided', async () => {
      const mockRunQuery = jest.fn()
        .mockResolvedValueOnce([{ _id: '1', createdAt: new Date() }])

      mockModel.countDocuments.mockReturnValue({})
      mockModel.aggregate.mockReturnValue({})

      const config: PageAggregationConfig = {
        Model: mockModel,
        findQuery: { active: true },
        pager: {
          field: 'createdAt',
          limit: 10,
          from: { createdAt: new Date() },
        },
        runQuery: mockRunQuery,
      }

      await pageAggregation(config)

      // runQuery should only be called once (for aggregation, not countDocuments)
      expect(mockRunQuery).toHaveBeenCalledTimes(1)
    })
  })
})


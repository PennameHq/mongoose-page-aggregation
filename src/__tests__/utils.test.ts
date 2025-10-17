import { isValidId, toObjectId, isValidDate, compute } from '../index'

describe('Utility Functions', () => {
  describe('isValidId', () => {
    it('should return true for valid ObjectId strings', () => {
      expect(isValidId('507f1f77bcf86cd799439011')).toBe(true)
      expect(isValidId('507f191e810c19729de860ea')).toBe(true)
    })

    it('should return false for invalid ObjectId strings', () => {
      expect(isValidId('invalid')).toBe(false)
      expect(isValidId('507f1f77bcf86cd79943901')).toBe(false) // too short
      expect(isValidId('507f1f77bcf86cd799439011z')).toBe(false) // invalid char
      expect(isValidId('')).toBe(false)
      expect(isValidId(null)).toBe(false)
      expect(isValidId(undefined)).toBe(false)
    })
  })

  describe('toObjectId', () => {
    it('should convert valid string to ObjectId', () => {
      const id = '507f1f77bcf86cd799439011'
      const objectId = toObjectId(id)
      expect(objectId.toString()).toBe(id)
    })
  })

  describe('isValidDate', () => {
    it('should return true for valid dates', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate('2023-01-01')).toBe(true)
      expect(isValidDate('2023-01-01T00:00:00Z')).toBe(true)
      expect(isValidDate(1672531200000)).toBe(true) // timestamp
    })

    it('should return false for invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false)
      expect(isValidDate('')).toBe(false)
      expect(isValidDate(null)).toBe(false)
      expect(isValidDate(undefined)).toBe(false)
    })
  })

  describe('compute', () => {
    it('should execute the provided function and return result', () => {
      const result = compute(() => 2 + 2)
      expect(result).toBe(4)
    })

    it('should handle complex computations', () => {
      const result = compute(() => {
        const arr = [1, 2, 3, 4, 5]
        return arr.reduce((sum, num) => sum + num, 0)
      })
      expect(result).toBe(15)
    })
  })
})

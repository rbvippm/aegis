import { describe, expect, it } from 'vitest'
import { rebatePercent, rebateLabel } from '../../src/features/rewards/rebate'
describe('返水优势口径', () => {
  it('按渠道佣金乘以用户分成计算，不当作投注额比例', () => {
    expect(rebatePercent(30, 50)).toBe(15)
    expect(rebatePercent(25, 40)).toBe(10)
    expect(rebateLabel(rebatePercent(25, 35)!)).toBe('8.75%')
  })
  it('缺失和无效比例返回缺失，真实零比例保留为零', () => {
    for (const values of [
      [null, 50],
      [30, null],
      [undefined, 50],
      [NaN, 50],
      [-1, 50],
      [101, 50],
      [30, Infinity],
    ])
      expect(rebatePercent(values[0], values[1])).toBeNull()
    expect(rebatePercent(0, 50)).toBe(0)
  })
})

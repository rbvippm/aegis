import { describe, expect, it } from 'vitest'
import { installDismissDuration, parseInstallDismissal } from '../../src/features/install/dismissal'
describe('安装提示24小时关闭周期', () => {
  it('在24小时内隐藏，到期立即恢复', () => {
    const now = 1000
    const until = now + installDismissDuration
    expect(installDismissDuration).toBe(86400000)
    expect(parseInstallDismissal(String(until), now)).toBe(until)
    expect(parseInstallDismissal(String(until), until - 1)).toBe(until)
    expect(parseInstallDismissal(String(until), until)).toBe(0)
  })
  it('缺失、损坏或异常未来时间不会永久隐藏入口', () => {
    for (const raw of [null, '', 'NaN', 'Infinity', '-1', 'nonsense', String(86400000 * 10)])
      expect(parseInstallDismissal(raw, 1000)).toBe(0)
  })
})

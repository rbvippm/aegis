import { describe, it, expect } from 'vitest'
import { suggestedInstallGuide } from '../../src/platform/install'
describe('安装指引系统识别', () => {
  it('iPhone 和桌面模式 iPad 默认新版指引，允许页面手动选择旧版', () => {
    expect(suggestedInstallGuide('iPhone OS 18_6 like Mac OS X')).toBe('ios26')
    expect(suggestedInstallGuide('iPad OS 26_0')).toBe('ios26')
    expect(suggestedInstallGuide('iPhone OS 18_5 like Mac OS X')).toBe('ios18')
    expect(suggestedInstallGuide('iPhone OS 17_4 like Mac OS X')).toBe('ios18')
    expect(suggestedInstallGuide('Macintosh', 5)).toBe('ios26')
  })
  it('Android 与桌面区分', () => {
    expect(suggestedInstallGuide('Mozilla Android 15 Chrome')).toBe('android')
    expect(suggestedInstallGuide('Macintosh', 0)).toBe('desktop')
    expect(suggestedInstallGuide('Windows NT 10.0 Chrome')).toBe('desktop')
    expect(suggestedInstallGuide('Windows NT 10.0 Chrome', 0, 430)).toBe('ios26')
    expect(suggestedInstallGuide('Windows NT 10.0 Chrome', 0, 1280)).toBe('desktop')
    expect(suggestedInstallGuide('Mozilla Android 15 Chrome', 5, 430)).toBe('android')
  })
})

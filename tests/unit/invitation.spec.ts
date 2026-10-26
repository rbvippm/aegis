import { afterEach, describe, expect, it, vi } from 'vitest'
import { invitationLink, socialInvitation } from '@/features/invitation/links'
import { captureInvitation, readPendingInvitation } from '@/features/invitation/attribution'
import { shareInvitation } from '@/platform/share'
const code = 'AE23456789'
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
  localStorage.clear()
})
describe('邀请链接与个人码', () => {
  it('固定正式域名，拒绝非邀请码输入；社交参数正确编码且保留追踪来源', () => {
    expect(invitationLink(code)).toBe(`https://aegisuu.vercel.app/?ref=${code}`)
    expect(() => invitationLink('javascript:bad')).toThrow()
    const tg = new URL(socialInvitation('telegram', '小明 & AE', code))
    expect(tg.origin).toBe('https://t.me')
    const target = new URL(tg.searchParams.get('url')!)
    expect(target.searchParams.get('ref')).toBe(code)
    expect(target.searchParams.get('utm_source')).toBe('telegram')
    expect(tg.searchParams.get('text')).toContain('小明 & AE')
    const wa = new URL(socialInvitation('whatsapp', '小明', code))
    expect(wa.origin).toBe('https://wa.me')
    expect(wa.searchParams.get('text')).toContain(code)
    expect(wa.searchParams.get('text')).toContain('utm_source=whatsapp')
  })
  it('本地示例码跨重载稳定，不同示例身份分配不同码', async () => {
    vi.stubEnv('VITE_DATA_MODE', 'demo')
    vi.resetModules()
    const first = await (await import('@/features/invitation/service')).getInvitation()
    vi.resetModules()
    expect(await (await import('@/features/invitation/service')).getInvitation()).toEqual(first)
    localStorage.clear()
    vi.resetModules()
    expect((await (await import('@/features/invitation/service')).getInvitation()).code).not.toBe(
      first.code,
    )
  })
  it('正式接口失败不回退示例码', async () => {
    vi.stubEnv('VITE_DATA_MODE', 'api')
    vi.resetModules()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
    await expect((await import('@/features/invitation/service')).getInvitation()).rejects.toThrow()
    expect(localStorage.length).toBe(0)
  })
})
describe('邀请落地仅暂存来源', () => {
  it('验证邀请码，保留首次来源，30天后允许新来源', () => {
    const now = Date.now()
    captureInvitation(invitationLink(code, 'telegram'), localStorage, now)
    expect(readPendingInvitation(localStorage, now)).toEqual({
      code,
      source: 'telegram',
      capturedAt: now,
    })
    captureInvitation(invitationLink('AEABCDEFGH', 'whatsapp'), localStorage, now + 100)
    expect(readPendingInvitation(localStorage, now + 100)?.code).toBe(code)
    captureInvitation(invitationLink('AEABCDEFGH', 'whatsapp'), localStorage, now + 31 * 86400000)
    expect(readPendingInvitation(localStorage, now + 31 * 86400000)?.code).toBe('AEABCDEFGH')
  })
  it('无效或损坏来源不影响页面，也不生成注册记录', () => {
    captureInvitation('https://aegisuu.vercel.app/?ref=<bad>', localStorage)
    expect(readPendingInvitation(localStorage)).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})
describe('系统分享', () => {
  it('支持文件时发送海报、正文和链接', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, canShare: () => true })
    const poster = new File(['png'], 'invite.png', { type: 'image/png' })
    expect(await shareInvitation({ title: 'Aegis', url: invitationLink(code) }, poster)).toBe(
      'shared',
    )
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ files: [poster], url: invitationLink(code) }),
    )
  })
  it('不支持文件时分享链接；取消不显示成功或错误', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    vi.stubGlobal('navigator', { share, canShare: () => false })
    expect(await shareInvitation({ url: invitationLink(code) }, new File(['x'], 'x.png'))).toBe(
      'cancelled',
    )
    expect(share).toHaveBeenCalledWith({ url: invitationLink(code) })
  })
  it('未支持系统分享时明确降级，权限拒绝则返回错误', async () => {
    vi.stubGlobal('navigator', {})
    expect(await shareInvitation({ url: invitationLink(code) })).toBe('unsupported')
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new DOMException('blocked', 'NotAllowedError')),
    })
    await expect(shareInvitation({ url: invitationLink(code) })).rejects.toThrow('无法打开系统分享')
  })
})

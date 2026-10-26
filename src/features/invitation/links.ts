export const invitationOrigin = 'https://aegisuu.vercel.app'
export const invitationTitle = 'Aegis｜更清晰的数据，更理性的选择'
export const invitationDescription = '链上资金监测 · 体育数据对比 · AI 解读'
export const validInviteCode = (code: unknown): code is string =>
  typeof code === 'string' && /^[A-Z0-9]{8,16}$/.test(code)
export function invitationLink(code: string, source?: 'whatsapp' | 'telegram') {
  if (!validInviteCode(code)) throw new Error('邀请码格式不正确')
  const url = new URL('/', invitationOrigin)
  url.searchParams.set('ref', code)
  if (source) {
    url.searchParams.set('utm_source', source)
    url.searchParams.set('utm_medium', 'invite')
  }
  return url.href
}
export function invitationText(nickname: string, code: string) {
  return `🛡 ${invitationTitle}\n${nickname.slice(0, 24)} 邀请你一起体验 Aegis。\n${invitationDescription}\n看清平台信息，理解数据依据。\n专属邀请码：${code}`
}
export function socialInvitation(channel: 'whatsapp' | 'telegram', nickname: string, code: string) {
  const link = invitationLink(code, channel)
  const text = invitationText(nickname, code)
  const url = new URL(channel === 'telegram' ? 'https://t.me/share/url' : 'https://wa.me/')
  if (channel === 'telegram') url.searchParams.set('url', link)
  url.searchParams.set('text', channel === 'telegram' ? text : `${text}\n${link}`)
  return url.href
}

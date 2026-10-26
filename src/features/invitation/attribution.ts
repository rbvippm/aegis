import { validInviteCode } from './links'
const key = 'aegis-pending-invitation-v1'
const lifetime = 30 * 86400000
export interface PendingInvitation {
  code: string
  capturedAt: number
  source?: 'whatsapp' | 'telegram'
}
export function readPendingInvitation(
  storage: Pick<Storage, 'getItem' | 'removeItem'>,
  now = Date.now(),
): PendingInvitation | null {
  try {
    const item = JSON.parse(storage.getItem(key) ?? 'null') as Partial<PendingInvitation> | null
    if (
      item &&
      validInviteCode(item.code) &&
      typeof item.capturedAt === 'number' &&
      item.capturedAt <= now &&
      now - item.capturedAt < lifetime
    )
      return {
        code: item.code,
        capturedAt: item.capturedAt,
        ...(item.source === 'telegram' || item.source === 'whatsapp'
          ? { source: item.source }
          : {}),
      }
    storage.removeItem(key)
  } catch {
    /* Attribution is optional when storage is restricted. */
  }
  return null
}
export function captureInvitation(href: string, storage: Storage, now = Date.now()) {
  try {
    const url = new URL(href)
    const code = url.searchParams.get('ref')
    if (!validInviteCode(code) || readPendingInvitation(storage, now)) return
    const source = url.searchParams.get('utm_source')
    const item: PendingInvitation = {
      code,
      capturedAt: now,
      ...(source === 'whatsapp' || source === 'telegram' ? { source } : {}),
    }
    storage.setItem(key, JSON.stringify(item))
  } catch {
    /* Never block the landing page or treat a visit as a registration. */
  }
}

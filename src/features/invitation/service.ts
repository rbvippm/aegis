import { apiBase, dataMode } from '@/shared/api/config'
import { validInviteCode } from './links'
const demoIdentityKey = 'aegis-demo-invitation-identity-v1'
interface Invitation {
  code: string
}
function exampleIdentity(): Invitation {
  let stored: unknown
  try {
    stored = JSON.parse(localStorage.getItem(demoIdentityKey) ?? 'null')
  } catch {
    stored = null
  }
  if (stored && typeof stored === 'object' && 'code' in stored && validInviteCode(stored.code))
    return { code: stored.code }
  // Only demo accounts allocate codes locally. Real codes are assigned by the server.
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  const code = `AE${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`
  localStorage.setItem(demoIdentityKey, JSON.stringify({ code }))
  return { code }
}
let inMemoryExample: Invitation | undefined
export async function getInvitation(signal?: AbortSignal): Promise<Invitation> {
  if (dataMode === 'demo') {
    if (inMemoryExample) return inMemoryExample
    try {
      inMemoryExample = exampleIdentity()
    } catch {
      // Storage may be unavailable; keep a stable code for the current demo session.
      const bytes = crypto.getRandomValues(new Uint8Array(6))
      inMemoryExample = {
        code: `AE${Array.from(bytes, (n) => n.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()}`,
      }
    }
    return inMemoryExample
  }
  const response = await fetch(`${apiBase}/profile/invitation`, { credentials: 'include', signal })
  if (!response.ok) throw new Error('暂时无法获取邀请信息，请重试。')
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || !('code' in data) || !validInviteCode(data.code))
    throw new Error('邀请信息不完整，请重试。')
  return { code: data.code }
}

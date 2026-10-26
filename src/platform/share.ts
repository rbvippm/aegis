export type ShareOutcome = 'shared' | 'cancelled' | 'unsupported'
export async function shareInvitation(data: ShareData, poster?: File): Promise<ShareOutcome> {
  if (typeof navigator.share !== 'function') return 'unsupported'
  const payload =
    poster && navigator.canShare?.({ files: [poster] }) ? { ...data, files: [poster] } : data
  try {
    await navigator.share(payload)
    return 'shared'
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
      return 'cancelled'
    throw new Error('无法打开系统分享，请复制链接或保存海报后分享。')
  }
}
export async function copyInvitation(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('暂时无法复制，请长按上方内容手动复制。')
  await navigator.clipboard.writeText(value)
}
export function downloadInvitation(file: File) {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give mobile browsers time to start reading the file before revoking its URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 60000)
}

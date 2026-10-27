export const installDismissKey = 'aegis-install-dismiss-until-v1'
export const installDismissDuration = 24 * 60 * 60 * 1000
let sessionUntil = 0
export function parseInstallDismissal(value: string | null, now: number) {
  const until = Number(value)
  return Number.isFinite(until) && until > now && until <= now + installDismissDuration ? until : 0
}
export function readInstallDismissal(now = Date.now()) {
  try {
    sessionUntil = parseInstallDismissal(window.localStorage.getItem(installDismissKey), now)
  } catch {
    sessionUntil = parseInstallDismissal(String(sessionUntil), now)
  }
  return sessionUntil
}
export function dismissInstallEntry(now = Date.now()) {
  sessionUntil = now + installDismissDuration
  try {
    window.localStorage.setItem(installDismissKey, String(sessionUntil))
  } catch {
    /* Keep the dismissal in this tab when storage is unavailable. */
  }
  return sessionUntil
}

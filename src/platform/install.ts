export type InstallGuide = 'ios26' | 'ios18' | 'android' | 'desktop'
export function suggestedInstallGuide(
  userAgent: string,
  maxTouchPoints = 0,
  viewportWidth = 0,
): InstallGuide {
  if (/Android/i.test(userAgent)) return 'android'
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) {
    const version = userAgent.match(/(?:CPU (?:iPhone )?OS|iPhone OS) (\d+)[_.](\d+)/i)
    // Safari 26 can freeze the UA at 18.6; keep a lightweight layout switch in the guide.
    if (
      version &&
      Number(version[1]) < 26 &&
      !(Number(version[1]) === 18 && Number(version[2]) >= 6)
    )
      return 'ios18'
    return 'ios26'
  }
  // A narrow device preview can retain the desktop UA; show mobile instructions in that preview.
  return viewportWidth > 0 && viewportWidth <= 600 ? 'ios26' : 'desktop'
}
export function isStandaloneWindow() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  )
}

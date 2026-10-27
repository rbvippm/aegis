// The HTML shell paints before Vue and its async initial route are downloaded.
export function dismissBootScreen() {
  const boot = document.getElementById('app-boot')
  document.getElementById('app')?.removeAttribute('inert')
  if (!boot) return
  const remove = () => boot.remove()
  boot.addEventListener('transitionend', remove, { once: true })
  boot.classList.add('is-ready')
  // Also clean up when reduced motion disables the transition or the window is hidden.
  window.setTimeout(remove, 220)
}

export function showBootError() {
  const boot = document.getElementById('app-boot')
  if (!boot) return
  boot.dataset.state = 'error'
  boot.setAttribute('aria-label', '页面加载失败，请重新加载')
  const caption = boot.querySelector('.boot-caption')
  if (caption) caption.textContent = '页面加载失败，请重新加载'
}

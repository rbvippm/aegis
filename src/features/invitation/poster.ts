import qrcode from 'qrcode-generator'
import mark from '@/shared/assets/aegis-mark.png'
import { invitationLink, invitationDescription } from './links'
export function invitationQr(code: string) {
  const qr = qrcode(0, 'M')
  qr.addData(invitationLink(code), 'Byte')
  qr.make()
  return qr
}
function image(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('海报图片加载失败，请重试。'))
    img.src = src
  })
}
export async function makeInvitationPoster(code: string, nickname: string): Promise<File> {
  await document.fonts.ready
  const logo = await image(mark)
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('当前设备无法生成海报。')
  const font = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif'
  const box = (x: number, y: number, w: number, h: number, radius: number, color: string) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radius)
    ctx.fill()
  }
  const text = (
    content: string,
    x: number,
    y: number,
    size: number,
    color = '#14213d',
    weight = 500,
  ) => {
    ctx.font = `${weight} ${size}px ${font}`
    ctx.fillStyle = color
    ctx.fillText(content, x, y)
  }
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350)
  gradient.addColorStop(0, '#f5f8ff')
  gradient.addColorStop(0.6, '#ddecff')
  gradient.addColorStop(1, '#c6e3ff')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.fillStyle = '#ffffff66'
  ctx.beginPath()
  ctx.arc(1060, 180, 340, 0, Math.PI * 2)
  ctx.fill()
  ctx.drawImage(logo, 76, 64, 100, 100)
  text('Aegis', 194, 137, 67, '#10214f', 700)
  box(812, 88, 192, 52, 26, '#ffffffcc')
  text('专属邀请', 850, 123, 26, '#3d5d86', 600)
  text('更清晰的数据，', 80, 265, 65, '#14213d', 700)
  text('与你的朋友一起看', 80, 350, 65, '#14213d', 700)
  text(invitationDescription, 82, 423, 31, '#526581')
  box(256, 486, 568, 568, 48, '#ffffff')
  const qr = invitationQr(code)
  const count = qr.getModuleCount()
  const cell = Math.floor(488 / (count + 8))
  const size = cell * (count + 8)
  const startX = Math.round((1080 - size) / 2)
  const startY = 526 + Math.round((488 - size) / 2)
  ctx.fillStyle = '#14213d'
  for (let row = 0; row < count; row++)
    for (let col = 0; col < count; col++)
      if (qr.isDark(row, col))
        ctx.fillRect(startX + (col + 4) * cell, startY + (row + 4) * cell, cell, cell)
  ctx.textAlign = 'center'
  text('扫码打开 Aegis', 540, 1110, 32, '#14213d', 600)
  text('aegisuu.vercel.app', 540, 1156, 27, '#526581')
  ctx.textAlign = 'left'
  box(48, 1200, 984, 112, 28, '#ffffffdd')
  box(70, 1223, 66, 66, 22, '#0864ff')
  text('AE', 80, 1268, 28, '#ffffff', 700)
  text(Array.from(nickname).slice(0, 12).join(''), 154, 1249, 29, '#14213d', 600)
  text('邀请你一起体验 Aegis', 154, 1289, 24, '#526581')
  text('邀请码', 715, 1238, 20, '#526581')
  let codeSize = 31
  while (codeSize > 18) {
    ctx.font = `700 ${codeSize}px ${font}`
    if (ctx.measureText(code).width <= 285) break
    codeSize--
  }
  text(code, 715, 1281, codeSize, '#0864ff', 700)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error('海报生成失败，请重试。'))),
      'image/png',
    ),
  )
  return new File([blob], `Aegis-Invite-${code}.png`, { type: 'image/png' })
}

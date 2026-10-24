import type { EvidenceFile, SettlementRecord, TicketInput } from './types'
export function maskUid(value: string) {
  return value ? `${value.slice(0, 4)}***` : ''
}
export function validateUid(value: string) {
  return /^[A-Za-z0-9_-]{3,40}$/.test(value.trim())
    ? ''
    : '请输入 3–40 位字母、数字、下划线或短横线 UID。'
}
export function totalCents(records: SettlementRecord[], status: SettlementRecord['status']) {
  return records
    .filter((record) => record.status === status)
    .reduce((total, record) => total + record.cents, 0)
}
export function formatCents(cents: number) {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
export function validateEvidence(files: EvidenceFile[]) {
  if (files.length > 5) return '最多选择 5 个文件。'
  if (files.some((file) => file.size > 10 * 1024 * 1024 || file.size === 0))
    return '请选择非空且不超过 10MB 的文件。'
  if (
    files.some(
      (file) => !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type),
    )
  )
    return '仅支持 PNG、JPEG、WebP 或 PDF。'
  return ''
}
export function validateTicket(input: TicketInput) {
  if (!['A', 'B', 'C'].includes(input.platform) || !input.category.trim())
    return '请选择平台和问题类别。'
  if (input.description.trim().length < 10 || input.description.length > 3000)
    return '请填写 10–3000 字的问题描述。'
  if (
    input.amount &&
    (!/^\d+(\.\d{1,2})?$/.test(input.amount) ||
      Number(input.amount) <= 0 ||
      !Number.isFinite(Number(input.amount)))
  )
    return '争议金额须为大于 0 的有效数值，最多两位小数。'
  return validateEvidence(input.evidence)
}

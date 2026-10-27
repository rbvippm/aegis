/** Percent of the channel commission base shared with the user, not a stake rebate. */
export function rebatePercent(
  commission: number | null | undefined,
  share: number | null | undefined,
) {
  if (
    commission == null ||
    share == null ||
    !Number.isFinite(commission) ||
    !Number.isFinite(share) ||
    commission < 0 ||
    share < 0 ||
    commission > 100 ||
    share > 100
  )
    return null
  return (commission * share) / 100
}
export function rebateLabel(value: number) {
  return `${Number(value.toFixed(2))}%`
}

/** Decide whether a downward sheet gesture should dismiss or settle back. */
export function shouldDismissSheetSwipe(
  distancePx: number,
  sheetHeightPx: number,
  velocityPxPerMs: number
): boolean {
  if (![distancePx, sheetHeightPx, velocityPxPerMs].every(Number.isFinite)) return false

  const distance = Math.max(0, distancePx)
  const minimumDistance = Math.max(72, Math.max(0, sheetHeightPx) * 0.18)
  const isQuickDownwardFlick = distance >= 36 && velocityPxPerMs >= 0.55

  return distance >= minimumDistance || isQuickDownwardFlick
}

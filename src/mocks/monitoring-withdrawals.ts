import { monitoringPlatforms } from './monitoring-platforms'
// Independent fictional completed withdrawal observations, minutes from request to arrival.
// These observations are distinct from the pre-existing average-duration fixtures.
const largeMedians: Record<string, number> = { A: 9, J: 8, D: 10 }
export const withdrawalObservations = monitoringPlatforms
  .filter((p) => p.score !== null)
  .map((p) => ({
    platform: p.id,
    small: [0.7, 0.85, 1, 1, 1.3].map((f) => Number(((p.smallMinutes ?? 6) * f).toFixed(1))),
    large: [0.7, 0.85, 1, 1, 1.3].map((f) =>
      Number(((largeMedians[p.id] ?? p.largeMinutes ?? 20) * f).toFixed(1)),
    ),
  }))

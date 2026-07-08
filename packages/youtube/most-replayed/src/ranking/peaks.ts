import { smoothTimeline } from './timeline'

export type PeakCandidate = {
  index: number
  prominence: number
  score: number
}

function localProminence(values: number[], index: number): number {
  const score = values[index] ?? 0
  const left = values.slice(0, index + 1).reverse()
  const right = values.slice(index)
  const leftMin = minimumUntilHigher(left, score)
  const rightMin = minimumUntilHigher(right, score)
  return Math.max(0, score - Math.max(leftMin, rightMin))
}

function minimumUntilHigher(values: number[], ceiling: number): number {
  let minimum = ceiling

  for (const value of values) {
    if (value > ceiling) break
    minimum = Math.min(minimum, value)
  }

  return minimum
}

function edgeCandidates(values: number[]): PeakCandidate[] {
  const candidates: PeakCandidate[] = []
  const first = values[0]
  const second = values[1]
  const last = values.at(-1)
  const previous = values.at(-2)

  if (first !== undefined && second !== undefined && first >= second) {
    candidates.push({ index: 0, prominence: first - second, score: first })
  }

  if (last !== undefined && previous !== undefined && last >= previous) {
    candidates.push({ index: values.length - 1, prominence: last - previous, score: last })
  }

  return candidates
}

function interiorCandidates(values: number[]): PeakCandidate[] {
  const baseline = smoothTimeline(values, Math.max(8, Math.floor(values.length / 50)))
  const threshold = Math.max(0.006, Math.max(...values, 0) * 0.015)
  const candidates: PeakCandidate[] = []

  for (let index = 1; index < values.length - 1; index += 1) {
    const center = values[index] ?? 0
    const left = values[index - 1] ?? center
    const right = values[index + 1] ?? center
    if (center < left || center < right) continue

    const prominence = localProminence(values, index)
    if (prominence < threshold) continue

    const relativeLift = Math.max(0, center - (baseline[index] ?? center))
    candidates.push({ index, prominence, score: center + relativeLift * 0.5 })
  }

  return candidates
}

export function findPeakCandidates(values: number[]): PeakCandidate[] {
  const candidates = [...edgeCandidates(values), ...interiorCandidates(values)]
  if (candidates.length > 0) return candidates

  const globalMax = Math.max(...values, 0)
  const index = values.indexOf(globalMax)
  return index >= 0 ? [{ index, prominence: globalMax, score: globalMax }] : []
}

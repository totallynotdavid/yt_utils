import type { ReplayMarker } from '../types'
import { timelineToReplayMarkers } from '../ranking/timeline'
import { extractPathDAttributes } from './path_data'
import { parseSvgPathCommands } from './path_commands'
import { commandsToPoints, stitchPathPointGroups, type Point } from './path_points'
import { tokenizeSvgPath } from './path_tokens'

function pointsToHeatTimeline(points: Point[], durationSec: number): number[] {
  const minX = Math.min(...points.map((p) => p.x))
  const maxX = Math.max(...points.map((p) => p.x))
  const maxY = Math.max(...points.map((p) => p.y))
  const xRange = maxX - minX
  if (xRange <= 0) return []

  const timeline = Array.from({ length: Math.max(2, Math.floor(durationSec)) }, () => 0)
  for (const item of points) {
    const replayHeight = maxY - item.y
    const ratio = Math.max(0, Math.min(1, (item.x - minX) / xRange))
    const second = Math.min(timeline.length - 1, Math.floor(ratio * (timeline.length - 1)))
    timeline[second] = Math.max(timeline[second] ?? 0, replayHeight)
  }

  return timeline
}

export function markersFromSvg(svg: string, durationSec: number): ReplayMarker[] {
  if (!Number.isFinite(durationSec) || durationSec <= 1) return []

  const pointGroups = extractPathDAttributes(svg).map((pathData) =>
    commandsToPoints(parseSvgPathCommands(tokenizeSvgPath(pathData)))
  )
  const points = stitchPathPointGroups(pointGroups).filter(
    (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
  )
  if (points.length < 2) return []

  return timelineToReplayMarkers(pointsToHeatTimeline(points, durationSec))
}

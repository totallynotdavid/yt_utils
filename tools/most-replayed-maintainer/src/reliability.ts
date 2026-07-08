import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parseVideoId } from '@ytutils/core'
import {
  extractJsonMarkersCurrentFromHtml,
  markersFromJsonUnknown,
} from '../../../packages/youtube/most-replayed/src/json'
import {
  extractHeatmapSvgFromPage,
  withYoutubePage,
} from '../../../packages/youtube/most-replayed/src/capture/browser_heatmap'
import {
  markersFromSvg,
  maxDurationFromMarkers,
  topSegmentsFromMarkers,
} from '../../../packages/youtube/most-replayed/src/svg'
import { summarizeMarkerComparison } from './compare_heatmap'
import type { ReplayMarker } from '../../../packages/youtube/most-replayed/src/types'
import type {
  BatchFallbackReliabilityResult,
  FallbackReliabilityResult,
  ReliabilityGateThresholds,
} from './types'

const DEFAULT_RELIABILITY_GATE_THRESHOLDS: ReliabilityGateThresholds = {
  maxMeanRmseDelta: 0.08,
  maxMeanP95Delta: 0.2,
  minMeanSegmentOverlapRatio: 0.7,
  maxPerVideoRmseDelta: 0.15,
  maxPerVideoDeltaAbove020Ratio: 0.08,
  minPerVideoSegmentOverlapRatio: 0.4,
}

function segmentOverlapRatio(
  jsonSegments: Array<{ start: number; end: number }>,
  svgSegments: Array<{ start: number; end: number }>,
  toleranceSec = 0
): number {
  if (jsonSegments.length === 0 || svgSegments.length === 0) return 0

  const usedJson = Array.from({ length: jsonSegments.length }, () => false)
  let matches = 0

  for (const svg of svgSegments) {
    let bestIndex = -1
    let bestScore = 0

    for (let i = 0; i < jsonSegments.length; i += 1) {
      if (usedJson[i]) continue
      const json = jsonSegments[i]
      const overlapStart = Math.max(svg.start - toleranceSec, json.start - toleranceSec)
      const overlapEnd = Math.min(svg.end + toleranceSec, json.end + toleranceSec)
      const overlap = Math.max(0, overlapEnd - overlapStart)
      if (overlap <= 0) continue

      const union = Math.max(svg.end, json.end) - Math.min(svg.start, json.start)
      const iou = union > 0 ? overlap / union : 0
      if (iou > bestScore) {
        bestScore = iou
        bestIndex = i
      }
    }

    if (bestIndex >= 0) {
      usedJson[bestIndex] = true
      matches += 1
    }
  }

  return matches / Math.max(1, Math.max(jsonSegments.length, svgSegments.length))
}

function medianMarkerDurationSec(markers: ReplayMarker[]): number {
  if (markers.length === 0) return 1
  const durations = markers
    .map((marker) => Math.max(1, Math.round(marker.durationMillis / 1000)))
    .sort((a, b) => a - b)
  const mid = Math.floor(durations.length / 2)
  if (durations.length % 2 === 1) return durations[mid]
  return Math.round((durations[mid - 1] + durations[mid]) / 2)
}

function aggregateBatch(
  rootDir: string,
  results: FallbackReliabilityResult[]
): BatchFallbackReliabilityResult {
  const total = Math.max(1, results.length)
  const meanOfMeanDelta =
    results.reduce((sum, result) => sum + result.comparison.meanDelta, 0) / total
  const meanOfRmseDelta =
    results.reduce((sum, result) => sum + result.comparison.rmseDelta, 0) / total
  const meanOfP95Delta =
    results.reduce((sum, result) => sum + result.comparison.p95Delta, 0) / total
  const maxOfMaxDelta = results.reduce(
    (max, result) => Math.max(max, result.comparison.maxDelta),
    0
  )
  const meanSegmentOverlapRatio =
    results.reduce((sum, result) => sum + result.segmentAgreement.overlapRatio, 0) / total

  const lowReliabilityVideos = results
    .filter(
      (result) =>
        result.comparison.rmseDelta > 0.2 ||
        result.comparison.deltaAbove020Ratio > 0.05 ||
        result.segmentAgreement.overlapRatio < 0.5
    )
    .map((result) => result.videoId)

  return {
    rootDir,
    totalSnapshots: results.length,
    results,
    aggregate: {
      meanOfMeanDelta,
      meanOfRmseDelta,
      meanOfP95Delta,
      maxOfMaxDelta,
      meanSegmentOverlapRatio,
      lowReliabilityVideos,
    },
  }
}

function evaluateFallbackReliabilityFromArtifacts(
  videoId: string,
  jsonMarkers: ReplayMarker[],
  svg: string,
  durationSec: number,
  parts: number
): FallbackReliabilityResult {
  const safeDuration = Math.max(0, durationSec || maxDurationFromMarkers(jsonMarkers))
  const svgMarkers = markersFromSvg(svg, safeDuration)
  const summary = summarizeMarkerComparison(jsonMarkers, svgMarkers)

  const jsonSegments = topSegmentsFromMarkers(jsonMarkers, parts).map((segment) => ({
    start: segment.start,
    end: segment.end,
  }))
  const svgSegments = topSegmentsFromMarkers(svgMarkers, parts).map((segment) => ({
    start: segment.start,
    end: segment.end,
  }))
  const overlapToleranceSec = Math.max(2, medianMarkerDurationSec(jsonMarkers))

  return {
    videoId,
    durationSec: safeDuration,
    jsonMarkersCount: jsonMarkers.length,
    svgMarkersCount: svgMarkers.length,
    comparison: summary,
    segmentAgreement: {
      jsonSegments,
      svgSegments,
      overlapRatio: segmentOverlapRatio(jsonSegments, svgSegments, overlapToleranceSec),
    },
  }
}

export async function evaluateFallbackReliability(
  videoId: string,
  parts = 3
): Promise<FallbackReliabilityResult> {
  parseVideoId(videoId)

  return withYoutubePage(videoId, async (page) => {
    const html = await page.content()
    const jsonMarkers = extractJsonMarkersCurrentFromHtml(html)
    const { svg, durationSec } = await extractHeatmapSvgFromPage(page)

    return evaluateFallbackReliabilityFromArtifacts(
      videoId,
      jsonMarkers,
      svg,
      durationSec ?? maxDurationFromMarkers(jsonMarkers),
      parts
    )
  })
}

export async function evaluateFallbackReliabilityFromSnapshot(
  snapshotDir: string,
  parts = 3
): Promise<FallbackReliabilityResult> {
  if (!snapshotDir || typeof snapshotDir !== 'string') {
    throw new Error('snapshotDir must be a non-empty string')
  }

  const html = await readFile(join(snapshotDir, 'page.html'), 'utf8')
  const svg = await readFile(join(snapshotDir, 'heatmap.svg'), 'utf8')
  const meta = JSON.parse(await readFile(join(snapshotDir, 'meta.json'), 'utf8')) as {
    videoId?: string
    durationSec?: number
  }

  const jsonMarkers = extractJsonMarkersCurrentFromHtml(html)
  return evaluateFallbackReliabilityFromArtifacts(
    meta.videoId ?? 'unknown',
    jsonMarkers,
    svg,
    Number(meta.durationSec ?? 0),
    parts
  )
}

export async function evaluateFallbackReliabilityFromSnapshotBatch(
  rootDir: string,
  parts = 3
): Promise<BatchFallbackReliabilityResult> {
  if (!rootDir || typeof rootDir !== 'string') {
    throw new Error('rootDir must be a non-empty string')
  }

  const entries = await readdir(rootDir, { withFileTypes: true })
  const snapshotDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(rootDir, entry.name))

  const results: FallbackReliabilityResult[] = []
  for (const snapshotDir of snapshotDirs) {
    try {
      results.push(await evaluateFallbackReliabilityFromSnapshot(snapshotDir, parts))
    } catch {
      continue
    }
  }

  return aggregateBatch(rootDir, results)
}

export async function evaluateFallbackReliabilityFromSavedArtifacts(
  artifactsDir: string,
  videoId: string,
  parts = 3
): Promise<FallbackReliabilityResult> {
  if (!artifactsDir || typeof artifactsDir !== 'string') {
    throw new Error('artifactsDir must be a non-empty string')
  }
  parseVideoId(videoId)

  const jsonRaw = await readFile(join(artifactsDir, `${videoId}.markers.json`), 'utf8')
  const svg = await readFile(join(artifactsDir, `${videoId}.heatmap.svg`), 'utf8')

  const parsed = JSON.parse(jsonRaw) as unknown
  const jsonMarkers = Array.isArray(parsed) ? markersFromJsonUnknown({ markers: parsed }) : []
  if (jsonMarkers.length === 0) {
    throw new Error(`No JSON markers found for ${videoId}`)
  }

  const durationSec = maxDurationFromMarkers(jsonMarkers)
  return evaluateFallbackReliabilityFromArtifacts(videoId, jsonMarkers, svg, durationSec, parts)
}

export async function evaluateFallbackReliabilityFromSavedArtifactsBatch(
  artifactsDir: string,
  parts = 3
): Promise<BatchFallbackReliabilityResult> {
  if (!artifactsDir || typeof artifactsDir !== 'string') {
    throw new Error('artifactsDir must be a non-empty string')
  }

  const entries = await readdir(artifactsDir, { withFileTypes: true })
  const markerFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.markers.json'))
    .map((entry) => entry.name)

  const results: FallbackReliabilityResult[] = []
  for (const markerFile of markerFiles) {
    const videoId = markerFile.replace(/\.markers\.json$/, '')
    try {
      results.push(
        await evaluateFallbackReliabilityFromSavedArtifacts(artifactsDir, videoId, parts)
      )
    } catch {
      continue
    }
  }

  return aggregateBatch(artifactsDir, results)
}

export function validateFallbackReliabilityGate(
  batch: BatchFallbackReliabilityResult,
  thresholds: Partial<ReliabilityGateThresholds> = {}
): { passed: boolean; failures: string[]; thresholds: ReliabilityGateThresholds } {
  const resolvedThresholds: ReliabilityGateThresholds = {
    ...DEFAULT_RELIABILITY_GATE_THRESHOLDS,
    ...thresholds,
  }

  const failures: string[] = []
  if (batch.aggregate.meanOfRmseDelta > resolvedThresholds.maxMeanRmseDelta) {
    failures.push(
      `aggregate.meanOfRmseDelta=${batch.aggregate.meanOfRmseDelta.toFixed(4)} exceeds ${resolvedThresholds.maxMeanRmseDelta.toFixed(4)}`
    )
  }
  if (batch.aggregate.meanOfP95Delta > resolvedThresholds.maxMeanP95Delta) {
    failures.push(
      `aggregate.meanOfP95Delta=${batch.aggregate.meanOfP95Delta.toFixed(4)} exceeds ${resolvedThresholds.maxMeanP95Delta.toFixed(4)}`
    )
  }
  if (batch.aggregate.meanSegmentOverlapRatio < resolvedThresholds.minMeanSegmentOverlapRatio) {
    failures.push(
      `aggregate.meanSegmentOverlapRatio=${batch.aggregate.meanSegmentOverlapRatio.toFixed(4)} below ${resolvedThresholds.minMeanSegmentOverlapRatio.toFixed(4)}`
    )
  }

  for (const result of batch.results) {
    if (result.comparison.rmseDelta > resolvedThresholds.maxPerVideoRmseDelta) {
      failures.push(
        `${result.videoId}: rmseDelta=${result.comparison.rmseDelta.toFixed(4)} exceeds ${resolvedThresholds.maxPerVideoRmseDelta.toFixed(4)}`
      )
    }
    if (result.comparison.deltaAbove020Ratio > resolvedThresholds.maxPerVideoDeltaAbove020Ratio) {
      failures.push(
        `${result.videoId}: deltaAbove020Ratio=${result.comparison.deltaAbove020Ratio.toFixed(4)} exceeds ${resolvedThresholds.maxPerVideoDeltaAbove020Ratio.toFixed(4)}`
      )
    }
    if (result.segmentAgreement.overlapRatio < resolvedThresholds.minPerVideoSegmentOverlapRatio) {
      failures.push(
        `${result.videoId}: segmentOverlapRatio=${result.segmentAgreement.overlapRatio.toFixed(4)} below ${resolvedThresholds.minPerVideoSegmentOverlapRatio.toFixed(4)}`
      )
    }
  }

  return {
    passed: failures.length === 0,
    failures,
    thresholds: resolvedThresholds,
  }
}

export function assertFallbackReliabilityGate(
  batch: BatchFallbackReliabilityResult,
  thresholds: Partial<ReliabilityGateThresholds> = {}
): void {
  const validation = validateFallbackReliabilityGate(batch, thresholds)
  if (!validation.passed) {
    throw new Error(`Fallback reliability gate failed:\n${validation.failures.join('\n')}`)
  }
}

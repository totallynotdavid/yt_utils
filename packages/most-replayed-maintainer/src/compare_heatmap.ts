import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ReplayMarker } from '../../most-replayed/src/types'

type ComparisonPoint = {
  second: number
  jsonIntensity: number
  svgIntensity: number
}

export type ComparisonSummary = {
  seconds: number
  maxDelta: number
  meanDelta: number
  rmseDelta: number
  p95Delta: number
  deltaAbove005Ratio: number
  deltaAbove010Ratio: number
  deltaAbove020Ratio: number
  activeSecondOverlapRatio: number
  activeSecondJaccard: number
  pearsonCorrelation: number
  topDisagreements: Array<{
    second: number
    jsonIntensity: number
    svgIntensity: number
    delta: number
  }>
}

const WIDTH = 1440
const HEIGHT = 480
const PADDING = 48
const SERIES_COLORS = {
  json: '#e11d48',
  svg: '#0f766e',
  baseline: '#64748b',
}

function markersToSeries(markers: ReplayMarker[], seconds: number): number[] {
  const series = Array.from({ length: seconds }, () => 0)

  for (const marker of markers) {
    const startSecond = Math.max(0, Math.floor(marker.startMillis / 1000))
    const endSecond = Math.min(
      seconds - 1,
      Math.ceil((marker.startMillis + marker.durationMillis) / 1000)
    )

    for (let second = startSecond; second <= endSecond; second += 1) {
      series[second] = Math.max(series[second], marker.intensityScoreNormalized)
    }
  }

  return series
}

function buildComparisonPoints(
  jsonMarkers: ReplayMarker[],
  svgMarkers: ReplayMarker[]
): ComparisonPoint[] {
  const seconds = Math.max(
    jsonMarkers.reduce(
      (max, marker) =>
        Math.max(max, Math.ceil((marker.startMillis + marker.durationMillis) / 1000)),
      0
    ),
    svgMarkers.reduce(
      (max, marker) =>
        Math.max(max, Math.ceil((marker.startMillis + marker.durationMillis) / 1000)),
      0
    ),
    1
  )

  const jsonSeries = markersToSeries(jsonMarkers, seconds)
  const svgSeries = markersToSeries(svgMarkers, seconds)

  return Array.from({ length: seconds }, (_, second) => ({
    second,
    jsonIntensity: jsonSeries[second] ?? 0,
    svgIntensity: svgSeries[second] ?? 0,
  }))
}

export function summarizeMarkerComparison(
  jsonMarkers: ReplayMarker[],
  svgMarkers: ReplayMarker[]
): ComparisonSummary {
  return summarizeComparison(buildComparisonPoints(jsonMarkers, svgMarkers))
}

function summarizeComparison(points: ComparisonPoint[]): ComparisonSummary {
  const diffs = points.map((point) => ({
    second: point.second,
    jsonIntensity: point.jsonIntensity,
    svgIntensity: point.svgIntensity,
    delta: Math.abs(point.jsonIntensity - point.svgIntensity),
  }))

  const meanDelta = diffs.reduce((sum, item) => sum + item.delta, 0) / Math.max(1, diffs.length)
  const maxDelta = diffs.reduce((max, item) => Math.max(max, item.delta), 0)
  const rmseDelta = Math.sqrt(
    diffs.reduce((sum, item) => sum + item.delta * item.delta, 0) / Math.max(1, diffs.length)
  )

  const sortedDeltas = diffs.map((item) => item.delta).sort((a, b) => a - b)
  const p95Index = Math.min(sortedDeltas.length - 1, Math.floor(sortedDeltas.length * 0.95))
  const p95Delta = sortedDeltas[p95Index] ?? 0

  const deltaAbove005Ratio =
    diffs.filter((item) => item.delta > 0.05).length / Math.max(1, diffs.length)
  const deltaAbove010Ratio =
    diffs.filter((item) => item.delta > 0.1).length / Math.max(1, diffs.length)
  const deltaAbove020Ratio =
    diffs.filter((item) => item.delta > 0.2).length / Math.max(1, diffs.length)

  const jsonActive = points.filter((point) => point.jsonIntensity >= 0.05).length
  const svgActive = points.filter((point) => point.svgIntensity >= 0.05).length
  const bothActive = points.filter(
    (point) => point.jsonIntensity >= 0.05 && point.svgIntensity >= 0.05
  ).length
  const eitherActive = points.filter(
    (point) => point.jsonIntensity >= 0.05 || point.svgIntensity >= 0.05
  ).length

  const activeSecondOverlapRatio = bothActive / Math.max(1, Math.min(jsonActive, svgActive))
  const activeSecondJaccard = bothActive / Math.max(1, eitherActive)

  const count = Math.max(1, points.length)
  const meanJson = points.reduce((sum, point) => sum + point.jsonIntensity, 0) / count
  const meanSvg = points.reduce((sum, point) => sum + point.svgIntensity, 0) / count
  const covariance =
    points.reduce(
      (sum, point) => sum + (point.jsonIntensity - meanJson) * (point.svgIntensity - meanSvg),
      0
    ) / count
  const varianceJson =
    points.reduce((sum, point) => sum + (point.jsonIntensity - meanJson) ** 2, 0) / count
  const varianceSvg =
    points.reduce((sum, point) => sum + (point.svgIntensity - meanSvg) ** 2, 0) / count
  const stdJson = Math.sqrt(varianceJson)
  const stdSvg = Math.sqrt(varianceSvg)
  const pearsonCorrelation = stdJson > 0 && stdSvg > 0 ? covariance / (stdJson * stdSvg) : 0

  return {
    seconds: points.length,
    maxDelta,
    meanDelta,
    rmseDelta,
    p95Delta,
    deltaAbove005Ratio,
    deltaAbove010Ratio,
    deltaAbove020Ratio,
    activeSecondOverlapRatio,
    activeSecondJaccard,
    pearsonCorrelation,
    topDisagreements: diffs.sort((a, b) => b.delta - a.delta).slice(0, 10),
  }
}

function scaleX(second: number, total: number): number {
  const innerWidth = WIDTH - PADDING * 2
  return PADDING + (second / Math.max(1, total - 1)) * innerWidth
}

function scaleY(value: number): number {
  const innerHeight = HEIGHT - PADDING * 2
  return HEIGHT - PADDING - value * innerHeight
}

function seriesPath(points: ComparisonPoint[], key: 'jsonIntensity' | 'svgIntensity'): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${scaleX(point.second, points.length).toFixed(2)} ${scaleY(point[key]).toFixed(2)}`
    )
    .join(' ')
}

function renderOverlaySvg(points: ComparisonPoint[], summary: ComparisonSummary): string {
  const labels = [0, 0.25, 0.5, 0.75, 1].map((tick) => {
    const y = scaleY(tick)
    return `<line x1="${PADDING}" x2="${WIDTH - PADDING}" y1="${y}" y2="${y}" stroke="${SERIES_COLORS.baseline}" stroke-opacity="0.18" stroke-width="1" />`
  })

  const xTicks = Array.from({ length: Math.min(10, Math.max(2, points.length)) }, (_, index) =>
    Math.round((index / Math.max(1, Math.min(9, points.length - 1))) * (points.length - 1))
  )

  const xGrid = xTicks.map((second) => {
    const x = scaleX(second, points.length)
    return `<line x1="${x}" x2="${x}" y1="${PADDING}" y2="${HEIGHT - PADDING}" stroke="${SERIES_COLORS.baseline}" stroke-opacity="0.12" stroke-width="1" />`
  })

  const xLabels = xTicks.map((second) => {
    const x = scaleX(second, points.length)
    return `<text x="${x}" y="${HEIGHT - 18}" font-size="11" text-anchor="middle" fill="#475569">${second}s</text>`
  })

  const topDisagreementLabels = summary.topDisagreements.slice(0, 5).map((item, index) => {
    const y = 24 + index * 16
    return `<text x="${PADDING}" y="${y}" font-size="12" fill="#0f172a">Δ ${item.second}s json=${item.jsonIntensity.toFixed(3)} svg=${item.svgIntensity.toFixed(3)} diff=${item.delta.toFixed(3)}</text>`
  })

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Heatmap comparison">
  <rect width="100%" height="100%" fill="#f8fafc" />
  <rect x="${PADDING}" y="${PADDING}" width="${WIDTH - PADDING * 2}" height="${HEIGHT - PADDING * 2}" rx="16" fill="#ffffff" stroke="#e2e8f0" />
  ${labels.join('\n  ')}
  ${xGrid.join('\n  ')}
  <path d="${seriesPath(points, 'jsonIntensity')}" fill="none" stroke="${SERIES_COLORS.json}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="${seriesPath(points, 'svgIntensity')}" fill="none" stroke="${SERIES_COLORS.svg}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <line x1="${PADDING}" x2="${WIDTH - PADDING}" y1="${scaleY(0)}" y2="${scaleY(0)}" stroke="#cbd5e1" stroke-width="1" />
  <text x="${PADDING}" y="24" font-size="14" font-weight="600" fill="#0f172a">JSON vs SVG intensity comparison</text>
  <text x="${WIDTH - PADDING}" y="24" font-size="12" text-anchor="end" fill="#475569">seconds=${summary.seconds} meanΔ=${summary.meanDelta.toFixed(4)} rmseΔ=${summary.rmseDelta.toFixed(4)} maxΔ=${summary.maxDelta.toFixed(4)}</text>
  <text x="${PADDING}" y="${HEIGHT - 28}" font-size="12" fill="${SERIES_COLORS.json}">JSON markers</text>
  <text x="${PADDING + 120}" y="${HEIGHT - 28}" font-size="12" fill="${SERIES_COLORS.svg}">SVG markers</text>
  ${xLabels.join('\n  ')}
  ${topDisagreementLabels.join('\n  ')}
</svg>`.trim()
}

export async function saveHeatmapComparisonArtifacts(
  videoId: string,
  outDir: string,
  jsonMarkers: ReplayMarker[],
  svgMarkers: ReplayMarker[]
): Promise<ComparisonSummary> {
  await mkdir(outDir, { recursive: true })

  const points = buildComparisonPoints(jsonMarkers, svgMarkers)
  const summary = summarizeComparison(points)
  const overlaySvg = renderOverlaySvg(points, summary)

  await writeFile(
    join(outDir, `${videoId}.comparison.json`),
    JSON.stringify({ points, summary }, null, 2),
    'utf8'
  )
  await writeFile(join(outDir, `${videoId}.comparison.svg`), overlaySvg, 'utf8')

  return summary
}

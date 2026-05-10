import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractJsonMarkersCurrentFromHtml } from '../../most-replayed/src/json'
import { assertVideoId } from '../../most-replayed/src/boundary'
import {
  extractSvgAndDuration,
  readPageHtml,
  withYoutubePage,
} from '../../most-replayed/src/youtube_page'
import { markersFromSvg, maxDurationFromMarkers } from '../../most-replayed/src/svg'
import { saveHeatmapComparisonArtifacts } from './compare_heatmap'
import type { DiagnosticsResult } from './types'

export async function captureHeatmapDiagnostics(
  videoId: string,
  outDir: string
): Promise<DiagnosticsResult> {
  assertVideoId(videoId)
  if (!outDir || typeof outDir !== 'string') {
    throw new Error('outDir must be a non-empty string')
  }

  return withYoutubePage(videoId, async (page) => {
    await mkdir(outDir, { recursive: true })

    const html = await readPageHtml(page)
    const jsonMarkers = extractJsonMarkersCurrentFromHtml(html)
    const { svg, durationSec } = await extractSvgAndDuration(page)
    const safeDuration = durationSec ?? maxDurationFromMarkers(jsonMarkers)
    const svgMarkers = markersFromSvg(svg, Math.max(0, safeDuration))

    await writeFile(join(outDir, `${videoId}.heatmap.svg`), svg, 'utf8')
    await writeFile(
      join(outDir, `${videoId}.markers.json`),
      JSON.stringify(jsonMarkers, null, 2),
      'utf8'
    )
    await writeFile(
      join(outDir, `${videoId}.markers.svg.json`),
      JSON.stringify(svgMarkers, null, 2),
      'utf8'
    )

    const csvLines = ['second,intensity']
    for (const marker of svgMarkers) {
      csvLines.push(
        `${Math.floor(marker.startMillis / 1000)},${marker.intensityScoreNormalized.toFixed(6)}`
      )
    }
    await writeFile(join(outDir, `${videoId}.profile.csv`), `${csvLines.join('\n')}\n`, 'utf8')

    await saveHeatmapComparisonArtifacts(videoId, outDir, jsonMarkers, svgMarkers)

    const progressBar = await page.$('.ytp-progress-bar')
    if (progressBar) {
      await progressBar.screenshot({ path: join(outDir, `${videoId}.progress-bar.png`) })
    }

    return {
      durationSec,
      jsonMarkersCount: jsonMarkers.length,
      svgMarkersCount: svgMarkers.length,
      sourceUsed: jsonMarkers.length > 0 ? 'json' : 'svg',
    }
  })
}

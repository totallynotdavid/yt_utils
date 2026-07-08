import { markersFromSvg } from '../svg'
import type { ReplayMarker } from '../types'
import { extractHeatmapSvgFromPage, withYoutubePage } from '../capture/browser_heatmap'

export async function getSvgMarkersForVideo(
  videoId: string
): Promise<{ markers: ReplayMarker[]; durationSec: number }> {
  return withYoutubePage(videoId, async (page) => {
    const { svg, durationSec } = await extractHeatmapSvgFromPage(page)
    const safeDuration = Math.max(0, durationSec ?? 0)
    return {
      markers: markersFromSvg(svg, safeDuration),
      durationSec: safeDuration,
    }
  })
}

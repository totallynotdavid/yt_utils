import { markersFromSvg } from '../svg'
import type { ReplayMarker } from '../types'
import { extractSvgAndDuration, withYoutubePage } from '../youtube_page'

export async function getSvgMarkersForVideo(
  videoId: string
): Promise<{ markers: ReplayMarker[]; durationSec: number }> {
  return withYoutubePage(videoId, async (page) => {
    const { svg, durationSec } = await extractSvgAndDuration(page)
    const safeDuration = Math.max(0, durationSec ?? 0)
    return {
      markers: markersFromSvg(svg, safeDuration),
      durationSec: safeDuration,
    }
  })
}

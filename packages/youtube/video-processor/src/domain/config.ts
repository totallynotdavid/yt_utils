import type { VideoProcessorConfig } from './types'

export const defaultVideoProcessorConfig: VideoProcessorConfig = {
  defaults: {
    audioFormat: 'opus',
    videoFormat: 'mp4',
    audioQuality: 'best',
    videoQuality: 'best',
    outputDir: 'media',
  },
  videoSizeLimitMb: {
    small: 14,
    medium: 50,
    large: 200,
  },
}

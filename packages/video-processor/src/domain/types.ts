export type MediaKind = 'audio' | 'video'
export type AudioFormat = 'opus' | 'mp3' | 'm4a' | 'wav' | 'flac'
export type VideoFormat = 'mp4' | 'webm' | 'mkv'
export type OutputFormat = AudioFormat | VideoFormat
export type Quality = 'best' | 'worst'
export type VideoSize = 'small' | 'medium' | 'large'

export const AUDIO_FORMATS: readonly AudioFormat[] = ['opus', 'mp3', 'm4a', 'wav', 'flac']
export const VIDEO_FORMATS: readonly VideoFormat[] = ['mp4', 'webm', 'mkv']
export const OUTPUT_FORMATS: readonly OutputFormat[] = [...AUDIO_FORMATS, ...VIDEO_FORMATS]

export type ProcessVideoRequest = {
  videoId: string
  startTimeSec?: number
  endTimeSec?: number
  format?: OutputFormat
  quality?: Quality
  videoSize?: VideoSize
  outputDir?: string
}

export type OutputArtifact = {
  kind: MediaKind
  format: string
  path: string
}

export type ProcessVideoResult = {
  artifacts: OutputArtifact[]
}

export type VideoProcessorConfig = {
  defaults: {
    audioFormat: AudioFormat
    videoFormat: VideoFormat
    audioQuality: Quality
    videoQuality: Quality
    outputDir: string
  }
  videoSizeLimitMb: Record<VideoSize, number>
}

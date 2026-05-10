module.exports = {
  directories: {
    mediaAssets: 'media',
  },

  defaults: {
    quality: {
      audio: 'best', // Default audio quality
      video: 'best', // Default video quality
    },
    format: {
      audio: 'opus', // Default audio format
      video: 'mp4', // Default video format
    },
    videoSizeLimit: 14, // Default size limit for video in MB
  },

  // Format settings used by ffmpeg
  formats: {
    audio: {
      opus: { ffmpegCodec: 'libopus' },
      mp3: { ffmpegCodec: 'libmp3lame' },
      ogg: { ffmpegCodec: 'libopus' },
    },
    video: {
      mp4: { ffmpegCodec: 'libx264', ffmpegAudioCodec: 'aac' },
      webm: { ffmpegCodec: 'libvpx-vp9', ffmpegAudioCodec: 'libopus' },
    },
  },

  // Quality and size settings for downloads
  downloadSettings: {
    audioQuality: {
      best: 'bestaudio',
      worst: 'worstaudio',
    },
    videoQuality: {
      best: 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4] / bv*+ba/b',
      worst: 'wv*+wa/w',
    },
    videoSize: {
      small: '13M',
      medium: '50M',
      large: '100M',
    },
  },

  // Supported formats by yt-dlp post-processing (https://github.com/yt-dlp/yt-dlp#post-processing-options)
  ytDlpSupportedFormats: ['aac', 'alac', 'flac', 'mp3', 'm4a', 'opus', 'vorbis', 'wav'],
}

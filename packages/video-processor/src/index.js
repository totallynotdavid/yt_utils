const { downloadVideo } = require('./utils/ytdlpHelper')
const { convertToFormat } = require('./utils/ffmpegHelper')
const { ensureDirectoryExists } = require('./utils/folderStructure')
const path = require('path')
const config = require('../config/production.config')

/**
 * Processes a YouTube video by downloading it, optionally trimming, and converting to the desired format.
 * @param {string} youtubeId - The YouTube video ID.
 * @param {number} [startTime] - The start time for video trimming (in seconds).
 * @param {number} [endTime] - The end time for video trimming (in seconds).
 * @param {string} [format] - The desired output video format.
 * @param {string} [quality] - The desired quality for downloading (e.g., 'best', 'worst').
 * @returns {Promise<string>} - The path to the processed video file.
 */
async function processYouTubeVideo(youtubeId, startTime, endTime, format, quality, videoSize) {
  const results = []

  try {
    ensureDirectoryExists(path.resolve(config.directories.mediaAssets))

    let formatType = 'audio'
    if (format && config.formats.video[format]) {
      formatType = 'video'
    }
    format = format || config.defaults.format[formatType]
    quality = quality || config.defaults.quality[formatType]

    let downloadedFilePath = await downloadVideo(
      youtubeId,
      startTime,
      endTime,
      format,
      quality,
      videoSize
    )
    if (!downloadedFilePath) {
      throw new Error('Failed to download the video or parse the file name.')
    }

    downloadedFilePath = path.resolve(downloadedFilePath)
    results.push({ type: formatType, path: downloadedFilePath })

    const currentFormat = path.extname(downloadedFilePath).substring(1) // Extracts the extension without the dot

    if (currentFormat !== format) {
      const convertedFilePath = await convertToFormat(downloadedFilePath, format)
      results.push({ type: formatType, path: path.resolve(convertedFilePath) })
    }

    return results
  } catch (error) {
    console.error('Error processing the YouTube video:', error)
    throw error
  }
}

module.exports = processYouTubeVideo

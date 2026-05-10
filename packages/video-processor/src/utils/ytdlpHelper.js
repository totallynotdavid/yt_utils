const config = require('../../config/production.config')
const path = require('path')
const execCommand = require('./exec')

/**
 * Downloads a video from YouTube using the yt-dlp command line utility.
 *
 * This function builds and executes a yt-dlp command to download a video (or audio) from YouTube,
 * optionally trimming it to a specified time range and converting it to a specified format and quality.
 *
 * @param {string} youtubeId    - The YouTube video ID.
 * @param {number} [startTime]  - The start time for video trimming (in seconds). Optional.
 * @param {number} [endTime]    - The end time for video trimming (in seconds). Optional.
 * @param {string} [format]     - The desired output video format. Optional.
 * @param {string} [quality]    - The desired quality for downloading (e.g., 'best', 'worst'). Optional.
 * @returns {Promise<string>}     A promise that resolves with the file path of the downloaded video.
 *                                In case of an error, the promise is rejected with the error details.
 */
function downloadVideo(
  youtubeId,
  startTime,
  endTime,
  format = config.defaults.format.audio,
  quality = config.defaults.quality.audio,
  videoSize = config.defaults.videoSizeLimit
) {
  const formatType = format in config.formats.audio ? 'audio' : 'video'
  const qualitySetting =
    config.downloadSettings[`${formatType}Quality`][quality] ||
    config.downloadSettings[`${formatType}Quality`][config.defaults.quality[formatType]]

  const filenameTemplate = `${youtubeId}.%(ext)s`

  let command = `yt-dlp -v `

  if (formatType === 'video') {
    let videoFormat

    if (videoSize && config.downloadSettings.videoSize[videoSize]) {
      const sizeLimit = config.downloadSettings.videoSize[videoSize]
      videoFormat = `bv*[ext=mp4][filesize<=${sizeLimit}]+ba[ext=m4a]/b[ext=mp4][filesize<=${sizeLimit}]`
      command += `-f "${videoFormat}" -S "filesize:${sizeLimit}" `
    } else {
      videoFormat = qualitySetting
      command += `-f "${videoFormat}" `
    }
  } else if (formatType === 'audio') {
    command += `-f ${qualitySetting} --extract-audio `
    if (format in config.formats.audio) {
      command += `--audio-format ${format} `
    }
  }

  command += `https://www.youtube.com/watch?v=${youtubeId} -P "${config.directories.mediaAssets}"`

  if (startTime !== undefined || endTime !== undefined) {
    const timeRange = `*${startTime || ''}-${endTime || 'inf'}` // inf is the end of the video
    command += ` --download-sections "${timeRange}"`
  }

  command += ` -o "${filenameTemplate}"`

  return execCommand(command)
    .then((stdout) => getVideoFilename(stdout))
    .catch(handleDownloadError)
}

/**
 * Extracts the filename of the downloaded video from the standard output of yt-dlp.
 *
 * @param {string} stdout   - The standard output from executing the yt-dlp command.
 * @returns {string|null}     The file path of the downloaded video, or null if not found.
 */
function getVideoFilename(stdout) {
  const alreadyDownloadedRegex =
    /\[download\] ([\w/\\]+.{11}\.(webm|m4a|mp3|mp4|opus)) has already been downloaded/
  const extractAudioRegex = /\[ExtractAudio\] Destination: ([\w/\\]+.{11}\.(webm|m4a|mp3|mp4|opus))/
  const destinationRegex = /Destination: ([\w/\\]+.{11}\.(webm|m4a|mp3|mp4|opus))/
  const mergerRegex = /\[Merger\] Merging formats into "([\w/\\]+.{11}\.(mp4|avi))"/

  const match =
    stdout.match(mergerRegex) ||
    stdout.match(extractAudioRegex) ||
    stdout.match(destinationRegex) ||
    stdout.match(alreadyDownloadedRegex)
  if (match) {
    const filePath = path.join(match[1])
    return filePath
  }

  return null
}

/**
 * Handles errors that occur during video download.
 *
 * @param {Object} error  - The error object containing details about the failure.
 * @throws {Error}          Throws a new error with a more specific message if the video is unavailable.
 */
function handleDownloadError(error) {
  if (error.stderr && error.stderr.includes('Video unavailable. This video contains content')) {
    throw new Error('This video is unavailable due to content restrictions.')
  }
  throw error
}

module.exports = { downloadVideo }

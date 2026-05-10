const config = require('../../config/production.config')
const path = require('path')
const execCommand = require('./exec')

/**
 * Converts a media file to a specified format using FFmpeg.
 *
 * This function takes an input file path and a target format, then constructs
 * and executes an FFmpeg command to convert the file to the desired format.
 * The function supports both audio and video format conversions based on the
 * specified format's configuration in the application's settings (production.config.js).
 *
 * @param {string} inputPath  - The file path of the input media file to be converted.
 * @param {string} format     - The target format to which the media file should be converted.
 *                              This should be a key corresponding to an entry in the `formats`
 *                              object in the application's configuration.
 * @returns {Promise<string>}   A promise that resolves with the file path of the converted media file.
 *                              The promise is rejected if the conversion process fails.
 */
function convertToFormat(inputPath, format) {
  const formatType = config.formats.audio[format] ? 'audio' : 'video'
  const formatConfig =
    config.formats[formatType][format] ||
    config.formats[formatType][config.defaults.format[formatType]]

  const outputPath = inputPath.replace(path.extname(inputPath), `.${format}`)

  let command = `ffmpeg -y -i "${inputPath}"`
  if (formatType === 'audio') {
    command += ` -c:a ${formatConfig.ffmpegCodec} "${outputPath}"`
  } else {
    command += ` -c:v ${formatConfig.ffmpegCodec} -c:a ${formatConfig.ffmpegAudioCodec} "${outputPath}"`
  }

  return execCommand(command).then(() => outputPath)
}

module.exports = { convertToFormat }

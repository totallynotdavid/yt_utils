const { getNextApiKey } = require('./apiKeyRotation')

/**
 * Retrieves the length of a YouTube video.
 * @param {string} videoId - The YouTube video ID.
 * @param {string} format - The desired format for the video length ('seconds', 'minutes', 'hours', 'human-readable').
 * @returns {Promise<string|number>} The length of the video in the specified format.
 */
async function getVideoLength(videoId, format = 'human-readable') {
  try {
    const apiKey = getNextApiKey()
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&fields=items(contentDetails(duration))&part=contentDetails`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found')
    }

    const duration = data.items[0].contentDetails.duration
    return convertDuration(duration, format)
  } catch (error) {
    console.error('Error fetching video length:', error)
    throw error
  }
}

/**
 * Converts ISO 8601 duration to the desired format.
 * @param {string} duration - The ISO 8601 duration string.
 * @param {string} format - The desired format ('seconds', 'minutes', 'hours', 'human-readable').
 * @returns {string|number} The converted duration.
 */
function convertDuration(duration, format) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  const hours = (parseInt(match[1]) || 0) * 3600
  const minutes = (parseInt(match[2]) || 0) * 60
  const seconds = parseInt(match[3]) || 0
  const totalSeconds = hours + minutes + seconds

  switch (format) {
    case 'minutes':
      return totalSeconds / 60
    case 'hours':
      return totalSeconds / 3600
    case 'human-readable':
      return formatDurationHumanReadable(hours / 3600, minutes / 60, seconds)
    default:
      return totalSeconds
  }
}

/**
 * Formats the duration in a human-readable format.
 * The format adapts based on the duration (e.g., "HH:MM:SS", "MM:SS", or "SS segundos").
 * @param {number} hours - The number of hours.
 * @param {number} minutes - The number of minutes.
 * @param {number} seconds - The number of seconds.
 * @returns {string} The formatted duration.
 */
function formatDurationHumanReadable(hours, minutes, seconds) {
  const pad = (num) => num.toString().padStart(2, '0')
  if (hours >= 1) {
    return `${pad(Math.floor(hours))}:${pad(Math.floor(minutes % 60))}:${pad(seconds)}`
  } else if (minutes >= 1) {
    return `${pad(Math.floor(minutes))}:${pad(seconds)}`
  } else {
    return `${seconds} segundos`
  }
}

module.exports = {
  getVideoLength,
}

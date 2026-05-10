const fs = require('fs')

/**
 * Ensures that the specified directory exists. If it doesn't, it's created.
 * @param {string} dirPath - The path of the directory to check and create if necessary.
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

module.exports = { ensureDirectoryExists }

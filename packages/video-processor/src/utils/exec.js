const { exec } = require('child_process')

/**
 * Executes a given command in a child process and returns the result.
 *
 * This function wraps the Node.js `exec` function from the `child_process` module
 * in a Promise. It is used to execute shell commands and handle their outputs asynchronously.
 *
 * @param {string} command -  The command to be executed in the shell.
 * @returns {Promise<string>} A promise that resolves with the standard output (stdout) of the executed command.
 *                            In case of an error, the promise is rejected with an object containing the error,
 *                            the standard output (stdout), and the standard error output (stderr).
 */
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr })
      } else {
        resolve(stdout)
      }
    })
  })
}

module.exports = execCommand

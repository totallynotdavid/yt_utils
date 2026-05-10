const ytDownloader = require('../src/index')

async function exampleFunction({ youtubeId, startTime, endTime, format, quality, videoSize }) {
  try {
    const results = await ytDownloader(youtubeId, startTime, endTime, format, quality, videoSize)
    console.log(results)
  } catch (error) {
    console.error(`An error occurred processing [${youtubeId}]:`, error)
  }
}

async function runExamples() {
  console.log('We are expecting an opus file with a duration of 90 seconds')
  await exampleFunction({
    youtubeId: 'dQw4w9WgXcQ',
    startTime: 30,
    endTime: 120,
    format: 'opus',
  })

  console.log('We are expecting an mp3 file with a duration of 90 seconds')
  await exampleFunction({
    youtubeId: 'el0N_MDcp0Y',
    startTime: 30,
    endTime: 120,
    format: 'mp3',
  })

  console.log('We are expecting an opus file (complete video) in the best quality')
  await exampleFunction({
    youtubeId: '4lJfA6ANgNM',
  })

  console.log('We are expecting an opus file with a duration of 90 seconds')
  await exampleFunction({
    youtubeId: 'BxqYUbNR-c0',
    startTime: 30,
    endTime: 120,
  })

  console.log('We are expecting an mp4 file (complete video) in the best quality')
  await exampleFunction({
    youtubeId: 'BxqYUbNR-c0',
    format: 'mp4',
  })

  // Currently, there is known bug when using this: mp4 file without video, only audio
  console.log('We are expecting an mp4 file with a duration of 90 seconds')
  await exampleFunction({
    youtubeId: 'xg43lcItgKk',
    startTime: 30,
    endTime: 120,
    format: 'mp4',
  })

  console.log('We are expecting an mp4 file with a size of no more than 14MB')
  await exampleFunction({
    youtubeId: 'JC6budcACNE',
    format: 'mp4',
    videoSize: 'small',
  })
}

runExamples()

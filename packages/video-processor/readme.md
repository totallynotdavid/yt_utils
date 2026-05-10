[![npm](https://img.shields.io/npm/v/ytdlp_video_processor.svg)](https://www.npmjs.com/package/ytdlp_video_processor) ![ytdlp_video_processor 0.0.1](https://img.shields.io/badge/ytdlp_video_processor-0.0.1-brightgreen.svg)

# ytdlp_video_processor

Module for downloading, processing, and optionally converting YouTube videos. This package uses `yt-dlp` for downloading videos and `ffmpeg` for processing and converting them.

## Installation

Run the following command in your project directory to install the package:

```bash
npm install ytdlp_video_processor
```

## Usage

To use this module, first, import it:

```javascript
const ytdlp_video_processor = require('ytdlp_video_processor')
```

Then, call `ytdlp_video_processor` with the necessary parameters:

```javascript
async function downloadAndProcessVideo() {
  const youtubeId = '7W6RCTE0ZKM'
  const startTime = 0 // Optional: Start time in seconds for trimming the video
  const endTime = 120 // Optional: End time in seconds for trimming the video
  const format = 'ogg' // Optional: Desired output format (default is 'ogg')

  try {
    const processedFilePath = await ytdlp_video_processor(youtubeId, startTime, endTime, format)
    console.log('Processed video saved at:', processedFilePath)
  } catch (error) {
    console.error('Error:', error)
  }
}

downloadAndProcessVideo()
```

You can find more usage examples in the [examples/index.examples.js](examples/index.examples.js) file in the `examples` folder.

## Features

- Downloads YouTube videos using `yt-dlp`.
- Optionally trims videos using specified start and end times.
- Converts videos to specified formats using `ffmpeg`.
- Returns the absolute path of the processed video file.

## Contributing

Contributions are welcome. Please ensure that your contributions adhere to the project coding standards and include appropriate tests.

When contributing:

- Fork the repository.
- Create a new branch for each feature or improvement.
- Submit a pull request with comprehensive description of changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

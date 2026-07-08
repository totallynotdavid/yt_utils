[![npm](https://img.shields.io/npm/v/yt_duration.svg)](https://www.npmjs.com/package/yt_duration) ![yt_duration 0.0.1](https://img.shields.io/badge/yt_duration-0.0.1-brightgreen.svg)

# YouTube Video Length Fetcher

## Introduction

This package provides a simple and efficient way to fetch the length of a YouTube video in seconds, minutes, or hours. It utilizes the YouTube Data API to retrieve video information and parse the duration from ISO 8601 format to the desired time unit.

## Features

- Fetch the duration of any public YouTube video.
- Convert duration to seconds, minutes, or hours.
- Lightweight and easy-to-use.

## Installation

To install the package, run the following command in your project directory:

```bash
npm install yt_duration
```

## Usage

Here's how you can use this package in your project:

```javascript
const { getVideoLength } = require('yt_duration')

// Fetch video length in seconds
getVideoLength('your-video-id').then((durationInSeconds) => {
  console.log('Duration in seconds:', durationInSeconds)
})

// Fetch video length in minutes
getVideoLength('your-video-id', 'minutes').then((durationInMinutes) => {
  console.log('Duration in minutes:', durationInMinutes)
})

// Fetch video length in hours
getVideoLength('your-video-id', 'hours').then((durationInHours) => {
  console.log('Duration in hours:', durationInHours)
})
```

## API Reference

### `getVideoLength(videoId, format)`

Fetches the length of a YouTube video.

- `videoId` (String): The unique identifier for the YouTube video.
- `format` (String): The format for the returned duration ('seconds', 'minutes', 'hours'). Default is 'seconds'.

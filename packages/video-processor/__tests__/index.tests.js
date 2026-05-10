const processYouTubeVideo = require('../src')
const ytdlpHelper = require('../src/utils/ytdlpHelper')
const ffmpegHelper = require('../src/utils/ffmpegHelper')
const folderStructure = require('../src/utils/folderStructure')
const path = require('path')

jest.mock('../src/utils/ytdlpHelper')
jest.mock('../src/utils/ffmpegHelper')
jest.mock('../src/utils/folderStructure')

describe('processYouTubeVideo', () => {
  const youtubeId = 'exampleId'
  const mediaAssetsFolder = 'media'
  const downloadedFilePath = path.join(mediaAssetsFolder, `${youtubeId}.ogg`)
  const convertedFilePath = path.join(mediaAssetsFolder, `${youtubeId}.mp4`)

  beforeEach(() => {
    jest.clearAllMocks()
    folderStructure.ensureDirectoryExists.mockImplementation(() => {})
    ytdlpHelper.downloadVideo.mockResolvedValue(downloadedFilePath)
    ffmpegHelper.convertToFormat.mockResolvedValue(convertedFilePath)
  })

  /*
  it("should process a video without format conversion", async () => {
    const result = await processYouTubeVideo(youtubeId)
    expect(folderStructure.ensureDirectoryExists).toHaveBeenCalled()
    expect(ytdlpHelper.downloadVideo).toHaveBeenCalledWith(
      youtubeId,
      undefined,
      undefined,
      "mp4",
      "worst",
    )
    expect(ffmpegHelper.convertToFormat).not.toHaveBeenCalled()
    expect(result).toBe(path.resolve(downloadedFilePath))
  })
  */

  it('should process a video with format conversion', async () => {
    const format = 'mp4'
    const absoluteDownloadedFilePath = path.resolve(downloadedFilePath)
    const absoluteConvertedFilePath = path.resolve(convertedFilePath)

    ffmpegHelper.convertToFormat.mockResolvedValue(absoluteConvertedFilePath)

    const result = await processYouTubeVideo(youtubeId, null, null, format)
    expect(ytdlpHelper.downloadVideo).toHaveBeenCalledWith(youtubeId, null, null, 'mp4', 'worst')
    expect(ffmpegHelper.convertToFormat).toHaveBeenCalledWith(absoluteDownloadedFilePath, format)
    expect(result).toBe(absoluteConvertedFilePath)
  })

  it('should throw an error if download fails', async () => {
    const errorMessage = 'Failed to download video'
    ytdlpHelper.downloadVideo.mockRejectedValue(new Error(errorMessage))

    await expect(processYouTubeVideo(youtubeId)).rejects.toThrow(errorMessage)
  })
})

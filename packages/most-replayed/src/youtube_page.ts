import type { Browser, Page } from 'puppeteer'
import { extractDurationFromProgressAria } from './svg'

export class MissingPuppeteerError extends Error {
  constructor() {
    super(
      "SVG strategy requires optional peer dependency 'puppeteer'. Install it with: npm install puppeteer"
    )
    this.name = 'MissingPuppeteerError'
  }
}

async function navigateToVideo(page: Page, videoId: string): Promise<void> {
  await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
    waitUntil: ['domcontentloaded', 'networkidle2'],
    timeout: 45000,
  })
}

export async function withYoutubePage<T>(
  videoId: string,
  execute: (page: Page) => Promise<T>
): Promise<T> {
  let puppeteerModule: typeof import('puppeteer')
  try {
    puppeteerModule = await import('puppeteer')
  } catch {
    throw new MissingPuppeteerError()
  }

  const browser = (await puppeteerModule.default.launch({ headless: true })) as Browser

  try {
    const page = await browser.newPage()
    await navigateToVideo(page, videoId)
    return execute(page)
  } finally {
    await browser.close()
  }
}

export async function readPageHtml(page: Page): Promise<string> {
  return page.content()
}

export async function fetchWatchHtml(videoId: string): Promise<string> {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch YouTube watch page: HTTP ${response.status}`)
  }

  return response.text()
}

export async function extractSvgAndDuration(
  page: Page
): Promise<{ svg: string; durationSec: number | null }> {
  await page.waitForSelector('.ytp-progress-bar', { timeout: 15000 })

  const progressBarHandle = await page.$('.ytp-progress-bar')
  const progressBarBox = await progressBarHandle?.boundingBox()
  if (progressBarBox) {
    const y = progressBarBox.y + progressBarBox.height / 2
    await page.mouse.move(progressBarBox.x + progressBarBox.width * 0.25, y)
    await page.mouse.move(progressBarBox.x + progressBarBox.width * 0.5, y)
    await page.mouse.move(progressBarBox.x + progressBarBox.width * 0.75, y)
  }

  await page.waitForSelector('.ytp-heat-map-svg, .ytp-heat-map-path', { timeout: 15000 })

  const data = await page.evaluate(() => {
    const doc = document

    const svgNodes = Array.from(doc.querySelectorAll('.ytp-heat-map-svg'))
    const pathNodes = Array.from(doc.querySelectorAll('.ytp-heat-map-path'))
    const mergedSvgFromNodes = svgNodes.map((n) => n.outerHTML).join('\n')
    const mergedSvg =
      mergedSvgFromNodes.length > 0
        ? mergedSvgFromNodes
        : `<svg>${pathNodes.map((n) => n.outerHTML).join('\n')}</svg>`
    const progressBar = doc.querySelector('.ytp-progress-bar')
    const ariaMax = progressBar?.getAttribute('aria-valuemax') ?? null
    return { mergedSvg, ariaMax }
  })

  return {
    svg: data.mergedSvg,
    durationSec: extractDurationFromProgressAria(data.ariaMax),
  }
}

import type { Browser, Page } from 'puppeteer'

import { YtUtilsError } from '@ytutils/core'

import { extractDurationFromProgressAria } from './duration'

export class MissingPuppeteerError extends Error {
  constructor() {
    super(
      "SVG strategy requires optional peer dependency 'puppeteer'. Install it with: npm install puppeteer"
    )
    this.name = 'MissingPuppeteerError'
  }
}

// Ubuntu 23.10+ blocks unprivileged user namespaces through AppArmor, which
// Chrome's sandbox needs. Chrome then refuses to start with "No usable
// sandbox!"; retrying without the sandbox keeps the SVG strategy usable there.
function isChromeSandboxError(error: unknown): boolean {
  return String(error).includes('No usable sandbox')
}

async function launchBrowser(puppeteerModule: typeof import('puppeteer')): Promise<Browser> {
  try {
    return await puppeteerModule.default.launch({ headless: true })
  } catch (error) {
    if (!isChromeSandboxError(error)) throw error
    return puppeteerModule.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }
}

async function navigateToVideo(page: Page, videoId: string): Promise<void> {
  await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
    waitUntil: ['domcontentloaded', 'networkidle2'],
    timeout: 45000,
  })
}

async function hoverProgressBar(page: Page): Promise<void> {
  const progressBarHandle = await page.$('.ytp-progress-bar')
  const progressBarBox = await progressBarHandle?.boundingBox()
  if (!progressBarBox) return

  const y = progressBarBox.y + progressBarBox.height / 2
  await page.mouse.move(progressBarBox.x + progressBarBox.width * 0.25, y)
  await page.mouse.move(progressBarBox.x + progressBarBox.width * 0.5, y)
  await page.mouse.move(progressBarBox.x + progressBarBox.width * 0.75, y)
}

// Keep the package's error contract: raw puppeteer failures carry no
// YtUtilsError code, so map them onto one before they reach callers.
function toYtUtilsError(error: unknown): YtUtilsError {
  const message = error instanceof Error ? error.message : String(error)
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new YtUtilsError('TIMEOUT', 'Timed out loading the YouTube watch page or heatmap', error)
  }
  if (message.includes('Failed to launch the browser process')) {
    return new YtUtilsError(
      'DEPENDENCY_MISSING',
      'Could not launch Chrome; install the browser bundled with puppeteer (npx puppeteer browsers install chrome)',
      error
    )
  }
  return new YtUtilsError('UPSTREAM_ERROR', 'Capturing the YouTube page failed', error)
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

  try {
    const browser = await launchBrowser(puppeteerModule)
    try {
      const page = await browser.newPage()
      await navigateToVideo(page, videoId)
      return await execute(page)
    } finally {
      await browser.close()
    }
  } catch (error) {
    if (error instanceof YtUtilsError || error instanceof MissingPuppeteerError) throw error
    throw toYtUtilsError(error)
  }
}

export async function extractHeatmapSvgFromPage(
  page: Page
): Promise<{ svg: string; durationSec: number | null }> {
  await page.waitForSelector('.ytp-progress-bar', { timeout: 15000 })
  await hoverProgressBar(page)
  await page.waitForSelector('.ytp-heat-map-svg, .ytp-heat-map-path', { timeout: 15000 })

  const data = await page.evaluate(() => {
    const svgNodes = Array.from(document.querySelectorAll('.ytp-heat-map-svg'))
    const pathNodes = Array.from(document.querySelectorAll('.ytp-heat-map-path'))
    const mergedSvgFromNodes = svgNodes.map((n) => n.outerHTML).join('\n')
    const mergedSvg =
      mergedSvgFromNodes.length > 0
        ? mergedSvgFromNodes
        : `<svg>${pathNodes.map((n) => n.outerHTML).join('\n')}</svg>`
    const progressBar = document.querySelector('.ytp-progress-bar')
    const ariaMax = progressBar?.getAttribute('aria-valuemax') ?? null
    return { mergedSvg, ariaMax }
  })

  return {
    svg: data.mergedSvg,
    durationSec: extractDurationFromProgressAria(data.ariaMax),
  }
}

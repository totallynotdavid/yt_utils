import { extractScriptTextsFromHtml } from './html_scripts'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function findMarkersListNode(value: unknown): unknown {
  if (!isRecord(value)) return null

  const markersList = value['macroMarkersListEntity']
  if (isRecord(markersList) && isRecord(markersList['markersList'])) {
    return markersList['markersList']
  }

  for (const child of Object.values(value)) {
    const found = Array.isArray(child)
      ? child.map(findMarkersListNode).find(Boolean)
      : findMarkersListNode(child)
    if (found) return found
  }

  return null
}

function frameworkPayloadFromScript(text: string): unknown {
  if (!text.includes('frameworkUpdates')) return null

  const match = text.match(/\{.*\}/s)
  if (!match) return null

  const parsed = parseJsonObject(match[0])
  return isRecord(parsed) ? parsed['frameworkUpdates'] : null
}

export function extractMarkerPayloadsFromHtml(html: string): unknown[] {
  return extractScriptTextsFromHtml(html)
    .map(frameworkPayloadFromScript)
    .map(findMarkersListNode)
    .filter(Boolean)
}

import { extractScriptTextsFromHtml } from './html_scripts'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

type JsonScanState = {
  depth: number
  inString: boolean
  escaped: boolean
}

function advanceStringState(state: JsonScanState, ch: string | undefined): JsonScanState {
  if (state.escaped) return { ...state, escaped: false }
  if (ch === '\\') return { ...state, escaped: true }
  if (ch === '"') return { ...state, inString: false }
  return state
}

function advanceObjectState(state: JsonScanState, ch: string | undefined): JsonScanState {
  if (ch === '"') return { ...state, inString: true }
  if (ch === '{') return { ...state, depth: state.depth + 1 }
  if (ch === '}') return { ...state, depth: state.depth - 1 }
  return state
}

function extractJsonObjectAt(text: string, startIndex: number): string | null {
  if (startIndex < 0 || startIndex >= text.length || text[startIndex] !== '{') return null

  let state: JsonScanState = { depth: 0, inString: false, escaped: false }

  for (let i = startIndex; i < text.length; i += 1) {
    state = state.inString ? advanceStringState(state, text[i]) : advanceObjectState(state, text[i])
    if (!state.inString && state.depth === 0) return text.slice(startIndex, i + 1)
  }

  return null
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

function fastPayloadFromScript(text: string): unknown {
  const markerKeyIndex = text.indexOf('macroMarkersListEntity')
  if (markerKeyIndex < 0) return null

  const start = text.lastIndexOf('{', markerKeyIndex)
  const candidate = extractJsonObjectAt(text, start)
  if (!candidate) return null

  const parsed = parseJsonObject(candidate)
  if (!isRecord(parsed)) return null

  const markersEntity = parsed['macroMarkersListEntity']
  return isRecord(markersEntity) ? markersEntity['markersList'] : null
}

export function extractCurrentJsonMarkerPayloadsFromHtml(html: string): unknown[] {
  return extractScriptTextsFromHtml(html)
    .map(frameworkPayloadFromScript)
    .map(findMarkersListNode)
    .filter(Boolean)
}

export function extractFastJsonMarkerPayloadsFromHtml(html: string): unknown[] {
  return extractScriptTextsFromHtml(html).map(fastPayloadFromScript).filter(Boolean)
}

import type { ReplayMarker } from '../types'
import { markersFromJsonUnknown } from './json_markers'

function findMarkersListNode(value: unknown): unknown {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const markersList = record['macroMarkersListEntity']
  if (markersList && typeof markersList === 'object') {
    const maybeMarkersList = (markersList as Record<string, unknown>)['markersList']
    if (maybeMarkersList && typeof maybeMarkersList === 'object') {
      return maybeMarkersList
    }
  }

  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findMarkersListNode(item)
        if (found) return found
      }
    } else {
      const found = findMarkersListNode(child)
      if (found) return found
    }
  }

  return null
}

function extractScriptTextsFromHtml(html: string): string[] {
  const out: string[] = []
  const re = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi
  let match: RegExpExecArray | null = null
  while ((match = re.exec(html)) !== null) {
    const text = match[1] ?? ''
    if (text.length > 0) out.push(text)
  }
  return out
}

function extractJsonObjectAt(text: string, startIndex: number): string | null {
  if (startIndex < 0 || startIndex >= text.length || text[startIndex] !== '{') return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = startIndex; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(startIndex, i + 1)
      }
    }
  }

  return null
}

export function extractJsonMarkersCurrentFromHtml(html: string): ReplayMarker[] {
  const scripts = extractScriptTextsFromHtml(html)
  for (const text of scripts) {
    if (!text.includes('frameworkUpdates')) continue
    const match = text.match(/\{.*\}/s)
    if (!match) continue

    try {
      const parsed = JSON.parse(match[0]) as { frameworkUpdates?: unknown }
      const markers = findMarkersListNode(parsed.frameworkUpdates)
      const normalized = markersFromJsonUnknown(markers)
      if (normalized.length > 0) return normalized
    } catch {
      continue
    }
  }

  return []
}

export function extractJsonMarkersFastFromHtml(html: string): ReplayMarker[] {
  const scripts = extractScriptTextsFromHtml(html)
  for (const text of scripts) {
    const markerKeyIndex = text.indexOf('macroMarkersListEntity')
    if (markerKeyIndex < 0) continue

    const start = text.lastIndexOf('{', markerKeyIndex)
    if (start < 0) continue

    const candidate = extractJsonObjectAt(text, start)
    if (!candidate) continue

    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>
      const markers = (parsed['macroMarkersListEntity'] as Record<string, unknown> | undefined)?.[
        'markersList'
      ]
      const normalized = markersFromJsonUnknown(markers)
      if (normalized.length > 0) return normalized
    } catch {
      continue
    }
  }

  return []
}

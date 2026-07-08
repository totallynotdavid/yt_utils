import type { SvgPathCommand } from './path_commands'

export type Point = { x: number; y: number }

type PathState = {
  curr: Point
  subpathStart: Point
  lastCubicControl: Point | null
  lastQuadControl: Point | null
}

type CommandHandler = (state: PathState, item: SvgPathCommand) => Point[]

function point(x: number, y: number): Point {
  return { x, y }
}

function absolutePoint(state: PathState, relative: boolean, x: number, y: number): Point {
  return relative ? point(state.curr.x + x, state.curr.y + y) : point(x, y)
}

function sampleLine(from: Point, to: Point, steps = 2): Point[] {
  return sampleParametric(steps, (index) => {
    const t = (index + 1) / steps
    return point(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)
  })
}

function sampleParametric(steps: number, resolve: (index: number) => Point): Point[] {
  return Array.from({ length: steps }, (_, index) => resolve(index))
}

function sampleCubic(from: Point, c1: Point, c2: Point, to: Point, steps = 8): Point[] {
  return sampleParametric(steps, (index) => {
    const t = (index + 1) / steps
    const mt = 1 - t
    return point(
      mt * mt * mt * from.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * to.x,
      mt * mt * mt * from.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * to.y
    )
  })
}

function sampleQuadratic(from: Point, c: Point, to: Point, steps = 8): Point[] {
  return sampleParametric(steps, (index) => {
    const t = (index + 1) / steps
    const mt = 1 - t
    return point(
      mt * mt * from.x + 2 * mt * t * c.x + t * t * to.x,
      mt * mt * from.y + 2 * mt * t * c.y + t * t * to.y
    )
  })
}

function resetControls(state: PathState): void {
  state.lastCubicControl = null
  state.lastQuadControl = null
}

function applyMove(state: PathState, item: SvgPathCommand): Point[] {
  const [x = 0, y = 0] = item.values
  state.curr = absolutePoint(state, item.relative, x, y)
  state.subpathStart = { ...state.curr }
  resetControls(state)
  return [{ ...state.curr }]
}

function applyLine(state: PathState, to: Point): Point[] {
  const points = sampleLine(state.curr, to)
  state.curr = to
  resetControls(state)
  return points
}

function applyCubic(state: PathState, item: SvgPathCommand): Point[] {
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0] = item.values
  const c1 = absolutePoint(state, item.relative, x1, y1)
  const c2 = absolutePoint(state, item.relative, x2, y2)
  const to = absolutePoint(state, item.relative, x3, y3)
  const points = sampleCubic(state.curr, c1, c2, to)
  state.curr = to
  state.lastCubicControl = c2
  state.lastQuadControl = null
  return points
}

function applySmoothCubic(state: PathState, item: SvgPathCommand): Point[] {
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = item.values
  const c1 = state.lastCubicControl
    ? point(
        2 * state.curr.x - state.lastCubicControl.x,
        2 * state.curr.y - state.lastCubicControl.y
      )
    : { ...state.curr }
  const c2 = absolutePoint(state, item.relative, x1, y1)
  const to = absolutePoint(state, item.relative, x2, y2)
  const points = sampleCubic(state.curr, c1, c2, to)
  state.curr = to
  state.lastCubicControl = c2
  state.lastQuadControl = null
  return points
}

function applyQuadratic(state: PathState, item: SvgPathCommand): Point[] {
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = item.values
  const c = absolutePoint(state, item.relative, x1, y1)
  const to = absolutePoint(state, item.relative, x2, y2)
  const points = sampleQuadratic(state.curr, c, to)
  state.curr = to
  state.lastQuadControl = c
  state.lastCubicControl = null
  return points
}

function applySmoothQuadratic(state: PathState, item: SvgPathCommand): Point[] {
  const [x = 0, y = 0] = item.values
  const c = state.lastQuadControl
    ? point(2 * state.curr.x - state.lastQuadControl.x, 2 * state.curr.y - state.lastQuadControl.y)
    : { ...state.curr }
  const to = absolutePoint(state, item.relative, x, y)
  const points = sampleQuadratic(state.curr, c, to)
  state.curr = to
  state.lastQuadControl = c
  state.lastCubicControl = null
  return points
}

function lineToValues(state: PathState, item: SvgPathCommand): Point[] {
  const [x = 0, y = 0] = item.values
  return applyLine(state, absolutePoint(state, item.relative, x, y))
}

function horizontalToValues(state: PathState, item: SvgPathCommand): Point[] {
  const [x = 0] = item.values
  return applyLine(state, point(item.relative ? state.curr.x + x : x, state.curr.y))
}

function verticalToValues(state: PathState, item: SvgPathCommand): Point[] {
  const [y = 0] = item.values
  return applyLine(state, point(state.curr.x, item.relative ? state.curr.y + y : y))
}

function arcToEndpoint(state: PathState, item: SvgPathCommand): Point[] {
  const [, , , , , x = 0, y = 0] = item.values
  return applyLine(state, absolutePoint(state, item.relative, x, y))
}

function closePath(state: PathState): Point[] {
  return applyLine(state, { ...state.subpathStart })
}

const COMMAND_HANDLERS: Record<string, CommandHandler> = {
  A: arcToEndpoint,
  C: applyCubic,
  H: horizontalToValues,
  L: lineToValues,
  M: applyMove,
  Q: applyQuadratic,
  S: applySmoothCubic,
  T: applySmoothQuadratic,
  V: verticalToValues,
  Z: closePath,
}

function pointsForCommand(state: PathState, item: SvgPathCommand): Point[] {
  return COMMAND_HANDLERS[item.command]?.(state, item) ?? []
}

export function commandsToPoints(commands: SvgPathCommand[]): Point[] {
  const state: PathState = {
    curr: point(0, 0),
    subpathStart: point(0, 0),
    lastCubicControl: null,
    lastQuadControl: null,
  }

  return commands.flatMap((command) => pointsForCommand(state, command))
}

export function stitchPathPointGroups(pathPointGroups: Point[][]): Point[] {
  const stitched: Point[] = []
  let lastPoint: Point | null = null

  for (const group of pathPointGroups) {
    const firstPoint = group[0]
    if (!firstPoint) continue

    let adjusted: Point[] = group
    if (lastPoint) {
      const offsetX = lastPoint.x - firstPoint.x
      const offsetY = lastPoint.y - firstPoint.y
      adjusted = group.map((item) => point(item.x + offsetX, item.y + offsetY))
    }

    stitched.push(...adjusted)
    lastPoint = adjusted.at(-1) ?? null
  }

  return stitched
}

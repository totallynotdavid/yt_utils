type Point = { x: number; y: number };

const COMMAND_ARGC: Record<string, number> = {
  A: 7,
  C: 6,
  H: 1,
  L: 2,
  M: 2,
  Q: 4,
  S: 4,
  T: 2,
  V: 1,
  Z: 0,
};

function extractPathDAttributes(svg: string): string[] {
  const out: string[] = [];
  const re = /<path\b[^>]*\bd=(['"])(.*?)\1/gi;
  let match: RegExpExecArray | null = null;

  while ((match = re.exec(svg)) !== null) {
    const pathData = match[2];
    if (typeof pathData !== "string") continue;
    const trimmed = pathData.trim();
    if (trimmed.length > 0) out.push(trimmed);
  }

  return out;
}

function tokenizePath(pathData: string): string[] {
  const tokens: string[] = [];
  const re = /([AaCcHhLlMmQqSsTtVvZz])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
  let match: RegExpExecArray | null = null;

  while ((match = re.exec(pathData)) !== null) {
    const command = match[1];
    const number = match[2];
    if (typeof command === "string") {
      tokens.push(command);
    } else if (typeof number === "string") {
      tokens.push(number);
    }
  }

  return tokens;
}

function sampleLine(from: Point, to: Point, steps = 2): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    points.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }
  return points;
}

function sampleCubic(from: Point, c1: Point, c2: Point, to: Point, steps = 8): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push({
      x: mt * mt * mt * from.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * to.x,
      y: mt * mt * mt * from.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * to.y,
    });
  }
  return points;
}

function sampleQuadratic(from: Point, c: Point, to: Point, steps = 8): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push({
      x: mt * mt * from.x + 2 * mt * t * c.x + t * t * to.x,
      y: mt * mt * from.y + 2 * mt * t * c.y + t * t * to.y,
    });
  }
  return points;
}

function readPair(values: number[]): [number, number] | null {
  const first = values[0];
  const second = values[1];
  if (first === undefined || second === undefined) return null;
  return [first, second];
}

function readSingle(values: number[]): [number] | null {
  const first = values[0];
  if (first === undefined) return null;
  return [first];
}

function readQuad(values: number[]): [number, number, number, number] | null {
  const first = values[0];
  const second = values[1];
  const third = values[2];
  const fourth = values[3];
  if (first === undefined || second === undefined || third === undefined || fourth === undefined) {
    return null;
  }
  return [first, second, third, fourth];
}

function readHexa(values: number[]): [number, number, number, number, number, number] | null {
  const first = values[0];
  const second = values[1];
  const third = values[2];
  const fourth = values[3];
  const fifth = values[4];
  const sixth = values[5];
  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined ||
    fifth === undefined ||
    sixth === undefined
  ) {
    return null;
  }
  return [first, second, third, fourth, fifth, sixth];
}

function readSept(
  values: number[],
): [number, number, number, number, number, number, number] | null {
  const first = values[0];
  const second = values[1];
  const third = values[2];
  const fourth = values[3];
  const fifth = values[4];
  const sixth = values[5];
  const seventh = values[6];
  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined ||
    fifth === undefined ||
    sixth === undefined ||
    seventh === undefined
  ) {
    return null;
  }
  return [first, second, third, fourth, fifth, sixth, seventh];
}

function parsePathToPoints(pathData: string): Point[] {
  const tokens = tokenizePath(pathData);
  const points: Point[] = [];
  let i = 0;
  let cmd = "";
  let curr: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  let lastCubicControl: Point | null = null;
  let lastQuadControl: Point | null = null;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token === undefined) break;

    if (/^[A-Za-z]$/.test(token)) {
      cmd = token;
      i += 1;
    }

    if (!cmd) break;

    const upper = cmd.toUpperCase();
    const isRel = cmd !== upper;
    const argc = COMMAND_ARGC[upper];
    if (argc === undefined) {
      i += 1;
      continue;
    }

    if (argc === 0) {
      if (upper === "Z") {
        points.push(...sampleLine(curr, subpathStart, 2));
        curr = { ...subpathStart };
      }
      lastCubicControl = null;
      lastQuadControl = null;
      continue;
    }

    while (i + argc - 1 < tokens.length) {
      const nextToken = tokens[i];
      if (nextToken === undefined || /^[A-Za-z]$/.test(nextToken)) break;

      const nums = tokens.slice(i, i + argc).map((value) => Number.parseFloat(value));
      if (nums.some((value) => Number.isNaN(value))) {
        i += argc;
        continue;
      }

      if (upper === "M") {
        const pair = readPair(nums);
        if (!pair) {
          i += argc;
          continue;
        }
        const [rawX, rawY] = pair;
        curr = { x: isRel ? curr.x + rawX : rawX, y: isRel ? curr.y + rawY : rawY };
        subpathStart = { ...curr };
        points.push({ ...curr });
        cmd = isRel ? "l" : "L";
      } else if (upper === "L") {
        const pair = readPair(nums);
        if (!pair) {
          i += argc;
          continue;
        }
        const [rawX, rawY] = pair;
        const next: Point = { x: isRel ? curr.x + rawX : rawX, y: isRel ? curr.y + rawY : rawY };
        points.push(...sampleLine(curr, next, 2));
        curr = next;
      } else if (upper === "H") {
        const single = readSingle(nums);
        if (!single) {
          i += argc;
          continue;
        }
        const [rawX] = single;
        const next: Point = { x: isRel ? curr.x + rawX : rawX, y: curr.y };
        points.push(...sampleLine(curr, next, 2));
        curr = next;
      } else if (upper === "V") {
        const single = readSingle(nums);
        if (!single) {
          i += argc;
          continue;
        }
        const [rawY] = single;
        const next: Point = { x: curr.x, y: isRel ? curr.y + rawY : rawY };
        points.push(...sampleLine(curr, next, 2));
        curr = next;
      } else if (upper === "C") {
        const quad = readHexa(nums);
        if (!quad) {
          i += argc;
          continue;
        }
        const [x1, y1, x2, y2, x3, y3] = quad;
        const c1: Point = { x: isRel ? curr.x + x1 : x1, y: isRel ? curr.y + y1 : y1 };
        const c2: Point = { x: isRel ? curr.x + x2 : x2, y: isRel ? curr.y + y2 : y2 };
        const next: Point = { x: isRel ? curr.x + x3 : x3, y: isRel ? curr.y + y3 : y3 };
        points.push(...sampleCubic(curr, c1, c2, next, 8));
        curr = next;
        lastCubicControl = c2;
        lastQuadControl = null;
      } else if (upper === "S") {
        const reflected = lastCubicControl
          ? { x: 2 * curr.x - lastCubicControl.x, y: 2 * curr.y - lastCubicControl.y }
          : { ...curr };
        const quad = readQuad(nums);
        if (!quad) {
          i += argc;
          continue;
        }
        const [x1, y1, x2, y2] = quad;
        const c2: Point = { x: isRel ? curr.x + x1 : x1, y: isRel ? curr.y + y1 : y1 };
        const next: Point = { x: isRel ? curr.x + x2 : x2, y: isRel ? curr.y + y2 : y2 };
        points.push(...sampleCubic(curr, reflected, c2, next, 8));
        curr = next;
        lastCubicControl = c2;
        lastQuadControl = null;
      } else if (upper === "Q") {
        const quad = readQuad(nums);
        if (!quad) {
          i += argc;
          continue;
        }
        const [x1, y1, x2, y2] = quad;
        const c: Point = { x: isRel ? curr.x + x1 : x1, y: isRel ? curr.y + y1 : y1 };
        const next: Point = { x: isRel ? curr.x + x2 : x2, y: isRel ? curr.y + y2 : y2 };
        points.push(...sampleQuadratic(curr, c, next, 8));
        curr = next;
        lastQuadControl = c;
        lastCubicControl = null;
      } else if (upper === "T") {
        const reflected: Point = lastQuadControl
          ? { x: 2 * curr.x - lastQuadControl.x, y: 2 * curr.y - lastQuadControl.y }
          : { ...curr };
        const pair = readPair(nums);
        if (!pair) {
          i += argc;
          continue;
        }
        const [rawX, rawY] = pair;
        const next: Point = { x: isRel ? curr.x + rawX : rawX, y: isRel ? curr.y + rawY : rawY };
        points.push(...sampleQuadratic(curr, reflected, next, 8));
        curr = next;
        lastQuadControl = reflected;
        lastCubicControl = null;
      } else if (upper === "A") {
        const sept = readSept(nums);
        if (!sept) {
          i += argc;
          continue;
        }
        const [, , , , , rawX, rawY] = sept;
        const next: Point = { x: isRel ? curr.x + rawX : rawX, y: isRel ? curr.y + rawY : rawY };
        points.push(...sampleLine(curr, next, 8));
        curr = next;
        lastCubicControl = null;
        lastQuadControl = null;
      }

      i += argc;
      const nextTokenAfterArgs = tokens[i];
      if (
        i >= tokens.length ||
        nextTokenAfterArgs === undefined ||
        /^[A-Za-z]$/.test(nextTokenAfterArgs)
      ) {
        break;
      }
    }
  }

  return points;
}

function stitchPaths(pathPointGroups: Point[][]): Point[] {
  const stitched: Point[] = [];
  let lastPoint: Point | null = null;

  for (const group of pathPointGroups) {
    if (group.length === 0) continue;
    const firstPoint = group[0];
    if (firstPoint === undefined) continue;

    let adjusted = group;
    if (lastPoint) {
      const dx = lastPoint.x - firstPoint.x;
      const dy = lastPoint.y - firstPoint.y;
      adjusted = group.map((point) => ({ x: point.x + dx, y: point.y + dy }));
    }

    stitched.push(...adjusted);
    lastPoint = adjusted.at(-1) ?? null;
  }

  return stitched;
}

export { extractPathDAttributes, parsePathToPoints, stitchPaths };

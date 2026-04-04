export function smooth(values: number[], radius = 2): number[] {
  if (values.length === 0) return [];
  const out = Array.from({ length: values.length }, () => 0);
  for (let i = 0; i < values.length; i += 1) {
    let total = 0;
    let count = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(values.length - 1, i + radius); j += 1) {
      const value = values[j];
      if (value === undefined) continue;
      total += value;
      count += 1;
    }
    out[i] = count > 0 ? total / count : 0;
  }
  return out;
}

export function movingAverage(values: number[], radius: number): number[] {
  if (values.length === 0) return [];
  const out = Array.from({ length: values.length }, () => 0);
  for (let i = 0; i < values.length; i += 1) {
    let sum = 0;
    let count = 0;
    const left = Math.max(0, i - radius);
    const right = Math.min(values.length - 1, i + radius);
    for (let j = left; j <= right; j += 1) {
      const value = values[j];
      if (value === undefined) continue;
      sum += value;
      count += 1;
    }
    out[i] = count > 0 ? sum / count : 0;
  }
  return out;
}

export function localProminence(values: number[], index: number): number {
  const score = values[index] ?? 0;
  let leftMin = score;
  let rightMin = score;

  for (let i = index; i >= 0; i -= 1) {
    const value = values[i];
    if (value === undefined) continue;
    if (value > score) break;
    leftMin = Math.min(leftMin, value);
  }

  for (let i = index; i < values.length; i += 1) {
    const value = values[i];
    if (value === undefined) continue;
    if (value > score) break;
    rightMin = Math.min(rightMin, value);
  }

  return Math.max(0, score - Math.max(leftMin, rightMin));
}

function digits(group: string | undefined): number {
  return group === undefined ? 0 : Number(group);
}

// Parse a duration string from command-line input into seconds.
// Accepted forms: "3600", "1h", "90m", "45s", "1h30m".
// Reject partial matches like "1h banana" or "1h2x".
export function parseDuration(input: string): number {
  const trimmed = input.trim();

  let total: number;
  if (/^\d+$/u.test(trimmed)) {
    total = Number(trimmed);
  } else {
    const match = /^(?:(\d+)\s*h)?(?:(\d+)\s*m)?(?:(\d+)\s*s)?$/iu.exec(trimmed);
    if (match === null) throw new Error(`could not read a duration from "${input}"`);
    total = digits(match[1]) * 3600 + digits(match[2]) * 60 + digits(match[3]);
  }

  if (total <= 0) throw new Error(`duration must be greater than zero: "${input}"`);
  return total;
}

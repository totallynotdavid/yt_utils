// Read a process stream line-by-line.
// Shared by yt-dlp and ffmpeg readers to handle partial buffered chunks.

export async function eachLine(
  stream: AsyncIterable<Uint8Array | string>,
  onLine: (line: string) => void
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ''
  for await (const bytes of stream) {
    buffer += typeof bytes === 'string' ? bytes : decoder.decode(bytes, { stream: true })
    let newline: number
    while ((newline = buffer.indexOf('\n')) !== -1) {
      onLine(buffer.slice(0, newline))
      buffer = buffer.slice(newline + 1)
    }
  }
  if (buffer.trim()) onLine(buffer)
}

export async function readText(stream: AsyncIterable<Uint8Array | string>): Promise<string> {
  const chunks: string[] = []
  await eachLine(stream, (line) => {
    chunks.push(line)
  })
  return chunks.join('\n')
}

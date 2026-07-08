// Read a process stream line-by-line.
// Shared by yt-dlp and ffmpeg readers to handle partial buffered chunks.

export async function eachLine(
  stream: ReadableStream<Uint8Array>,
  onLine: (line: string) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const bytes of stream) {
    buffer += decoder.decode(bytes, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      onLine(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
    }
  }
  if (buffer.trim()) onLine(buffer);
}

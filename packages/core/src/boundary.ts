import type { ExtractionStrategy, GetMostReplayedOptions } from "./types";

export type NormalizedGetMostReplayedOptions = {
  parts: number;
  strategy: ExtractionStrategy;
  allow_svg_fallback: boolean;
};

export function assertVideoId(videoId: string): void {
  if (!videoId || typeof videoId !== "string") {
    throw new Error("videoId must be a non-empty string");
  }
}

export function normalizeGetMostReplayedOptions(
  options: GetMostReplayedOptions | undefined,
): NormalizedGetMostReplayedOptions {
  const parts = options?.parts ?? 3;
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new Error("parts must be a positive integer");
  }

  const strategy = options?.strategy ?? "auto";
  if (strategy !== "auto" && strategy !== "json" && strategy !== "svg") {
    throw new Error("strategy must be one of: auto, json, svg");
  }

  return {
    parts,
    strategy,
    allow_svg_fallback: options?.allow_svg_fallback ?? false,
  };
}

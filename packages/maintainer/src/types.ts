import type { ComparisonSummary } from "./compare_heatmap";

export type DiagnosticsResult = {
  durationSec: number | null;
  jsonMarkersCount: number;
  svgMarkersCount: number;
  sourceUsed: "json" | "svg";
};

export type JsonExtractorComparisonResult = {
  videoId: string;
  currentCount: number;
  fastCount: number;
  exactMatch: boolean;
  onlyCurrentCount: number;
  onlyFastCount: number;
};

export type FallbackReliabilityResult = {
  videoId: string;
  durationSec: number;
  jsonMarkersCount: number;
  svgMarkersCount: number;
  comparison: ComparisonSummary;
  segmentAgreement: {
    jsonSegments: Array<{ start: number; end: number }>;
    svgSegments: Array<{ start: number; end: number }>;
    overlapRatio: number;
  };
};

export type BatchFallbackReliabilityResult = {
  rootDir: string;
  totalSnapshots: number;
  results: FallbackReliabilityResult[];
  aggregate: {
    meanOfMeanDelta: number;
    meanOfRmseDelta: number;
    meanOfP95Delta: number;
    maxOfMaxDelta: number;
    meanSegmentOverlapRatio: number;
    lowReliabilityVideos: string[];
  };
};

export type SnapshotCaptureResult = {
  videoId: string;
  snapshotDir: string;
  htmlPath: string;
  svgPath: string;
  metaPath: string;
};

export type ReliabilityGateThresholds = {
  maxMeanRmseDelta: number;
  maxMeanP95Delta: number;
  minMeanSegmentOverlapRatio: number;
  maxPerVideoRmseDelta: number;
  maxPerVideoDeltaAbove020Ratio: number;
  minPerVideoSegmentOverlapRatio: number;
};

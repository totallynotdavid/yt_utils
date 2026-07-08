import { test, expect } from "vitest";

import { parseDuration } from "../src/duration.ts";
import { formatMB, formatDuration, estimateChunks } from "../src/format.ts";

test("parseDuration accepts plain seconds and units", () => {
  expect(parseDuration("3600")).toBe(3600);
  expect(parseDuration("1h")).toBe(3600);
  expect(parseDuration("30m")).toBe(1800);
  expect(parseDuration("45s")).toBe(45);
  expect(parseDuration("1h30m")).toBe(5400);
});

test("parseDuration rejects garbage", () => {
  expect(() => parseDuration("banana")).toThrow();
});

test("parseDuration rejects partially-valid input instead of silently truncating", () => {
  expect(() => parseDuration("1h banana")).toThrow();
  expect(() => parseDuration("1h2x")).toThrow();
  expect(() => parseDuration("")).toThrow();
});

test("parseDuration rejects a zero-length duration", () => {
  expect(() => parseDuration("0s")).toThrow();
  expect(() => parseDuration("0")).toThrow();
});

test("formatMB / formatDuration", () => {
  expect(formatMB(482 * 1024 * 1024)).toBe("482.0 MB");
  expect(formatDuration(0)).toBe("00:00:00");
  expect(formatDuration(3661)).toBe("01:01:01");
});

test("estimateChunks rounds up and never returns zero", () => {
  expect(estimateChunks(6830, 3600)).toBe(2);
  expect(estimateChunks(10, 3600)).toBe(1);
});

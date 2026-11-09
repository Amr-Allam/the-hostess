import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dayCount,
  eachDate,
  isValidDate,
  nowMinutes,
  toMinutes,
  toTimeString,
  todayInTimezone,
  weekdayName,
} from "../src/utils/time.js";

describe("time helpers", () => {
  it("converts HH:mm to minutes and back", () => {
    assert.equal(toMinutes("00:00"), 0);
    assert.equal(toMinutes("21:30"), 1290);
    assert.equal(toTimeString(0), "00:00");
    assert.equal(toTimeString(1290), "21:30");
    assert.equal(toTimeString(toMinutes("09:05")), "09:05");
  });

  it("validates real calendar dates only", () => {
    assert.ok(isValidDate("2026-11-08"));
    assert.ok(isValidDate("2028-02-29"));
    assert.ok(!isValidDate("2026-02-30"));
    assert.ok(!isValidDate("2027-02-29"));
    assert.ok(!isValidDate("2026-13-01"));
    assert.ok(!isValidDate("2026-1-5"));
    assert.ok(!isValidDate("not a date"));
  });

  it("finds the weekday of a plain date", () => {
    assert.equal(weekdayName("2026-11-08"), "sunday");
    assert.equal(weekdayName("2026-11-09"), "monday");
  });

  it("counts days inclusively and lists them", () => {
    assert.equal(dayCount("2026-11-08", "2026-11-08"), 1);
    assert.equal(dayCount("2026-11-08", "2026-11-14"), 7);
    assert.deepEqual(eachDate("2026-02-27", "2026-03-02"), [
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("reads today and the time in the restaurant's timezone", () => {
    // 22:30 UTC is already 00:30 the next day in Cairo (UTC+2 in November).
    const now = new Date("2026-11-08T22:30:00Z");
    assert.equal(todayInTimezone("Africa/Cairo", now), "2026-11-09");
    assert.equal(nowMinutes("Africa/Cairo", now), 30);
    assert.equal(todayInTimezone("UTC", now), "2026-11-08");
    assert.equal(nowMinutes("UTC", now), 22 * 60 + 30);
  });
});

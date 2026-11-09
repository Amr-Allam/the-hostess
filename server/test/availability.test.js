import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generateSlots,
  listSlots,
  pickTable,
} from "../src/services/availability.js";

const open = { open: "10:00", close: "23:00", closed: false };
const at = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

describe("generateSlots", () => {
  it("offers slots from opening until the last one that still fits", () => {
    const slots = generateSlots(open, 30, 90);
    assert.equal(slots[0], at("10:00"));
    assert.equal(slots.at(-1), at("21:30")); // 21:30 + 90 min = 23:00
    assert.equal(slots.length, 24);
  });

  it("does not offer a slot that would end after closing", () => {
    const slots = generateSlots(open, 30, 90);
    assert.ok(!slots.includes(at("22:00")));
  });

  it("offers a single slot when the duration exactly fills the day", () => {
    const day = { open: "10:00", close: "11:30", closed: false };
    assert.deepEqual(generateSlots(day, 30, 90), [at("10:00")]);
  });

  it("offers nothing when the duration is longer than opening hours", () => {
    const day = { open: "10:00", close: "11:00", closed: false };
    assert.deepEqual(generateSlots(day, 30, 90), []);
  });

  it("offers nothing on a closed day or without hours", () => {
    assert.deepEqual(generateSlots({ ...open, closed: true }, 30, 90), []);
    assert.deepEqual(generateSlots(undefined, 30, 90), []);
  });

  it("follows the slot length", () => {
    const slots = generateSlots(open, 60, 60);
    assert.equal(slots[1] - slots[0], 60);
  });
});

describe("pickTable", () => {
  const tables = [
    { _id: "t5", number: 5, capacity: 6 },
    { _id: "t1", number: 1, capacity: 2 },
    { _id: "t3", number: 3, capacity: 4 },
    { _id: "t4", number: 4, capacity: 4 },
  ];
  const start = at("19:00");
  const end = at("20:30");
  const booking = (table, from, to) => ({
    table,
    startMinutes: at(from),
    endMinutes: at(to),
  });

  it("picks the smallest table that fits the party", () => {
    assert.equal(pickTable(tables, [], 2, start, end).number, 1);
    assert.equal(pickTable(tables, [], 3, start, end).capacity, 4);
    assert.equal(pickTable(tables, [], 5, start, end).number, 5);
  });

  it("breaks capacity ties by the lowest table number", () => {
    assert.equal(pickTable(tables, [], 4, start, end).number, 3);
  });

  it("returns null when no table is large enough", () => {
    assert.equal(pickTable(tables, [], 7, start, end), null);
  });

  it("skips a table with an overlapping reservation", () => {
    const taken = [booking("t1", "19:30", "21:00")];
    assert.equal(pickTable(tables, taken, 2, start, end).number, 3);
  });

  it("detects overlap on either side and when one range contains the other", () => {
    for (const [from, to] of [
      ["18:00", "19:30"], // starts before, ends inside
      ["20:00", "21:30"], // starts inside, ends after
      ["18:00", "22:00"], // contains the new range
      ["19:15", "20:00"], // inside the new range
    ]) {
      const result = pickTable(
        tables,
        [booking("t1", from, to)],
        2,
        start,
        end,
      );
      assert.equal(result.number, 3, `${from}-${to} should block table 1`);
    }
  });

  it("allows back-to-back bookings (end equals start)", () => {
    const before = [booking("t1", "17:30", "19:00")];
    const after = [booking("t1", "20:30", "22:00")];
    assert.equal(pickTable(tables, before, 2, start, end).number, 1);
    assert.equal(pickTable(tables, after, 2, start, end).number, 1);
  });

  it("ignores reservations on other tables", () => {
    const taken = [booking("t3", "19:00", "20:30")];
    assert.equal(pickTable(tables, taken, 2, start, end).number, 1);
  });

  it("returns null when every fitting table is taken", () => {
    const taken = [
      booking("t3", "19:00", "20:30"),
      booking("t4", "19:00", "20:30"),
      booking("t5", "19:00", "20:30"),
    ];
    assert.equal(pickTable(tables, taken, 3, start, end), null);
  });

  it("matches tables whose ids are objects", () => {
    const objectId = { toString: () => "abc123" };
    const oneTable = [{ _id: objectId, number: 1, capacity: 2 }];
    const taken = [{ table: "abc123", startMinutes: start, endMinutes: end }];
    assert.equal(pickTable(oneTable, taken, 2, start, end), null);
  });
});

describe("listSlots", () => {
  const tables = [{ _id: "t1", number: 1, capacity: 2 }];
  const base = {
    dayHours: { open: "10:00", close: "13:00", closed: false },
    slotLengthMinutes: 30,
    durationMinutes: 90,
    tables,
    reservations: [],
    partySize: 2,
  };

  it("returns every slot as available on an empty day", () => {
    const slots = listSlots(base);
    assert.deepEqual(
      slots.map((s) => s.startTime),
      ["10:00", "10:30", "11:00", "11:30"],
    );
    assert.ok(slots.every((s) => s.available));
  });

  it("returns nothing on a closed day", () => {
    const slots = listSlots({
      ...base,
      dayHours: { ...base.dayHours, closed: true },
    });
    assert.deepEqual(slots, []);
  });

  it("marks slots that overlap a booking as unavailable", () => {
    const reservations = [
      { table: "t1", startMinutes: at("10:00"), endMinutes: at("11:30") },
    ];
    const slots = listSlots({ ...base, reservations });
    assert.deepEqual(
      slots.map((s) => s.available),
      [false, false, false, true], // 11:30 starts exactly when the booking ends
    );
  });

  it("marks every slot unavailable when the party is too large", () => {
    const slots = listSlots({ ...base, partySize: 3 });
    assert.ok(slots.every((s) => !s.available));
  });

  it("marks slots that have already started as unavailable today", () => {
    const slots = listSlots({ ...base, nowMinutes: at("10:30") });
    assert.deepEqual(
      slots.map((s) => s.available),
      [false, false, true, true], // a slot starting exactly now is past
    );
  });

  it("ignores the clock when nowMinutes is null (a future date)", () => {
    const slots = listSlots({ ...base, nowMinutes: null });
    assert.ok(slots.every((s) => s.available));
  });
});

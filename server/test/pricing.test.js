import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { priceOrder } from "../src/services/pricing.js";

// Builds a menu item the way MongoDB returns it (plain object).
function menuItem(overrides = {}) {
  return {
    _id: "item1",
    name: "Pizza",
    price: 10000,
    available: true,
    optionGroups: [],
    ...overrides,
  };
}

const sizeGroup = {
  name: "Size",
  type: "single",
  required: true,
  choices: [
    { name: "Regular", priceDelta: 0 },
    { name: "Large", priceDelta: 1500 },
    { name: "Mini", priceDelta: -2000 },
  ],
};

const extrasGroup = {
  name: "Extras",
  type: "multiple",
  required: false,
  choices: [
    { name: "Cheese", priceDelta: 2500 },
    { name: "Mushrooms", priceDelta: 2000 },
  ],
};

const menu = (...items) => new Map(items.map((m) => [String(m._id), m]));

function line(overrides = {}) {
  return {
    menuItemId: "item1",
    quantity: 1,
    note: "",
    selectedOptions: [],
    ...overrides,
  };
}

// Runs priceOrder and returns the thrown error (fails if nothing is thrown).
function priceError(menuById, items) {
  try {
    priceOrder(menuById, items);
  } catch (err) {
    return err;
  }
  assert.fail("expected priceOrder to throw");
}

describe("priceOrder: totals", () => {
  it("prices an item with no options", () => {
    const { lines, total } = priceOrder(menu(menuItem()), [line()]);
    assert.equal(lines[0].unitPrice, 10000);
    assert.equal(total, 10000);
  });

  it("multiplies unit price by quantity", () => {
    const { total } = priceOrder(menu(menuItem()), [line({ quantity: 3 })]);
    assert.equal(total, 30000);
  });

  it("adds option price changes to the unit price", () => {
    const item = menuItem({ optionGroups: [sizeGroup, extrasGroup] });
    const { lines, total } = priceOrder(menu(item), [
      line({
        quantity: 2,
        selectedOptions: [
          { groupName: "Size", choiceName: "Large" },
          { groupName: "Extras", choiceName: "Cheese" },
          { groupName: "Extras", choiceName: "Mushrooms" },
        ],
      }),
    ]);
    assert.equal(lines[0].unitPrice, 10000 + 1500 + 2500 + 2000);
    assert.equal(total, 16000 * 2);
  });

  it("applies a negative price change", () => {
    const item = menuItem({ optionGroups: [sizeGroup] });
    const { lines } = priceOrder(menu(item), [
      line({ selectedOptions: [{ groupName: "Size", choiceName: "Mini" }] }),
    ]);
    assert.equal(lines[0].unitPrice, 8000);
  });

  it("sums several lines, including the same item twice", () => {
    const drink = menuItem({ _id: "item2", name: "Juice", price: 5500 });
    const { lines, total } = priceOrder(menu(menuItem(), drink), [
      line({ quantity: 2 }),
      line({ menuItemId: "item2", quantity: 1 }),
      line({ quantity: 1 }),
    ]);
    assert.equal(lines.length, 3);
    assert.equal(total, 20000 + 5500 + 10000);
  });
});

describe("priceOrder: snapshot", () => {
  it("copies name, prices, options and note into the line", () => {
    const item = menuItem({ optionGroups: [sizeGroup] });
    const { lines } = priceOrder(menu(item), [
      line({
        note: "no onions",
        selectedOptions: [{ groupName: "Size", choiceName: "Large" }],
      }),
    ]);
    assert.deepEqual(lines[0], {
      menuItem: "item1",
      name: "Pizza",
      unitPrice: 11500,
      quantity: 1,
      selectedOptions: [
        { groupName: "Size", choiceName: "Large", priceDelta: 1500 },
      ],
      note: "no onions",
    });
  });

  it("takes option prices from the menu, never from the request", () => {
    const item = menuItem({ optionGroups: [sizeGroup] });
    const { lines } = priceOrder(menu(item), [
      line({
        selectedOptions: [
          { groupName: "Size", choiceName: "Large", priceDelta: -9999 },
        ],
      }),
    ]);
    assert.equal(lines[0].selectedOptions[0].priceDelta, 1500);
    assert.equal(lines[0].unitPrice, 11500);
  });
});

describe("priceOrder: rejected orders", () => {
  it("rejects an item that no longer exists", () => {
    const err = priceError(menu(menuItem()), [line({ menuItemId: "gone" })]);
    assert.equal(err.status, 400);
    assert.deepEqual(err.details, [
      {
        path: "body.items.0.menuItemId",
        message: "An item in your cart no longer exists",
      },
    ]);
  });

  it("rejects an unavailable item", () => {
    const err = priceError(menu(menuItem({ available: false })), [line()]);
    assert.equal(err.status, 400);
    assert.equal(err.details[0].message, "Pizza is not available right now");
  });

  it("rejects an option group that does not exist", () => {
    const err = priceError(menu(menuItem({ optionGroups: [sizeGroup] })), [
      line({ selectedOptions: [{ groupName: "Sauce", choiceName: "BBQ" }] }),
    ]);
    assert.match(err.details[0].message, /Sauce: "BBQ" is not a valid option/);
  });

  it("rejects a choice that does not exist in the group", () => {
    const err = priceError(menu(menuItem({ optionGroups: [sizeGroup] })), [
      line({ selectedOptions: [{ groupName: "Size", choiceName: "Huge" }] }),
    ]);
    assert.match(err.details[0].message, /Size: "Huge" is not a valid option/);
  });

  it("rejects the same choice selected twice", () => {
    const err = priceError(menu(menuItem({ optionGroups: [extrasGroup] })), [
      line({
        selectedOptions: [
          { groupName: "Extras", choiceName: "Cheese" },
          { groupName: "Extras", choiceName: "Cheese" },
        ],
      }),
    ]);
    assert.match(err.details[0].message, /Extras: "Cheese" was selected twice/);
  });

  it("rejects two choices in a single-choice group", () => {
    const err = priceError(menu(menuItem({ optionGroups: [sizeGroup] })), [
      line({
        selectedOptions: [
          { groupName: "Size", choiceName: "Regular" },
          { groupName: "Size", choiceName: "Large" },
        ],
      }),
    ]);
    assert.match(err.details[0].message, /Size: choose only one/);
  });

  it("allows several choices in a multiple-choice group", () => {
    const item = menuItem({ optionGroups: [extrasGroup] });
    assert.doesNotThrow(() =>
      priceOrder(menu(item), [
        line({
          selectedOptions: [
            { groupName: "Extras", choiceName: "Cheese" },
            { groupName: "Extras", choiceName: "Mushrooms" },
          ],
        }),
      ]),
    );
  });

  it("rejects a missing required group", () => {
    const err = priceError(menu(menuItem({ optionGroups: [sizeGroup] })), [
      line(),
    ]);
    assert.match(err.details[0].message, /Size: please choose an option/);
  });

  it("accepts a missing optional group", () => {
    const item = menuItem({ optionGroups: [extrasGroup] });
    assert.doesNotThrow(() => priceOrder(menu(item), [line()]));
  });

  it("rejects a negative unit price", () => {
    const item = menuItem({ price: 1000, optionGroups: [sizeGroup] });
    const err = priceError(menu(item), [
      line({ selectedOptions: [{ groupName: "Size", choiceName: "Mini" }] }),
    ]);
    assert.match(err.details[0].message, /the price cannot be negative/);
  });

  it("reports every problem across all lines at once", () => {
    const sized = menuItem({
      _id: "item2",
      name: "Pasta",
      optionGroups: [sizeGroup],
    });
    const err = priceError(menu(menuItem({ available: false }), sized), [
      line(),
      line({ menuItemId: "item2" }),
      line({ menuItemId: "gone" }),
    ]);
    assert.equal(err.status, 400);
    assert.deepEqual(
      err.details.map((d) => d.path),
      [
        "body.items.0.menuItemId",
        "body.items.1.selectedOptions",
        "body.items.2.menuItemId",
      ],
    );
  });

  it("reports several problems on one line", () => {
    const item = menuItem({
      optionGroups: [sizeGroup, { ...extrasGroup, required: true }],
    });
    const err = priceError(menu(item), [line()]);
    assert.equal(err.details.length, 2);
  });
});

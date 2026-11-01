import { httpError } from "../utils/httpError.js";

// Pure function: no database access, so it is easy to unit test (Phase 7).
// menuItemsById: Map of id string -> menu item (plain object).
// items: validated order lines from the request body.
// Returns { lines, total } ready to store, or throws a 400 listing every problem.
export function priceOrder(menuItemsById, items) {
  const details = [];
  const lines = [];

  items.forEach((item, index) => {
    const path = `body.items.${index}`;
    const menuItem = menuItemsById.get(item.menuItemId);

    if (!menuItem) {
      details.push({
        path: `${path}.menuItemId`,
        message: "An item in your cart no longer exists",
      });
      return;
    }
    if (!menuItem.available) {
      details.push({
        path: `${path}.menuItemId`,
        message: `${menuItem.name} is not available right now`,
      });
      return;
    }

    const problems = [];
    const picked = [];
    const seen = new Set();

    for (const option of item.selectedOptions) {
      const group = menuItem.optionGroups.find(
        (g) => g.name === option.groupName,
      );
      const choice = group?.choices.find((c) => c.name === option.choiceName);
      if (!group || !choice) {
        problems.push(
          `${option.groupName}: "${option.choiceName}" is not a valid option`,
        );
        continue;
      }
      const pair = `${group.name}\u0000${choice.name}`;
      if (seen.has(pair)) {
        problems.push(`${group.name}: "${choice.name}" was selected twice`);
        continue;
      }
      seen.add(pair);
      picked.push({
        groupName: group.name,
        choiceName: choice.name,
        priceDelta: choice.priceDelta,
      });
    }

    for (const group of menuItem.optionGroups) {
      const count = picked.filter((p) => p.groupName === group.name).length;
      if (group.type === "single" && count > 1) {
        problems.push(`${group.name}: choose only one`);
      }
      if (group.required && count === 0) {
        problems.push(`${group.name}: please choose an option`);
      }
    }

    const unitPrice =
      menuItem.price + picked.reduce((sum, p) => sum + p.priceDelta, 0);
    if (problems.length === 0 && unitPrice < 0) {
      problems.push("the price cannot be negative");
    }

    if (problems.length > 0) {
      for (const problem of problems) {
        details.push({
          path: `${path}.selectedOptions`,
          message: `${menuItem.name}: ${problem}`,
        });
      }
      return;
    }

    lines.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      unitPrice,
      quantity: item.quantity,
      selectedOptions: picked,
      note: item.note,
    });
  });

  if (details.length > 0) {
    throw httpError(400, "Order could not be priced", details);
  }

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  return { lines, total };
}

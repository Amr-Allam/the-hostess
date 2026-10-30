import Category from "../models/Category.js";
import MenuItem from "../models/MenuItem.js";
import { httpError } from "../utils/httpError.js";

const UPDATE_OPTIONS = { returnDocument: "after", runValidators: true };

// Public menu: categories in display order, each with its available items.
export async function getPublicMenu() {
  const [categories, items] = await Promise.all([
    Category.find().sort({ order: 1, _id: 1 }).lean(),
    MenuItem.find({ available: true }).sort({ _id: 1 }).lean(),
  ]);

  return categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.category.equals(category._id)),
  }));
}

export function createCategory(data) {
  return Category.create(data);
}

export async function updateCategory(id, data) {
  const category = await Category.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!category) throw httpError(404, "Category not found");
  return category;
}

export async function deleteCategory(id) {
  if (await MenuItem.exists({ category: id })) {
    throw httpError(409, "Category still has menu items");
  }
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw httpError(404, "Category not found");
}

async function assertCategoryExists(id) {
  if (!(await Category.exists({ _id: id }))) {
    throw httpError(400, "Category does not exist", [
      { path: "body.category", message: "Category does not exist" },
    ]);
  }
}

export function listMenuItems() {
  return MenuItem.find().sort({ _id: 1 });
}

export async function createMenuItem(data) {
  await assertCategoryExists(data.category);
  return MenuItem.create(data);
}

export async function updateMenuItem(id, data) {
  await assertCategoryExists(data.category);
  const item = await MenuItem.findByIdAndUpdate(id, data, UPDATE_OPTIONS);
  if (!item) throw httpError(404, "Menu item not found");
  return item;
}

export async function deleteMenuItem(id) {
  const item = await MenuItem.findByIdAndDelete(id);
  if (!item) throw httpError(404, "Menu item not found");
}

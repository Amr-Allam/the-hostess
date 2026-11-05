import { useEffect, useState } from "react";
import { errorMessage } from "../../api/client.js";
import { getMenu } from "../../api/menu.js";
import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  listMenuItems,
  updateCategory,
  updateMenuItem,
  uploadMenuImage,
} from "../../api/owner.js";
import { formatPrice, formatPriceInput, parsePriceInput } from "../../lib/format.js";
import { useAuth } from "./useAuth.js";

const inputClass = "mt-1 w-full rounded border border-stone-300 px-3 py-2";

function parseOrder(value) {
  const trimmed = String(value).trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function categoryName(categories, id) {
  return categories.find((category) => category._id === id)?.name ?? "Unknown";
}

function emptyItem(categories) {
  return {
    name: "",
    description: "",
    priceInput: "",
    imageUrl: "",
    category: categories[0]?._id ?? "",
    available: true,
    optionGroups: [],
  };
}

function itemToForm(item) {
  return {
    name: item.name,
    description: item.description ?? "",
    priceInput: formatPriceInput(item.price),
    imageUrl: item.imageUrl ?? "",
    category: item.category,
    available: item.available,
    optionGroups: item.optionGroups.map((group) => ({
      name: group.name,
      type: group.type,
      required: group.required,
      choices: group.choices.map((choice) => ({
        name: choice.name,
        deltaInput: formatPriceInput(choice.priceDelta),
      })),
    })),
  };
}

function validateItem(form) {
  const errors = [];
  const name = form.name.trim();
  if (!name) errors.push("Enter an item name.");
  const price = parsePriceInput(form.priceInput);
  if (price === null || price < 0) {
    errors.push("Enter a price with at most two decimal places.");
  }
  if (!form.category) errors.push("Choose a category.");

  const groupNames = [];
  const optionGroups = form.optionGroups.map((group) => {
    const groupName = group.name.trim();
    if (!groupName) errors.push("Every option group needs a name.");
    groupNames.push(groupName.toLowerCase());

    const choiceNames = [];
    const choices = group.choices.map((choice) => {
      const choiceName = choice.name.trim();
      if (!choiceName) errors.push(`Add a choice name in "${groupName || "a group"}".`);
      choiceNames.push(choiceName.toLowerCase());
      const delta =
        choice.deltaInput.trim() === "" ? 0 : parsePriceInput(choice.deltaInput);
      if (delta === null) {
        errors.push(`"${choiceName || "A choice"}" needs a price change with at most two decimals.`);
      }
      return { name: choiceName, priceDelta: delta ?? 0 };
    });

    if (choices.length === 0) {
      errors.push(`"${groupName || "A group"}" needs at least one choice.`);
    }
    if (new Set(choiceNames.filter(Boolean)).size !== choiceNames.filter(Boolean).length) {
      errors.push("Choice names must be unique within a group.");
    }
    return {
      name: groupName,
      type: group.type,
      required: group.required,
      choices,
    };
  });

  if (new Set(groupNames.filter(Boolean)).size !== groupNames.filter(Boolean).length) {
    errors.push("Option group names must be unique within an item.");
  }

  return {
    errors,
    body: {
      name,
      description: form.description.trim(),
      price: price ?? 0,
      imageUrl: form.imageUrl,
      category: form.category,
      available: form.available,
      optionGroups,
    },
  };
}

function ItemForm({ initial, categories, token, onCancel, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function updateGroup(index, patch) {
    setForm((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group, i) =>
        i === index ? { ...group, ...patch } : group,
      ),
    }));
  }

  function updateChoice(groupIndex, choiceIndex, patch) {
    setForm((current) => ({
      ...current,
      optionGroups: current.optionGroups.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              choices: group.choices.map((choice, j) =>
                j === choiceIndex ? { ...choice, ...patch } : choice,
              ),
            }
          : group,
      ),
    }));
  }

  async function handleImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadMenuImage(token, file);
      setForm((current) => ({ ...current, imageUrl: url }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { errors, body } = validateItem(form);
    if (errors.length > 0) {
      setError(errors.join(" "));
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (initial._id) await updateMenuItem(token, initial._id, body);
      else await createMenuItem(token, body);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-stone-200 p-4">
      <h3 className="font-medium">{initial._id ? "Edit item" : "New item"}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <label className="block text-sm">
        Name
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputClass}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Price
          <input
            required
            inputMode="decimal"
            value={form.priceInput}
            onChange={(e) => setForm({ ...form, priceInput: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Category
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={inputClass}
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.available}
          onChange={(e) => setForm({ ...form, available: e.target.checked })}
        />
        Available on the menu
      </label>

      <div className="space-y-2 text-sm">
        <p>Photo</p>
        {form.imageUrl && (
          <img
            src={form.imageUrl}
            alt=""
            className="h-24 w-24 rounded object-cover"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImage}
          disabled={uploading}
        />
        {form.imageUrl && (
          <button
            type="button"
            onClick={() => setForm({ ...form, imageUrl: "" })}
            className="block text-red-700"
          >
            Remove photo
          </button>
        )}
        {uploading && <p className="text-stone-500">Uploading…</p>}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Option groups</h4>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                optionGroups: [
                  ...form.optionGroups,
                  {
                    name: "",
                    type: "single",
                    required: false,
                    choices: [{ name: "", deltaInput: "0.00" }],
                  },
                ],
              })
            }
            className="text-sm text-amber-800"
          >
            Add group
          </button>
        </div>
        {form.optionGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2 rounded border border-stone-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Group name
                <input
                  value={group.name}
                  onChange={(e) => updateGroup(groupIndex, { name: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="text-sm">
                Choose
                <select
                  value={group.type}
                  onChange={(e) => updateGroup(groupIndex, { type: e.target.value })}
                  className={inputClass}
                >
                  <option value="single">One choice</option>
                  <option value="multiple">Several choices</option>
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={group.required}
                onChange={(e) => updateGroup(groupIndex, { required: e.target.checked })}
              />
              Required
            </label>
            {group.choices.map((choice, choiceIndex) => (
              <div key={choiceIndex} className="flex flex-wrap items-end gap-2">
                <label className="min-w-32 flex-1 text-sm">
                  Choice
                  <input
                    value={choice.name}
                    onChange={(e) =>
                      updateChoice(groupIndex, choiceIndex, { name: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="w-28 text-sm">
                  Price change
                  <input
                    inputMode="decimal"
                    value={choice.deltaInput}
                    onChange={(e) =>
                      updateChoice(groupIndex, choiceIndex, {
                        deltaInput: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateGroup(groupIndex, {
                      choices: group.choices.filter((_, i) => i !== choiceIndex),
                    })
                  }
                  className="pb-2 text-sm text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                onClick={() =>
                  updateGroup(groupIndex, {
                    choices: [...group.choices, { name: "", deltaInput: "0.00" }],
                  })
                }
                className="text-amber-800"
              >
                Add choice
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    optionGroups: form.optionGroups.filter((_, i) => i !== groupIndex),
                  })
                }
                className="text-red-700"
              >
                Remove group
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded bg-stone-800 px-3 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save item"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-stone-300 px-3 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function MenuSection() {
  const { token } = useAuth();
  const [categories, setCategories] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [categoryForm, setCategoryForm] = useState({ name: "", order: "0" });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [itemDraft, setItemDraft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMenu(), listMenuItems(token)])
      .then(([menu, menuItems]) => {
        if (cancelled) return;
        setCategories(menu.map(({ _id, name, order }) => ({ _id, name, order })));
        setItems(menuItems);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setCategories(null);
        setItems(null);
        setError(errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token, reload]);

  function resetCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm({ name: "", order: "0" });
  }

  async function handleCategorySubmit(e) {
    e.preventDefault();
    const name = categoryForm.name.trim();
    const order = parseOrder(categoryForm.order);
    if (!name) {
      setError("Enter a category name.");
      return;
    }
    if (order === null) {
      setError("Sort order must be a whole number.");
      return;
    }
    setSavingCategory(true);
    setError("");
    try {
      if (editingCategoryId) {
        await updateCategory(token, editingCategoryId, { name, order });
      } else {
        await createCategory(token, { name, order });
      }
      resetCategoryForm();
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    setError("");
    try {
      await deleteCategory(token, category._id);
      if (editingCategoryId === category._id) resetCategoryForm();
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function handleDeleteItem(item) {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    setError("");
    try {
      await deleteMenuItem(token, item._id);
      if (itemDraft?._id === item._id) setItemDraft(null);
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const sortedItems = items
    ? [...items].sort((a, b) => {
        const orderA = categories.find((c) => c._id === a.category)?.order ?? 0;
        const orderB = categories.find((c) => c._id === b.category)?.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      })
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Menu</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="space-y-3">
        <h3 className="font-medium">Categories</h3>
        <form
          onSubmit={handleCategorySubmit}
          className="grid max-w-lg gap-3 rounded border border-stone-200 p-4 sm:grid-cols-[1fr_6rem_auto]"
        >
          <label className="text-sm">
            Name
            <input
              required
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, name: e.target.value })
              }
              className={inputClass}
            />
          </label>
          <label className="text-sm">
            Order
            <input
              required
              inputMode="numeric"
              value={categoryForm.order}
              onChange={(e) =>
                setCategoryForm({ ...categoryForm, order: e.target.value })
              }
              className={inputClass}
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={savingCategory}
              className="rounded bg-stone-800 px-3 py-2 text-sm text-white disabled:opacity-60"
            >
              {savingCategory ? "Saving…" : editingCategoryId ? "Save" : "Add"}
            </button>
            {editingCategoryId && (
              <button
                type="button"
                onClick={resetCategoryForm}
                className="rounded border border-stone-300 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {categories === null ? (
          !error && <p className="text-stone-500">Loading menu…</p>
        ) : categories.length === 0 ? (
          <p className="text-stone-500">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded border border-stone-200">
            {categories.map((category) => (
              <li
                key={category._id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <p>
                  {category.name}{" "}
                  <span className="text-sm text-stone-500">order {category.order}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(category._id);
                      setCategoryForm({
                        name: category.name,
                        order: String(category.order),
                      });
                    }}
                    className="text-sm text-amber-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className="text-sm text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Items</h3>
          <button
            type="button"
            disabled={!categories?.length}
            onClick={() => setItemDraft(emptyItem(categories))}
            className="rounded bg-stone-800 px-3 py-1.5 text-sm text-white disabled:opacity-60"
          >
            New item
          </button>
        </div>

        {itemDraft && categories && (
          <ItemForm
            key={itemDraft._id ?? "new"}
            initial={itemDraft}
            categories={categories}
            token={token}
            onCancel={() => setItemDraft(null)}
            onSaved={() => {
              setItemDraft(null);
              setReload((n) => n + 1);
            }}
          />
        )}

        {sortedItems === null ? (
          !error && <p className="text-stone-500">Loading items…</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-stone-500">No items yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded border border-stone-200">
            {sortedItems.map((item) => (
              <li
                key={item._id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                    />
                  ) : (
                    <span className="h-12 w-12 rounded bg-stone-100" />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-stone-500">
                      {categoryName(categories ?? [], item.category)} ·{" "}
                      {formatPrice(item.price)} ·{" "}
                      {item.available ? "Available" : "Hidden"}
                      {item.optionGroups.length > 0 &&
                        ` · ${item.optionGroups.length} option ${
                          item.optionGroups.length === 1 ? "group" : "groups"
                        }`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setItemDraft({ _id: item._id, ...itemToForm(item) })}
                    className="text-sm text-amber-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="text-sm text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

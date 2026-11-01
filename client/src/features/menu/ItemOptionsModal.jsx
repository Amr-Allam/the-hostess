import { useEffect, useState } from "react";
import { formatPrice, formatPriceDelta } from "../../lib/format.js";
import { MAX_QUANTITY, useCartStore } from "../../store/cartStore.js";

export default function ItemOptionsModal({ item, onClose }) {
  // { [groupName]: [selected choice names] }
  const [selected, setSelected] = useState({});
  const [quantity, setQuantity] = useState(1);
  const addLine = useCartStore((state) => state.addLine);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function choose(group, choiceName) {
    setSelected((prev) => {
      const current = prev[group.name] ?? [];
      if (group.type === "single") {
        return { ...prev, [group.name]: choiceName ? [choiceName] : [] };
      }
      const next = current.includes(choiceName)
        ? current.filter((name) => name !== choiceName)
        : [...current, choiceName];
      return { ...prev, [group.name]: next };
    });
  }

  const unitPrice = item.optionGroups.reduce((sum, group) => {
    const picked = selected[group.name] ?? [];
    return (
      sum +
      group.choices
        .filter((choice) => picked.includes(choice.name))
        .reduce((groupSum, choice) => groupSum + choice.priceDelta, 0)
    );
  }, item.price);

  const missingRequired = item.optionGroups.filter(
    (group) => group.required && !(selected[group.name]?.length > 0),
  );

  function handleAdd() {
    const selectedOptions = item.optionGroups.flatMap((group) =>
      group.choices
        .filter((choice) => (selected[group.name] ?? []).includes(choice.name))
        .map((choice) => ({
          groupName: group.name,
          choiceName: choice.name,
          priceDelta: choice.priceDelta,
        })),
    );
    addLine({
      menuItemId: item._id,
      name: item.name,
      unitPrice,
      quantity,
      selectedOptions,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
      >
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="mb-3 h-48 w-full rounded-lg object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-2xl leading-none text-stone-400"
          >
            ×
          </button>
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-stone-500">{item.description}</p>
        )}

        {item.optionGroups.map((group) => {
          const picked = selected[group.name] ?? [];
          const isSingle = group.type === "single";
          return (
            <fieldset key={group.name} className="mt-4">
              <legend className="text-sm font-medium">
                {group.name}{" "}
                <span className="font-normal text-stone-400">
                  {group.required ? "Required" : "Optional"}
                  {isSingle ? " · choose one" : " · choose any"}
                </span>
              </legend>

              {isSingle && !group.required && (
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={group.name}
                    checked={picked.length === 0}
                    onChange={() => choose(group, null)}
                  />
                  None
                </label>
              )}

              {group.choices.map((choice) => (
                <label
                  key={choice.name}
                  className="mt-2 flex items-center gap-2 text-sm"
                >
                  <input
                    type={isSingle ? "radio" : "checkbox"}
                    name={group.name}
                    checked={picked.includes(choice.name)}
                    onChange={() => choose(group, choice.name)}
                  />
                  <span className="flex-1">{choice.name}</span>
                  <span className="text-stone-500">
                    {formatPriceDelta(choice.priceDelta)}
                  </span>
                </label>
              ))}
            </fieldset>
          );
        })}

        <div className="mt-5 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
                className="h-8 w-8 rounded border border-stone-300 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={quantity >= MAX_QUANTITY}
                onClick={() => setQuantity((q) => q + 1)}
                className="h-8 w-8 rounded border border-stone-300 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {missingRequired.length > 0 && (
            <p className="mt-2 text-sm text-red-600">
              Choose an option for:{" "}
              {missingRequired.map((g) => g.name).join(", ")}
            </p>
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={missingRequired.length > 0}
            className="mt-4 flex w-full justify-between rounded bg-stone-800 px-4 py-3 font-semibold text-white disabled:opacity-40"
          >
            <span>Add to cart</span>
            <span>{formatPrice(unitPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

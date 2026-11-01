import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_QUANTITY = 20; // matches the server limit

// Same item + same options = same cart line.
function makeKey(menuItemId, selectedOptions) {
  const options = selectedOptions
    .map((o) => `${o.groupName}:${o.choiceName}`)
    .sort()
    .join("|");
  return `${menuItemId}|${options}`;
}

// Lines hold display data only (name, unitPrice, options). The server
// recomputes every price when the order is placed.
export const useCartStore = create(
  persist(
    (set) => ({
      lines: [],

      addLine: (line) =>
        set((state) => {
          const key = makeKey(line.menuItemId, line.selectedOptions);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key
                  ? {
                      ...l,
                      quantity: Math.min(
                        l.quantity + line.quantity,
                        MAX_QUANTITY,
                      ),
                    }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key }] };
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.key === key
              ? {
                  ...l,
                  quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY),
                }
              : l,
          ),
        })),

      removeLine: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

      clear: () => set({ lines: [] }),
    }),
    { name: "hostess_cart" },
  ),
);

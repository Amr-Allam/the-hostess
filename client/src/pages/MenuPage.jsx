import { useEffect, useState } from "react";
import { getMenu } from "../api/menu.js";
import ItemOptionsModal from "../features/menu/ItemOptionsModal.jsx";
import MenuItemCard from "../features/menu/MenuItemCard.jsx";

export default function MenuPage() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMenu()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error)
    return <p className="text-red-600">Could not load the menu: {error}</p>;
  if (!categories) return <p className="text-stone-500">Loading menu…</p>;

  // Categories with no available items are hidden.
  const visible = categories.filter((category) => category.items.length > 0);
  if (visible.length === 0) {
    return <p className="text-stone-500">The menu is empty right now.</p>;
  }

  return (
    <div className="space-y-8">
      {visible.map((category) => (
        <section key={category._id}>
          <h2 className="mb-3 text-xl font-semibold">{category.name}</h2>
          <div className="space-y-3">
            {category.items.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        </section>
      ))}

      {selectedItem && (
        <ItemOptionsModal
          key={selectedItem._id}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

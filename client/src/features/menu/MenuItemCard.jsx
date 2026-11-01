import { formatPrice } from "../../lib/format.js";

export default function MenuItemCard({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full gap-3 rounded-lg border border-stone-200 bg-white p-3 text-left hover:border-amber-400"
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-24 w-24 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-24 w-24 shrink-0 rounded bg-stone-100" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{item.name}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">
            {item.description}
          </p>
        )}
        <p className="mt-2 text-sm font-semibold text-amber-700">
          {formatPrice(item.price)}
        </p>
      </div>
    </button>
  );
}

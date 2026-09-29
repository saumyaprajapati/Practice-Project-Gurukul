// Vertical bars for a short series (e.g. 12 months). Plain divs, no chart
// library: bar height is the value's share of the largest value.
export default function ColumnChart({ items, label }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <figure>
      <div className="flex h-44 items-end gap-1 sm:gap-2" role="img" aria-label={label}>
        {items.map((item) => (
          <div key={item.key} className="flex h-full min-w-0 flex-1 flex-col items-center">
            <span className="h-5 text-xs leading-5 text-charcoal/70">{item.value > 0 ? item.value : ""}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-gold"
                style={{ height: `${(item.value / max) * 100}%`, minHeight: item.value > 0 ? "4px" : "1px" }}
                title={`${item.title ?? item.label}: ${item.value}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 border-t border-brown/20 pt-1 sm:gap-2" aria-hidden="true">
        {items.map((item) => (
          <span key={item.key} className="min-w-0 flex-1 truncate text-center text-[10px] text-charcoal/60 sm:text-xs">
            {item.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

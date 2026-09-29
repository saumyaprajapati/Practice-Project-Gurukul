// Labelled horizontal bars, one row each. `percent` sets the bar width;
// `valueLabel` is the text shown on the right. A highlighted row gets an
// ochre bar and its `note` underneath.
export default function BarList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-charcoal" title={item.label}>
              {item.label}
              {item.detail ? <span className="ml-2 text-xs text-charcoal/50">{item.detail}</span> : null}
            </span>
            <span className="shrink-0 text-charcoal/80">{item.valueLabel}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-brown/15" aria-hidden="true">
            <div
              className={`h-full rounded-full ${item.highlight ? "bg-ochre" : "bg-gold"}`}
              style={{ width: `${Math.min(100, Math.max(0, item.percent))}%` }}
            />
          </div>
          {item.highlight && item.note ? <p className="mt-1 text-xs font-medium text-ochre">{item.note}</p> : null}
        </li>
      ))}
    </ul>
  );
}

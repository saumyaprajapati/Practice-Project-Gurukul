const STYLES = {
  approved: "bg-gold/30 text-charcoal",
  pending: "bg-lapis/15 text-charcoal",
  declined: "bg-ochre/20 text-charcoal",
  active: "bg-gold/30 text-charcoal",
  expired: "bg-ochre/20 text-charcoal",
  banned: "bg-ochre/20 text-charcoal",
  admin: "bg-lapis/15 text-charcoal",
  instructor: "bg-gold/20 text-charcoal",
};

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status] ?? "bg-brown/10"}`}>
      {label ?? status}
    </span>
  );
}

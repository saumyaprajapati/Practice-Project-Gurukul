export default function AuthFooterNav({ children, className = "" }) {
  return (
    <div className={`mt-6 space-y-2 text-sm text-charcoal/80 ${className}`}>
      {children}
    </div>
  );
}

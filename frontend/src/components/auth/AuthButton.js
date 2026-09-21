const VARIANT_CLASSES = {
  primary: "surface-earthy font-medium",
  secondary: "font-medium text-charcoal/85 underline underline-offset-4 hover:text-ochre",
};

export default function AuthButton({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded px-6 py-3 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function AuthInput({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  autoComplete,
  error,
  hint,
  disabled = false,
  inputMode,
}) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-charcoal/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-ochre">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function AuthError({ message }) {
  if (!message) return null;

  return (
    <p role="alert" aria-live="polite" className="mb-4 text-sm text-ochre">
      {message}
    </p>
  );
}

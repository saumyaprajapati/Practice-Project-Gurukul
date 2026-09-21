export default function AuthCard({ children, className = "" }) {
  return (
    <div className={`surface-earthy w-full rounded-lg p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

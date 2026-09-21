export default function Captcha({ challenge, value, onChange, id = "captcha" }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        Solve to continue: {challenge.question}
      </label>
      <input
        id={id}
        name="captcha"
        type="text"
        inputMode="numeric"
        value={value}
        onChange={onChange}
        required
        className="w-full rounded border border-brown/40 bg-cream px-3 py-2 text-charcoal outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
      />
    </div>
  );
}

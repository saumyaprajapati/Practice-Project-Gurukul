import AuthInput from "@/components/auth/AuthInput";

export default function Captcha({ challenge, value, onChange, id = "captcha", error }) {
  return (
    <AuthInput
      id={id}
      name="captcha"
      label={`Solve to continue: ${challenge.question}`}
      inputMode="numeric"
      value={value}
      onChange={onChange}
      required
      error={error}
    />
  );
}

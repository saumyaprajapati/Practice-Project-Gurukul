export default function Footer() {
  return (
    <footer id="footer" className="section-base section-dark">
      <div className="section-inner !py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">GURUKUL</p>
          <p className="text-sm opacity-70">
            तमसो मा ज्योतिर्गमय — lead me from darkness to light.
          </p>
        </div>
        <p className="text-sm opacity-60">
          © {new Date().getFullYear()} Gurukul. Footer placeholder — content
          coming soon.
        </p>
      </div>
    </footer>
  );
}

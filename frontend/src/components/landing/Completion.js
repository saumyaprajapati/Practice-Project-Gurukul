import CertificateSequence from "./CertificateSequence";

export default function Completion() {
  return (
    <section
      id="completion"
      aria-labelledby="completion-heading"
      className="section-base section-manuscript"
    >
      <div className="section-inner text-center">
        <h2 id="completion-heading" className="heading-2">
          You didn&rsquo;t buy another course.
          <br />
          You finished one.
        </h2>
        <span className="rule-shirorekha mx-auto" aria-hidden="true" />

        <div className="mt-10">
          <CertificateSequence />
        </div>
      </div>
    </section>
  );
}

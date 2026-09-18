import MentorCard from "./MentorCard";
import { MENTORS } from "./mentorsData";

export default function Mentors() {
  return (
    <section
      id="mentors"
      aria-labelledby="mentors-heading"
      className="section-base section-dark"
    >
      <div className="section-inner">
        <h2 id="mentors-heading" className="heading-2">
          The right voice. At the right moment.
        </h2>
        <span className="rule-shirorekha" aria-hidden="true" />

        <p className="mt-6 max-w-xl text-cream/80">
          Gurukul responds to learner behaviour instead of relying only on
          generic reminders. Six mentors, each waiting for a different
          moment.
        </p>

        <ul
          className="mt-10 flex list-none gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
            -mx-4 px-4 sm:-mx-6 sm:px-6
            md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none
            md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        >
          {MENTORS.map((mentor) => (
            <li
              key={mentor.id}
              className="w-72 shrink-0 snap-center md:w-auto md:shrink"
            >
              <MentorCard mentor={mentor} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

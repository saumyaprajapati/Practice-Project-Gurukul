import StatCard from "@/components/gurukul/StatCard";
import BarList from "./BarList";
import ColumnChart from "./ColumnChart";

function percentOf(count, total) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// "2026-09" -> "Sep", with the year on January and on the first bar.
function monthLabel(month, index) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  const short = date.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
  return index === 0 || monthNumber === 1 ? `${short} ${String(year).slice(2)}` : short;
}

function Panel({ title, description, children }) {
  return (
    <section className="surface-earthy rounded-lg p-5">
      <h2 className="font-semibold text-charcoal">{title}</h2>
      {description ? <p className="mt-1 text-sm text-charcoal/70">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// The lesson where the share of learners who completed it falls the most
// compared with the lesson before it — the first place to look when
// improving the course.
function findBiggestDrop(funnel, enrolled) {
  let biggest = null;
  for (let index = 1; index < funnel.length; index += 1) {
    const drop =
      percentOf(funnel[index - 1].completedCount, enrolled) - percentOf(funnel[index].completedCount, enrolled);
    if (drop > 0 && (!biggest || drop > biggest.drop)) biggest = { lessonKey: funnel[index].lessonKey, drop };
  }
  return biggest;
}

export default function OverviewTab({ analytics }) {
  const { totals, enrollmentsByMonth, progressBuckets, lessonFunnel, stopPoints, moduleCompletion } = analytics;
  const enrolled = totals.enrolled;
  const biggestDrop = findBiggestDrop(lessonFunnel, enrolled);

  // Funnel rows grouped under their module, keeping course order.
  const funnelByModule = [];
  for (const lesson of lessonFunnel) {
    const last = funnelByModule[funnelByModule.length - 1];
    if (last && last.moduleId === lesson.moduleId) last.lessons.push(lesson);
    else funnelByModule.push({ moduleId: lesson.moduleId, moduleTitle: lesson.moduleTitle, lessons: [lesson] });
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Enrolled" value={enrolled} hint={`${totals.active} with active access`} />
        <StatCard label="Watching now" value={totals.watchingNow} hint="On a lesson in the last 2 min" live />
        <StatCard label="Avg completion" value={`${totals.avgProgress}%`} hint={`of ${plural(totals.totalLessons, "lesson")}`} />
        <StatCard
          label="Finished the course"
          value={totals.completed}
          hint={`${percentOf(totals.completed, enrolled)}% of learners`}
        />
        <StatCard label="Active this week" value={totals.activeLast7Days} hint="Opened or completed a lesson" />
        <StatCard
          label="Not started"
          value={totals.notStarted}
          hint={`${percentOf(totals.notStarted, enrolled)}% haven't completed a lesson`}
          highlight={enrolled > 0 && totals.notStarted / enrolled >= 0.5}
        />
      </div>

      {enrolled === 0 ? (
        <p className="text-charcoal/80">
          No learners enrolled yet. Charts appear here once people enrol in this course.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Enrollments per month" description="New learners in each of the last 12 months.">
              <ColumnChart
                label="Enrollments per month"
                items={enrollmentsByMonth.map((item, index) => ({
                  key: item.month,
                  label: monthLabel(item.month, index),
                  title: item.month,
                  value: item.count,
                }))}
              />
            </Panel>

            <Panel title="How far learners have got" description="Learners grouped by course completion.">
              <BarList
                items={progressBuckets.map((bucket) => ({
                  key: bucket.label,
                  label: bucket.label,
                  percent: percentOf(bucket.count, enrolled),
                  valueLabel: plural(bucket.count, "learner"),
                }))}
              />
            </Panel>
          </div>

          <Panel
            title="Lesson drop-off"
            description="Share of learners who completed each lesson, in course order. A sharp fall shows where people lose interest or get stuck."
          >
            {lessonFunnel.length === 0 ? (
              <p className="text-sm text-charcoal/80">This course has no lessons yet.</p>
            ) : (
              <div className="space-y-6">
                {funnelByModule.map((group) => (
                  <div key={group.moduleId}>
                    <h3 className="mb-3 text-sm font-semibold text-charcoal/80">{group.moduleTitle}</h3>
                    <BarList
                      items={group.lessons.map((lesson) => {
                        const percent = percentOf(lesson.completedCount, enrolled);
                        return {
                          key: lesson.lessonKey,
                          label: lesson.lessonTitle,
                          percent,
                          valueLabel: `${percent}% · ${lesson.completedCount}`,
                          highlight: biggestDrop?.lessonKey === lesson.lessonKey,
                          note: biggestDrop ? `Biggest drop-off: ${biggestDrop.drop} points fewer than the lesson before` : null,
                        };
                      })}
                    />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title="Where learners stop"
              description="The furthest lesson completed by learners who haven't finished the course."
            >
              {stopPoints.length === 0 ? (
                <p className="text-sm text-charcoal/80">
                  {totals.completed === enrolled
                    ? "Everyone who enrolled has finished the course."
                    : "Nobody who is part-way through has completed a lesson yet."}
                </p>
              ) : (
                <BarList
                  items={stopPoints.slice(0, 5).map((point) => ({
                    key: point.lessonKey,
                    label: point.lessonTitle,
                    detail: point.moduleTitle,
                    percent: percentOf(point.count, enrolled),
                    valueLabel: plural(point.count, "learner"),
                  }))}
                />
              )}
            </Panel>

            <Panel title="Module completion" description="Share of learners who completed every lesson in the module.">
              {moduleCompletion.length === 0 ? (
                <p className="text-sm text-charcoal/80">This course has no modules yet.</p>
              ) : (
                <BarList
                  items={moduleCompletion.map((module, index) => {
                    const percent = percentOf(module.completedCount, enrolled);
                    return {
                      key: `${index}-${module.moduleTitle}`,
                      label: module.moduleTitle,
                      detail: plural(module.lessonCount, "lesson"),
                      percent,
                      valueLabel: `${percent}%`,
                    };
                  })}
                />
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

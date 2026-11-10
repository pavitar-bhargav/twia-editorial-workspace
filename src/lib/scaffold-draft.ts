import type { DeskSource, ResearchBrief } from "@/lib/types";

export function scaffoldDraft(
  angle: ResearchBrief["angles"][number],
  brief: ResearchBrief,
  sources: DeskSource[],
): string {
  const cites = sources.map((source, index) => {
    const label = `[S${index + 1}] ${source.title}`;
    return source.url ? `${label} — ${source.url}` : label;
  });
  return [
    angle.title,
    "",
    angle.hook,
    "",
    brief.whatHappened,
    "",
    "Why it matters",
    "",
    `Founders. ${brief.whyItMatters.founders}`,
    "",
    `Builders. ${brief.whyItMatters.builders}`,
    "",
    `Operators. ${brief.whyItMatters.operators}`,
    "",
    brief.practicalImplication,
    "",
    "Sources",
    ...cites,
  ].join("\n");
}

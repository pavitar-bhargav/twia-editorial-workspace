import { Button } from "@/components/button";
import type { DraftIssue, IssueCategory, WritingMetrics } from "@/lib/types";

const LABELS: Record<IssueCategory, string> = {
  long_sentence: "Long sentence",
  passive_voice: "Passive voice",
  filler: "Filler",
  jargon: "Jargon",
  unsupported: "Ungrounded",
  repetition: "Repetition",
  structure: "Structure",
  nuance: "Nuance",
};

export function Inspector({
  metrics,
  issues,
  focusedId,
  showGuide,
  onToggleGuide,
  onFocus,
  onAccept,
  onDismiss,
}: {
  metrics: WritingMetrics;
  issues: DraftIssue[];
  focusedId?: string;
  showGuide: boolean;
  onToggleGuide: () => void;
  onFocus: (id: string) => void;
  onAccept: (issue: DraftIssue) => void;
  onDismiss: (issue: DraftIssue) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col bg-stone">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">Telemetry</p>
          <button type="button" className="text-[12px] text-forest" onClick={onToggleGuide}>
            {showGuide ? "Hide" : "What these mean"}
          </button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          <Stat label="Words" value={String(metrics.wordCount)} />
          <Stat label="Read" value={formatRead(metrics.readingTimeMinutes)} />
          <Stat label="Sentence" value={metrics.averageSentenceLength ? String(metrics.averageSentenceLength) : "—"} />
          <Stat label="Grade" value={metrics.wordCount ? String(metrics.fleschKincaidGrade) : "—"} />
          <Stat label="Paragraphs" value={String(metrics.paragraphCount)} />
          <Stat label="Densest" value={metrics.longestParagraphWords ? `${metrics.longestParagraphWords}w` : "—"} />
        </dl>
        {showGuide ? (
          <p className="mt-3 text-[12px] leading-5 text-slate">
            Reading time assumes 238 words per minute, a brisk pace for this audience. Average sentence length is a
            clarity signal: the desk marks sentences past 25 words, and treats those past 35 as hard to follow.
            Flesch–Kincaid estimates a U.S. school grade from sentence length and syllables. It is a diagnostic, not a
            verdict. A precise sentence about a safeguard can score worse than a vague short one and still be the right
            sentence. Densest is the word count of the longest paragraph. Do not optimize these numbers for their own sake.
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-baseline justify-between px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">Marks</p>
          <p className="font-mono text-[11px] tabular-nums text-slate">{issues.length}</p>
        </div>
        {issues.length === 0 ? (
          <p className="px-4 pb-6 text-[13px] leading-5 text-slate">
            No open marks. That is not a certificate of quality. It means the rules are quiet.
          </p>
        ) : (
          <ol>
            {issues.map((issue) => {
              const unchanged = issue.suggestion === issue.passage;
              return (
                <li
                  key={issue.id}
                  className={`border-t border-line px-4 py-3 ${focusedId === issue.id ? "bg-sheet" : ""}`}
                >
                  <button type="button" className="block w-full text-left" onClick={() => onFocus(issue.id)}>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                      {LABELS[issue.category]}
                      {issue.source === "model" ? " · model" : ""}
                    </span>
                    <p className="mt-1 font-serif text-[14.5px] italic leading-5 text-ink">“{trimPassage(issue.passage)}”</p>
                  </button>
                  <p className="mt-2 text-[13px] leading-5 text-ink">{issue.explanation}</p>
                  <p className="mt-2 border-l-2 border-forest pl-2 text-[13px] leading-5 text-ink">
                    {issue.suggestion
                      ? issue.suggestion
                      : issue.category === "unsupported"
                        ? "Cut this. The figure is not in the clips."
                        : "Cut this."}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button tone="quiet" className="h-7 px-0 text-terra" onClick={() => onAccept(issue)} disabled={unchanged}>
                      {unchanged ? "Edit by hand" : "Accept"}
                    </Button>
                    <Button tone="quiet" className="h-7 px-2" onClick={() => onDismiss(issue)}>
                      Dismiss
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

const STAT_TITLES: Record<string, string> = {
  Words: "Word count of the draft.",
  Read: "Reading time at 238 words per minute, a brisk pace for this audience.",
  Sentence: "Average sentence length in words. The desk marks sentences past 25, and treats those past 35 as hard to follow.",
  Grade: "Flesch–Kincaid grade, estimated from sentence length and syllables. A diagnostic, not a target.",
  Paragraphs: "Paragraph count.",
  Densest: "Word count of the longest paragraph.",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div title={STAT_TITLES[label]}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate">{label}</dt>
      <dd className="font-mono text-[14px] tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function formatRead(minutes: number): string {
  if (!minutes) return "—";
  if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))}s`;
  return `${minutes.toFixed(1)}m`;
}

function trimPassage(passage: string): string {
  const clean = passage.replace(/\s+/g, " ").trim();
  return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
}

import { useEffect, useRef } from "react";
import { diffWords } from "@/lib/diff-words";
import type { DraftIssue, IssueCategory, IssueSeverity } from "@/lib/types";

export function DraftCanvas({
  draft,
  baseline,
  issues,
  focusedId,
  compare,
  compareMode,
  onChange,
  onCompare,
  onCompareMode,
  onSetBaseline,
  onRevert,
  onCritique,
  critiquing,
  critiqueNote,
}: {
  draft: string;
  baseline: string;
  issues: DraftIssue[];
  focusedId?: string;
  compare: boolean;
  compareMode: "side" | "inline";
  onChange: (value: string) => void;
  onCompare: (open: boolean) => void;
  onCompareMode: (mode: "side" | "inline") => void;
  onSetBaseline: () => void;
  onRevert: () => void;
  onCritique: () => void;
  critiquing: boolean;
  critiqueNote?: string;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!focusedId) return;
    document.querySelector(`[data-focus="${focusedId}"]`)?.scrollIntoView({ block: "center" });
  }, [focusedId, draft]);

  return (
    <div className="mx-auto max-w-[74ch] px-8 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="text-[12px] text-slate hover:text-ink" onClick={onSetBaseline}>
          Set baseline
        </button>
        <button
          type="button"
          className="text-[12px] text-ink"
          onClick={() => onCompare(!compare)}
          disabled={!baseline}
        >
          {compare ? "Hide comparison" : "Compare with baseline"}
        </button>
        <button type="button" className="text-[12px] text-slate hover:text-ink" onClick={onRevert} disabled={!baseline}>
          Revert
        </button>
        <button
          type="button"
          className="ml-auto text-[12px] text-forest disabled:opacity-40"
          onClick={onCritique}
          disabled={critiquing || !draft.trim()}
        >
          {critiquing ? "Reading the draft…" : "Request editorial critique"}
        </button>
      </div>
      <Legend />
      {critiqueNote ? <p className="mt-3 text-[13px] leading-5 text-slate">{critiqueNote}</p> : null}

      {compare ? (
        <div className="mt-4">
          <div className="mb-2 flex gap-3 text-[12px]">
            <button type="button" className={compareMode === "side" ? "text-ink" : "text-slate"} onClick={() => onCompareMode("side")}>
              Side by side
            </button>
            <button type="button" className={compareMode === "inline" ? "text-ink" : "text-slate"} onClick={() => onCompareMode("inline")}>
              Inline
            </button>
          </div>
          {compareMode === "side" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <pre className="overflow-x-auto whitespace-pre-wrap border border-line bg-stone p-3 font-serif text-[15px] leading-6">{baseline}</pre>
              <pre className="overflow-x-auto whitespace-pre-wrap border border-line bg-sheet p-3 font-serif text-[15px] leading-6">{draft}</pre>
            </div>
          ) : (
            <p className="border border-line bg-sheet p-3 font-serif text-[16px] leading-7">
              {diffWords(baseline, draft).map((part, index) =>
                part.type === "equal" ? (
                  <span key={index}>{part.text}</span>
                ) : part.type === "delete" ? (
                  <span key={index} className="diff-del">
                    {part.text}
                  </span>
                ) : (
                  <span key={index} className="diff-ins">
                    {part.text}
                  </span>
                ),
              )}
            </p>
          )}
        </div>
      ) : null}

      <div className="draft-shell mt-4">
        <div className="draft-back" aria-hidden>
          <HighlightedText text={draft || " "} issues={draft ? issues : []} focusedId={focusedId} />
          {draft.endsWith("\n") || draft === "" ? "\n" : null}
        </div>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(event) => onChange(event.target.value)}
          placeholder="The draft lives here. Marks appear as you write."
          aria-label="Draft"
          className="draft-input"
          spellCheck
        />
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    ["hl-long", "Long, over 25"],
    ["hl-severe", "Long, over 35"],
    ["hl-passive", "Passive"],
    ["hl-jargon", "Jargon"],
    ["hl-filler", "Filler"],
    ["hl-claim", "Ungrounded figure"],
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
      {items.map(([swatch, label]) => (
        <li key={label} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate">
          <span className={`inline-block h-2.5 w-4 ${swatch}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function HighlightedText({
  text,
  issues,
  focusedId,
}: {
  text: string;
  issues: DraftIssue[];
  focusedId?: string;
}) {
  const points = new Set<number>([0, text.length]);
  for (const issue of issues) {
    if (issue.start < 0 || issue.end > text.length || issue.start >= issue.end) continue;
    points.add(issue.start);
    points.add(issue.end);
  }
  const sorted = [...points].sort((a, b) => a - b);
  return (
    <>
      {sorted.slice(0, -1).map((start, index) => {
        const end = sorted[index + 1];
        const covering = issues.filter((issue) => issue.start <= start && issue.end >= end);
        const chosen = pickIssue(covering, focusedId);
        const focus = chosen && chosen.id === focusedId && chosen.start === start;
        return (
          <span
            key={start}
            className={chosen ? issueClass(chosen.category, chosen.severity) : undefined}
            data-focus={focus ? focusedId : undefined}
          >
            {text.slice(start, end)}
          </span>
        );
      })}
    </>
  );
}

function pickIssue(covering: DraftIssue[], focusedId?: string): DraftIssue | undefined {
  const focused = covering.find((issue) => issue.id === focusedId);
  if (focused) return focused;
  return covering.slice().sort((a, b) => a.end - a.start - (b.end - b.start))[0];
}

function issueClass(category: IssueCategory, severity: IssueSeverity): string {
  if (category === "long_sentence") return severity === "red" ? "hl-severe" : "hl-long";
  if (category === "passive_voice") return "hl-passive";
  if (category === "jargon") return "hl-jargon";
  if (category === "filler") return "hl-filler";
  if (category === "unsupported") return "hl-claim";
  return "hl-model";
}

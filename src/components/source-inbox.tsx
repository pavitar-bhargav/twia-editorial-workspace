import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/button";
import type { DeskSource } from "@/lib/types";
import { countWords } from "@/lib/words";

export function SourceInbox({
  sources,
  activeId,
  urlDraft,
  pasteOpen,
  pasteTitle,
  pasteText,
  onUrlDraft,
  onAddUrls,
  onPasteOpen,
  onPasteTitle,
  onPasteText,
  onSavePaste,
  onUpdateText,
  onRemove,
  onSelect,
}: {
  sources: DeskSource[];
  activeId?: string;
  urlDraft: string;
  pasteOpen: boolean;
  pasteTitle: string;
  pasteText: string;
  onUrlDraft: (value: string) => void;
  onAddUrls: () => void;
  onPasteOpen: (open: boolean) => void;
  onPasteTitle: (value: string) => void;
  onPasteText: (value: string) => void;
  onSavePaste: () => void;
  onUpdateText: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col bg-stone">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">Sources</p>
          <p className="font-mono text-[11px] tabular-nums text-slate">
            {sources.filter((source) => source.status === "ready").length} ready
          </p>
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onAddUrls();
          }}
        >
          <input
            value={urlDraft}
            onChange={(event) => onUrlDraft(event.target.value)}
            placeholder="URLs, one per line"
            aria-label="Source URLs"
            className="h-8 min-w-0 flex-1 rounded-md border border-line bg-sheet px-2 text-[13px] outline-none placeholder:text-slate/70"
          />
          <Button type="submit" tone="plain">
            Add
          </Button>
        </form>
        <button
          type="button"
          className="mt-2 text-[12px] text-slate underline-offset-2 hover:text-ink hover:underline"
          onClick={() => onPasteOpen(!pasteOpen)}
        >
          {pasteOpen ? "Close paste" : "Paste text instead"}
        </button>
        {pasteOpen ? (
          <div className="mt-2 space-y-2">
            <input
              value={pasteTitle}
              onChange={(event) => onPasteTitle(event.target.value)}
              placeholder="Title"
              aria-label="Pasted source title"
              className="h-8 w-full rounded-md border border-line bg-sheet px-2 text-[13px]"
            />
            <textarea
              value={pasteText}
              onChange={(event) => onPasteText(event.target.value)}
              placeholder="Article text, a tweet, or notes"
              aria-label="Pasted source text"
              rows={5}
              className="w-full rounded-md border border-line bg-sheet px-2 py-1.5 text-[13px] leading-5"
            />
            <Button tone="terra" onClick={onSavePaste} disabled={!pasteText.trim()}>
              Save clip
            </Button>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sources.length === 0 ? (
          <p className="px-4 py-6 text-[13px] leading-5 text-slate">
            The inbox is empty. Add three or more links, paste a passage, or clip the page you are reading.
          </p>
        ) : (
          <ol>
            {sources.map((source, index) => (
              <li
                key={source.id}
                id={`source-${source.id}`}
                className={`border-b border-line px-4 py-3 ${activeId === source.id ? "bg-sheet" : ""}`}
              >
                <button type="button" className="block w-full text-left" onClick={() => onSelect(source.id)}>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] tabular-nums text-terra">S{index + 1}</span>
                    <span className="font-serif text-[15px] leading-5 text-ink">{source.title}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate">
                    {sourceHost(source)}
                    {source.text ? ` · ${countWords(source.text)} words` : ""}
                    {` · ${labelStatus(source)}`}
                  </p>
                </button>
                {source.note ? <p className="mt-2 text-[12px] leading-5 text-slate">{source.note}</p> : null}
                {source.status === "needs_paste" ? (
                  <textarea
                    value={source.text}
                    onChange={(event) => onUpdateText(source.id, event.target.value)}
                    placeholder="Paste the text from this page"
                    aria-label={`Paste text for ${source.title}`}
                    rows={5}
                    className="mt-2 w-full rounded-md border border-line bg-sheet px-2 py-1.5 text-[13px] leading-5"
                  />
                ) : null}
                <div className="mt-2 flex items-center gap-3">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[12px] text-forest"
                    >
                      Original
                      <ArrowUpRight size={13} strokeWidth={1.5} aria-hidden />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="text-[12px] text-slate hover:text-ink"
                    onClick={() => onRemove(source.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

function sourceHost(source: DeskSource): string {
  if (!source.url) return source.origin;
  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return source.origin;
  }
}

function labelStatus(source: DeskSource): string {
  if (source.status === "fetching") return "fetching";
  if (source.status === "needs_paste") return "needs paste";
  return "ready";
}

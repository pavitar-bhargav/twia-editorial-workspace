"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
import { DraftCanvas } from "@/components/draft-canvas";
import { Inspector } from "@/components/inspector";
import { MarkdownView } from "@/components/markdown-view";
import { ResearchBriefView } from "@/components/research-brief";
import { SourceInbox } from "@/components/source-inbox";
import { Button } from "@/components/button";
import { applySuggestion } from "@/lib/apply-suggestion";
import { buildBookmarklet } from "@/lib/bookmarklet";
import { CURATED_BRIEF, DEMO_SOURCES, FLAWED_DRAFT, POLISHED_DRAFT } from "@/lib/demo-workspace";
import { analyzeDraft, findUngroundedNumbers } from "@/lib/deterministic-analyzer";
import { researchBriefSchema } from "@/lib/schemas";
import { scaffoldDraft } from "@/lib/scaffold-draft";
import type { DeskSource, DraftIssue, StoredBrief } from "@/lib/types";

type Tab = "research" | "draft" | "sample";
type Pane = "sources" | "desk" | "inspector";

const STORAGE_KEY = "twia-desk-v2";

export function Workspace({
  productNote,
  sampleEditorial,
}: {
  productNote: string;
  sampleEditorial: string;
}) {
  const [sources, setSources] = useState<DeskSource[]>([]);
  const [stored, setStored] = useState<StoredBrief | null>(null);
  const [draft, setDraft] = useState("");
  const [baseline, setBaseline] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [modelIssues, setModelIssues] = useState<DraftIssue[]>([]);
  const [tab, setTab] = useState<Tab>("research");
  const [pane, setPane] = useState<Pane>("desk");
  const [urlDraft, setUrlDraft] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [activeSourceId, setActiveSourceId] = useState<string>();
  const [focusedId, setFocusedId] = useState<string>();
  const [compare, setCompare] = useState(false);
  const [compareMode, setCompareMode] = useState<"side" | "inline">("side");
  const [guide, setGuide] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [clipperOpen, setClipperOpen] = useState(false);
  const [bookmarklet, setBookmarklet] = useState("");
  const [busyBrief, setBusyBrief] = useState(false);
  const [busyCritique, setBusyCritique] = useState(false);
  const [error, setError] = useState<string>();
  const [critiqueNote, setCritiqueNote] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const inboxEpoch = useRef(0);

  useEffect(() => {
    // localStorage is read after paint so the server HTML and the first client render match.
    window.queueMicrotask(() => {
      setBookmarklet(buildBookmarklet(window.location.origin));

      const saved = readStorage();
      if (saved) {
        setSources(saved.sources);
        setStored(saved.brief);
        setDraft(saved.draft);
        setBaseline(saved.baseline);
        setDismissed(saved.dismissed);
        setTab(saved.tab);
      }
      const params = new URLSearchParams(window.location.search);
      const clipUrl = params.get("clipUrl");
      const clipText = params.get("clipText");
      if (clipUrl || clipText) {
        const source: DeskSource = {
          id: crypto.randomUUID(),
          title: params.get("clipTitle") || hostOf(clipUrl) || "Clipped page",
          url: clipUrl || undefined,
          text: clipText || "",
          status: clipText && clipText.trim().length > 40 ? "ready" : clipUrl ? "fetching" : "needs_paste",
          origin: "bookmarklet",
          note: clipText ? "Selected text from the clipper." : undefined,
        };
        setSources((current) => [source, ...current]);
        if (source.status === "fetching" && clipUrl) void ingest(source.id, clipUrl, setSources, setError);
        params.delete("clipUrl");
        params.delete("clipTitle");
        params.delete("clipText");
        const next = params.toString();
        window.history.replaceState(null, "", next ? `/?${next}` : "/");
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => {
      void pullInbox(setSources, inboxEpoch);
    }, 4000);
    void pullInbox(setSources, inboxEpoch);
    return () => window.clearInterval(timer);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sources, brief: stored, draft, baseline, dismissed, tab }),
    );
  }, [hydrated, sources, stored, draft, baseline, dismissed, tab]);

  useEffect(() => {
    if (!noteOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNoteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [noteOpen]);

  const analysis = useMemo(() => analyzeDraft(draft), [draft]);
  const issues = useMemo(() => {
    const claims = findUngroundedNumbers(
      draft,
      sources.filter((source) => source.status === "ready"),
    );
    const modeled = modelIssues.flatMap((issue) => {
      const start = draft.indexOf(issue.passage);
      if (start < 0) return [];
      return [{ ...issue, start, end: start + issue.passage.length }];
    });
    return [...analysis.issues, ...claims, ...modeled].filter(
      (issue) => !dismissed.includes(dismissKey(issue)),
    );
  }, [analysis.issues, draft, sources, modelIssues, dismissed]);

  async function synthesize() {
    setError(undefined);
    setBusyBrief(true);
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sources: sources
            .filter((source) => source.text.trim())
            .map((source) => ({
              id: source.id,
              title: source.title,
              url: source.url,
              text: source.text,
            })),
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        warning?: string;
        mode?: StoredBrief["mode"];
        droppedFacts?: number;
        brief?: unknown;
      };
      if (!payload.ok || !payload.brief || !payload.mode) {
        setError(payload.error || "The brief could not be built.");
        return;
      }
      const parsed = researchBriefSchema.safeParse(payload.brief);
      if (!parsed.success) {
        setError("The brief came back in a shape the desk could not read.");
        return;
      }
      setStored({
        brief: {
          ...parsed.data,
          angles: parsed.data.angles.map((angle, index) => ({
            ...angle,
            id: angle.id || `angle-${index + 1}`,
          })),
        },
        mode: payload.mode,
        warning: payload.warning,
        droppedFacts: payload.droppedFacts ?? 0,
      });
      setTab("research");
      setPane("desk");
    } catch {
      setError("The brief request failed.");
    } finally {
      setBusyBrief(false);
    }
  }

  async function critique() {
    setBusyCritique(true);
    setCritiqueNote(undefined);
    try {
      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          sources: sources.map((source) => ({ id: source.id, title: source.title, text: source.text })),
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        summary?: string;
        issues?: DraftIssue[];
      };
      if (!payload.ok) {
        setCritiqueNote(payload.error || "The critique pass failed.");
        return;
      }
      setModelIssues(payload.issues ?? []);
      setCritiqueNote(payload.summary);
    } catch {
      setCritiqueNote("The critique request failed. The rule marks are still live.");
    } finally {
      setBusyCritique(false);
    }
  }

  function resetDesk() {
    inboxEpoch.current += 1;
    void fetch("/api/inbox", { method: "DELETE" });
    setSources([]);
    setStored(null);
    setDraft("");
    setBaseline("");
    setDismissed([]);
    setModelIssues([]);
    setCompare(false);
    setTab("research");
    setPane("desk");
    setUrlDraft("");
    setPasteOpen(false);
    setPasteTitle("");
    setPasteText("");
    setActiveSourceId(undefined);
    setFocusedId(undefined);
    setError(undefined);
    setCritiqueNote(undefined);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function loadDemo() {
    setSources(DEMO_SOURCES);
    setStored({ brief: CURATED_BRIEF, mode: "curated", droppedFacts: 0 });
    setDraft(FLAWED_DRAFT);
    setBaseline(FLAWED_DRAFT);
    setDismissed([]);
    setModelIssues([]);
    setCompare(false);
    setTab("research");
    setPane("desk");
    setError(undefined);
    setCritiqueNote("A rough draft is waiting in the Draft tab. The marks are already on it.");
  }

  function startAngle(angleId: string) {
    if (!stored) return;
    const angle = stored.brief.angles.find((item) => item.id === angleId);
    if (!angle) return;
    const next = scaffoldDraft(angle, stored.brief, sources);
    setDraft(next);
    setBaseline(next);
    setDismissed([]);
    setModelIssues([]);
    setCompare(false);
    setTab("draft");
    setPane("desk");
  }

  function accept(issue: DraftIssue) {
    if (issue.suggestion === issue.passage) return;
    const start = draft.indexOf(issue.passage);
    if (start < 0) return;
    setDraft(applySuggestion(draft, start, start + issue.passage.length, issue.suggestion));
    setFocusedId(undefined);
  }

  function addUrls() {
    const urls = urlDraft
      .split(/\s+/)
      .map((value) => value.trim())
      .filter((value) => /^https?:\/\//i.test(value) || /^[\w.-]+\.[a-z]{2,}/i.test(value));
    if (urls.length === 0) {
      setError("Those did not look like URLs. Paste the text instead.");
      return;
    }
    setUrlDraft("");
    setError(undefined);
    for (const url of urls) {
      const id = crypto.randomUUID();
      const source: DeskSource = {
        id,
        url: url.startsWith("http") ? url : `https://${url}`,
        title: hostOf(url) || url,
        text: "",
        status: "fetching",
        origin: "manual",
      };
      setSources((current) => [...current, source]);
      void ingest(id, source.url || url, setSources, setError);
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-b border-line bg-sheet">
        <div className="flex items-end justify-between gap-4 px-4 py-3 sm:px-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-terra">Editorial desk</p>
            <h1 className="font-serif text-[1.7rem] leading-none tracking-[-0.02em] text-forest">This Week in AI</h1>
          </div>
          <p className="hidden max-w-sm text-[13px] leading-5 text-slate lg:block">
            Clips in, a brief you can check, then a draft you still control.
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <p className="mr-1 hidden font-mono text-[11px] tabular-nums text-slate sm:block">Issue · 10 Nov 2026</p>
            <Button tone="quiet" onClick={() => setNoteOpen(true)}>
              Product note
            </Button>
            <div className="relative">
              <Button tone="plain" onClick={() => setClipperOpen((open) => !open)}>
                Clipper
              </Button>
              {clipperOpen ? (
                <ClipperPanel
                  bookmarklet={bookmarklet}
                  onClose={() => setClipperOpen(false)}
                />
              ) : null}
            </div>
            <Button tone="terra" onClick={loadDemo}>
              Load curated demo
            </Button>
            <Button tone="quiet" onClick={resetDesk}>
              Reset desk
            </Button>
          </div>
        </div>
        {error ? <p className="border-t border-line px-5 py-2 text-[13px] text-terra">{error}</p> : null}
      </header>

      <div className="flex border-b border-line bg-stone text-[13px] lg:hidden">
        {(["sources", "desk", "inspector"] as Pane[]).map((item) => (
          <button
            key={item}
            type="button"
            className={`flex-1 py-2 capitalize ${pane === item ? "bg-sheet text-ink" : "text-slate"}`}
            onClick={() => setPane(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className={`${pane === "sources" ? "flex" : "hidden"} h-full min-h-0 flex-col lg:flex`}>
          <SourceInbox
            sources={sources}
            activeId={activeSourceId}
            urlDraft={urlDraft}
            pasteOpen={pasteOpen}
            pasteTitle={pasteTitle}
            pasteText={pasteText}
            onUrlDraft={setUrlDraft}
            onAddUrls={addUrls}
            onPasteOpen={setPasteOpen}
            onPasteTitle={setPasteTitle}
            onPasteText={setPasteText}
            onSavePaste={() => {
              if (!pasteText.trim()) return;
              setSources((current) => [
                {
                  id: crypto.randomUUID(),
                  title: pasteTitle.trim() || "Pasted clip",
                  text: pasteText.trim(),
                  status: "ready",
                  origin: "manual",
                },
                ...current,
              ]);
              setPasteText("");
              setPasteTitle("");
              setPasteOpen(false);
            }}
            onUpdateText={(id, text) => {
              setSources((current) =>
                current.map((source) =>
                  source.id === id
                    ? { ...source, text, status: text.trim() ? "ready" : "needs_paste" }
                    : source,
                ),
              );
            }}
            onRemove={(id) => setSources((current) => current.filter((source) => source.id !== id))}
            onSelect={(id) => {
              setActiveSourceId(id);
              document.getElementById(`source-${id}`)?.scrollIntoView({ block: "nearest" });
            }}
          />
        </div>

        <main className={`${pane === "desk" ? "flex" : "hidden"} h-full min-h-0 flex-col overflow-y-auto bg-paper lg:flex`}>
            <nav className="sticky top-0 z-10 flex gap-5 border-b border-line bg-paper px-6">
              {(
                [
                  ["research", "Research brief"],
                  ["draft", "Draft"],
                  ["sample", "Sample"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`-mb-px border-b-2 py-3 text-[13px] ${
                    tab === id ? "border-terra text-ink" : "border-transparent text-slate"
                  }`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
            {tab === "research" ? (
              <ResearchBriefView
                stored={stored}
                sources={sources}
                busy={busyBrief}
                onSynthesize={() => void synthesize()}
                onStartAngle={startAngle}
                onVerify={(id) => {
                  setActiveSourceId(id);
                  setPane("sources");
                  window.setTimeout(() => {
                    document.getElementById(`source-${id}`)?.scrollIntoView({ block: "center" });
                  }, 30);
                }}
              />
            ) : null}
            {tab === "draft" ? (
              <DraftCanvas
                draft={draft}
                baseline={baseline}
                issues={issues}
                focusedId={focusedId}
                compare={compare}
                compareMode={compareMode}
                onChange={setDraft}
                onCompare={setCompare}
                onCompareMode={setCompareMode}
                onSetBaseline={() => setBaseline(draft)}
                onRevert={() => {
                  setDraft(baseline);
                  setDismissed([]);
                }}
                onCritique={() => void critique()}
                critiquing={busyCritique}
                critiqueNote={critiqueNote}
              />
            ) : null}
            {tab === "sample" ? (
              <div className="mx-auto max-w-[74ch] px-8 py-8">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    tone="plain"
                    onClick={() => {
                      setDraft(FLAWED_DRAFT);
                      setBaseline(FLAWED_DRAFT);
                      setDismissed([]);
                      setTab("draft");
                    }}
                  >
                    Load the raw draft
                  </Button>
                  <Button
                    tone="quiet"
                    onClick={() => {
                      setDraft(POLISHED_DRAFT);
                      setBaseline(POLISHED_DRAFT);
                      setDismissed([]);
                      setTab("draft");
                    }}
                  >
                    Open the polished piece
                  </Button>
                </div>
                <MarkdownView source={sampleEditorial} />
              </div>
            ) : null}
          </main>

        <div className={`${pane === "inspector" ? "flex" : "hidden"} h-full min-h-0 flex-col lg:flex`}>
          <Inspector
            metrics={analysis.metrics}
            issues={issues}
            focusedId={focusedId}
            showGuide={guide}
            onToggleGuide={() => setGuide((open) => !open)}
            onFocus={(id) => {
              setFocusedId(id);
              setTab("draft");
              setPane("desk");
            }}
            onAccept={accept}
            onDismiss={(issue) => setDismissed((current) => [...current, dismissKey(issue)])}
          />
        </div>
      </div>

      {noteOpen ? (
        <div className="fixed inset-0 z-20 flex justify-end bg-ink/20">
          <button type="button" className="h-full flex-1" aria-label="Close product note" onClick={() => setNoteOpen(false)} />
          <div className="h-full w-full max-w-[440px] overflow-y-auto border-l border-line bg-sheet px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">Product & engineering note</p>
              <button type="button" aria-label="Close" onClick={() => setNoteOpen(false)}>
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
            <MarkdownView source={productNote} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClipperPanel({ bookmarklet, onClose }: { bookmarklet: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (bookmarklet) anchorRef.current?.setAttribute("href", bookmarklet);
  }, [bookmarklet]);
  return (
    <div className="absolute right-0 z-20 mt-2 w-80 border border-line bg-sheet p-3 text-left">
      <p className="font-serif text-[15px]">Pocket clipper</p>
      <p className="mt-1 text-[12px] leading-5 text-slate">
        Drag this to the bookmarks bar. It sends the page URL and any selection to this desk. If the site blocks the
        request, it opens the desk with the clip in the address bar instead.
      </p>
      <a
        ref={anchorRef}
        href="#clip"
        className="mt-3 inline-block border border-line bg-stone px-2 py-1 text-[13px] text-ink"
        onClick={(event) => event.preventDefault()}
      >
        Clip to TWIA
      </a>
      <div className="mt-3 flex gap-2">
        <Button
          tone="plain"
          onClick={() => {
            void navigator.clipboard.writeText(bookmarklet).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy bookmarklet"}
        </Button>
        <Button tone="quiet" onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-slate">
        Chrome extension: load the unpacked <span className="font-mono">extension</span> folder. It posts to this same inbox.
      </p>
    </div>
  );
}

async function ingest(
  id: string,
  url: string,
  setSources: Dispatch<SetStateAction<DeskSource[]>>,
  setError: (value: string | undefined) => void,
) {
  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      title?: string;
      text?: string;
      reason?: string;
    };
    setSources((current) =>
      current.map((source) =>
        source.id === id
          ? {
              ...source,
              title: data.title || source.title,
              text: data.text || "",
              status: data.ok ? "ready" : "needs_paste",
              note: data.reason,
            }
          : source,
      ),
    );
  } catch {
    setError("One of the fetches failed. Paste that source.");
    setSources((current) =>
      current.map((source) =>
        source.id === id ? { ...source, status: "needs_paste", note: "The fetch failed. Paste the text." } : source,
      ),
    );
  }
}

async function pullInbox(
  setSources: Dispatch<SetStateAction<DeskSource[]>>,
  inboxEpoch: { current: number },
) {
  const epoch = inboxEpoch.current;
  try {
    const response = await fetch("/api/inbox");
    const data = (await response.json()) as {
      clips?: Array<{
        id: string;
        url?: string;
        title: string;
        text: string;
        status: "ready" | "needs_paste";
        note?: string;
        origin: DeskSource["origin"];
      }>;
    };
    const clips = data.clips ?? [];
    if (epoch !== inboxEpoch.current) return;
    setSources((current) => {
      const known = new Set(current.map((source) => source.id));
      const fresh = clips
        .filter((clip) => !known.has(clip.id))
        .map((clip) => ({
          id: clip.id,
          url: clip.url,
          title: clip.title,
          text: clip.text,
          status: clip.status,
          note: clip.note,
          origin: clip.origin,
        }));
      return fresh.length ? [...fresh, ...current] : current;
    });
  } catch {
    // The inbox is best-effort. The desk still works from what is already on screen.
  }
}

function readStorage(): {
  sources: DeskSource[];
  brief: StoredBrief | null;
  draft: string;
  baseline: string;
  dismissed: string[];
  tab: Tab;
} | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      sources?: DeskSource[];
      brief?: StoredBrief | null;
      draft?: string;
      baseline?: string;
      dismissed?: string[];
      tab?: Tab;
    };
    if (!parsed || !Array.isArray(parsed.sources)) return null;
    return {
      sources: parsed.sources,
      brief: parsed.brief ?? null,
      draft: parsed.draft ?? "",
      baseline: parsed.baseline ?? "",
      dismissed: parsed.dismissed ?? [],
      tab: parsed.tab ?? "research",
    };
  } catch {
    return null;
  }
}

function dismissKey(issue: DraftIssue): string {
  return `${issue.category}::${issue.passage}`;
}

function hostOf(url: string | null): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

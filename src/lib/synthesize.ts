import { reconcileSourceCitations } from "@/lib/citations";
import { CURATED_BRIEF, isCuratedDemoSet } from "@/lib/demo-workspace";
import { completeJson, hasModelKey } from "@/lib/llm";
import { critiqueSchema, researchBriefSchema } from "@/lib/schemas";
import { splitSentences } from "@/lib/deterministic-analyzer";
import type { BriefMode, DraftIssue, ResearchBrief } from "@/lib/types";

export type BriefSource = {
  id: string;
  title: string;
  url?: string;
  text: string;
};

export type BriefResult = {
  brief: ResearchBrief;
  mode: BriefMode;
  droppedFacts: number;
  warning?: string;
};

const RESEARCH_SYSTEM = `You are the research desk for the newsletter "This Week in AI".
Synthesize across the sources. Do not summarize them one by one.
Return JSON with this shape:
{
  "headline": string,
  "dek": string,
  "whatHappened": string,
  "whyItMatters": { "founders": string, "builders": string, "operators": string },
  "whoShouldCare": string,
  "practicalImplication": string,
  "facts": [{ "claim": string, "quote": string, "sourceId": string }],
  "speculation": [{ "claim": string, "basis": string }],
  "angles": [{ "title": string, "hook": string, "whyNow": string }]
}
Rules:
- facts[].quote must be copied verbatim from that source's text. Do not paraphrase inside the quote.
- facts[].sourceId must be one of the ids provided.
- A company's benchmark is a fact about what the company reported, not an independent result. Say so in the claim.
- speculation is your reading. Do not put a quote there and pretend it is verified.
- angles: exactly 3, each a newsletter hook, not a headline that restates the press release.
- Write in plain sentences. No hype, no "delve", no "landscape".`;

const CRITIQUE_SYSTEM = `You are a copy desk for a technical newsletter.
The deterministic layer already flags long sentences, passive voice, filler, and unexplained jargon. Do not repeat those.
Flag only repetition, structural flow, unsupported claims, and places where a rewrite would sand off a technical distinction.
Return JSON: { "summary": string, "issues": [{ "category": "repetition" | "structure" | "unsupported" | "nuance", "passage": string, "explanation": string, "suggestion": string }] }
Rules:
- passage must be an exact substring of the draft.
- Never delete a proper name (a model, a program, a watermark) in order to sound simpler.
- suggestion must be prose that can replace the passage. If the right edit is a cut, suggestion may be an empty string.
- At most 6 issues. Prefer none to a vague one.`;

export async function buildResearchBrief(sources: BriefSource[]): Promise<BriefResult> {
  const ready = sources.filter((source) => source.text.trim().length > 0);
  if (ready.length === 0) {
    throw new Error("None of the sources have text yet.");
  }

  if (!hasModelKey() && isCuratedDemoSet(ready)) {
    const curated = reconcileSourceCitations(CURATED_BRIEF, ready);
    if (curated.dropped === 0) {
      return {
        brief: curated.brief,
        mode: "curated",
        droppedFacts: 0,
        warning: ready.length < 3 ? "Fewer than three sources. The brief is thinner than the desk prefers." : undefined,
      };
    }
  }

  if (hasModelKey()) {
    const modeled = await modelBrief(ready);
    if (modeled) return modeled;
  }

  const extractive = extractiveBrief(ready);
  const reconciled = reconcileSourceCitations(extractive, ready);
  return {
    brief: reconciled.brief.facts.length > 0 ? reconciled.brief : extractive,
    mode: "extractive",
    droppedFacts: reconciled.dropped,
    warning: hasModelKey()
      ? "The model reply could not be checked against the clips, so this is an extract."
      : "No model key is set. This is an extract of the clips, not a cross-source argument. Add an OpenAI, Groq, Gemini, or Anthropic key to synthesize.",
  };
}

async function modelBrief(sources: BriefSource[]): Promise<BriefResult | null> {
  const payload = sources
    .map((source) => {
      const text = source.text.length > 12_000 ? `${source.text.slice(0, 12_000)}\n\n[clipped]` : source.text;
      return `SOURCE ${source.id}\nTitle: ${source.title}\nURL: ${source.url || "(none)"}\n\n${text}`;
    })
    .join("\n\n----\n\n");

  const raw = await completeJson(RESEARCH_SYSTEM, payload);
  const parsed = researchBriefSchema.safeParse(raw);
  if (!parsed.success) return null;

  const brief: ResearchBrief = {
    ...parsed.data,
    angles: parsed.data.angles.map((angle, index) => ({
      id: angle.id || `angle-${index + 1}`,
      title: angle.title,
      hook: angle.hook,
      whyNow: angle.whyNow,
    })),
  };
  const reconciled = reconcileSourceCitations(brief, sources);
  if (reconciled.brief.facts.length === 0) return null;
  return {
    brief: reconciled.brief,
    mode: "model",
    droppedFacts: reconciled.dropped,
    warning:
      reconciled.dropped > 0
        ? `${reconciled.dropped} claim${reconciled.dropped === 1 ? "" : "s"} dropped because the quote was not in the clip.`
        : undefined,
  };
}

function extractiveBrief(sources: BriefSource[]): ResearchBrief {
  const lines = sources.flatMap((source) => {
    const first = splitSentences(source.text)[0]?.text ?? source.text.slice(0, 280);
    return first ? [`${source.title}: ${first}`] : [];
  });
  return {
    headline: `Notes from ${sources.length} clip${sources.length === 1 ? "" : "s"}`,
    dek: "An extract of what the clips actually say. Not an argument across them.",
    whatHappened: lines.slice(0, 4).join(" "),
    whyItMatters: {
      founders: "Not inferred. The stake for a founder has to be written from the clips, or by a model with a key set.",
      builders: "Not inferred. Look for a price, a gate, or an API change the clips state outright.",
      operators: "Not inferred. A procurement point that is not in the clips does not belong in the brief.",
    },
    whoShouldCare: "Whoever would change a decision if these clips are true.",
    practicalImplication: "If a page came back thin, paste the text you can see, then run the brief again.",
    facts: sources.slice(0, 6).map((source) => ({
      claim: `${source.title} says this in the clip.`,
      quote: splitSentences(source.text)[0]?.text ?? source.text.slice(0, 240),
      sourceId: source.id,
    })),
    speculation: [],
    angles: [
      {
        id: "what-shipped",
        title: "What actually shipped",
        hook: "Lead with the dated event, not the adjective in the headline.",
        whyNow: "The clips are what the desk has. The piece can only be as strong as they are.",
      },
      {
        id: "who-is-allowed",
        title: "Who is allowed to use it",
        hook: "The access rule may matter more than the benchmark.",
        whyNow: "A gate is something a reader can act on this week.",
      },
      {
        id: "what-it-costs",
        title: "What it costs to try",
        hook: "Put a number in the first screen if the clip contains one.",
        whyNow: "A price turns a launch into a budget line.",
      },
    ],
  };
}

export async function buildCritique(
  draft: string,
  sources: Array<{ id: string; title: string; text: string }>,
): Promise<{ summary: string; issues: DraftIssue[]; mode: "model" | "rules-only" }> {
  if (!hasModelKey()) {
    return {
      mode: "rules-only",
      summary:
        "No model key is set. The marks on the draft are from the desk rules: sentence length, passive voice, filler, jargon without a gloss, and figures that do not appear in the clips. An OpenAI, Groq, Gemini, or Anthropic key turns on the second pass.",
      issues: [],
    };
  }

  const sourceBlock = sources
    .map((source) => `${source.title}\n${source.text.slice(0, 6_000)}`)
    .join("\n\n");
  const raw = await completeJson(
    CRITIQUE_SYSTEM,
    `DRAFT\n${draft}\n\nSOURCES\n${sourceBlock || "(none)"}`,
  );
  const parsed = critiqueSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      mode: "rules-only",
      summary: "The model reply was not usable. The rule marks are still on the draft.",
      issues: [],
    };
  }

  const issues: DraftIssue[] = [];
  parsed.data.issues.forEach((issue, index) => {
    const start = draft.indexOf(issue.passage);
    if (start < 0) return;
    issues.push({
      id: `model:${index}:${start}`,
      category: issue.category,
      severity: "info",
      passage: issue.passage,
      start,
      end: start + issue.passage.length,
      explanation: issue.explanation,
      suggestion: issue.suggestion,
      source: "model",
    });
  });

  return { mode: "model", summary: parsed.data.summary, issues };
}

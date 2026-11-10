export type SourceOrigin = "manual" | "bookmarklet" | "extension" | "demo";

export type SourceStatus = "ready" | "needs_paste" | "fetching";

export type DeskSource = {
  id: string;
  title: string;
  url?: string;
  text: string;
  status: SourceStatus;
  note?: string;
  origin: SourceOrigin;
};

export type IssueCategory =
  | "long_sentence"
  | "passive_voice"
  | "filler"
  | "jargon"
  | "unsupported"
  | "repetition"
  | "structure"
  | "nuance";

export type IssueSeverity = "amber" | "red" | "info";

export type IssueOrigin = "rules" | "model";

export type DraftIssue = {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  passage: string;
  start: number;
  end: number;
  explanation: string;
  suggestion: string;
  source: IssueOrigin;
};

export type WritingMetrics = {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  averageSentenceLength: number;
  longestParagraphWords: number;
  fleschKincaidGrade: number;
  readingTimeMinutes: number;
};

export type BriefMode = "curated" | "extractive" | "model";

export type ResearchBrief = {
  headline: string;
  dek: string;
  whatHappened: string;
  whyItMatters: {
    founders: string;
    builders: string;
    operators: string;
  };
  whoShouldCare: string;
  practicalImplication: string;
  facts: Array<{
    claim: string;
    quote: string;
    sourceId: string;
  }>;
  speculation: Array<{
    claim: string;
    basis: string;
  }>;
  angles: Array<{
    id: string;
    title: string;
    hook: string;
    whyNow: string;
  }>;
};

export type StoredBrief = {
  brief: ResearchBrief;
  mode: BriefMode;
  warning?: string;
  droppedFacts: number;
};

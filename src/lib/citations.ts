import type { ResearchBrief } from "@/lib/types";
import { escapeRegExp } from "@/lib/words";

export type CitationSource = {
  id: string;
  text: string;
};

/**
 * A claim survives only when its quote is actually in the clip for that
 * source. Whitespace and case can differ. The words cannot.
 */
export function reconcileSourceCitations(
  brief: ResearchBrief,
  sources: CitationSource[],
): { brief: ResearchBrief; dropped: number } {
  const byId = new Map(sources.map((source) => [source.id, source.text]));
  const facts = brief.facts.filter((fact) => {
    const text = byId.get(fact.sourceId);
    if (!text) return false;
    return findQuote(text, fact.quote) !== null;
  });
  return {
    brief: { ...brief, facts },
    dropped: brief.facts.length - facts.length,
  };
}

export function findQuote(
  text: string,
  quote: string,
): { start: number; end: number } | null {
  const exact = text.indexOf(quote);
  if (exact >= 0) return { start: exact, end: exact + quote.length };
  const parts = quote
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => escapeRegExp(part));
  if (parts.length === 0) return null;
  const match = new RegExp(parts.join("\\s+"), "i").exec(text);
  if (!match) return null;
  return { start: match.index, end: match.index + match[0].length };
}

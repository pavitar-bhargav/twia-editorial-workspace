import type { DraftIssue, WritingMetrics } from "@/lib/types";
import { countWords, escapeRegExp, tokenizeWords, WORD_PATTERN } from "@/lib/words";

/**
 * The grade level is a diagnostic, not a target. A precise sentence about a
 * safeguard boundary can score "worse" than a vague short one and still be
 * the sentence the newsletter needs. The thresholds below are desk rules
 * (25 / 35 words), chosen because they are explainable to a writer.
 */
const READING_WPM = 238;
const LONG_SENTENCE = 25;
const HARD_SENTENCE = 35;

const ABBREVIATION =
  /(?:^|[^A-Za-z])(e\.g|i\.e|U\.S|U\.K|Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|Co|Corp|vs|etc|Fig|No|St|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)$/i;

const AUXILIARY =
  "am|is|are|was|were|be|been|being|get|gets|got|gotten";

const IRREGULAR_PARTICIPLES = new Set([
  "made", "given", "taken", "written", "found", "built", "told", "shown",
  "done", "seen", "known", "begun", "chosen", "driven", "eaten", "fallen",
  "felt", "forgotten", "held", "kept", "left", "lost", "meant", "met",
  "paid", "put", "read", "run", "sold", "sent", "set", "sat", "spoken",
  "spent", "stood", "taught", "thought", "understood", "won", "worn",
  "drawn", "grown", "heard", "hit", "hurt", "led", "let", "lit", "cut",
  "cost", "caught", "brought", "bought", "broken", "stolen", "thrown",
  "borne", "bound", "dealt", "fed", "fought", "hung", "laid", "lent",
  "ridden", "risen", "shaken", "shut", "sung", "sunk", "swept", "swung",
  "torn", "become", "come", "gone", "proven", "flown", "blown", "born",
  "said", "shown", "overcome", "rebuilt", "undone", "withdrawn", "forgiven",
  "frozen", "hidden", "held", "kept", "known", "laid", "lain", "led",
  "misled", "sown", "sped", "spun", "sprung", "struck", "strung", "stuck",
  "stung", "sung", "sunk", "sworn", "swum", "taken", "told", "woken",
  "wound", "written", "wrung", "broadcast", "burst", "cast", "shed", "shot",
]);

/**
 * These look like participles and usually aren't actions the writer should
 * recast. "Was interested" is a state. "Was indeed" is an adverb the
 * pattern would otherwise steal.
 */
const NOT_PARTICIPLES = new Set([
  "interested", "concerned", "excited", "tired", "pleased", "satisfied",
  "surprised", "worried", "convinced", "complicated", "detailed",
  "unexpected", "prepared", "located", "scheduled", "united", "related",
  "supposed", "accustomed", "ashamed", "limited", "based", "indeed",
  "naked", "sacred", "beloved", "rugged", "learned", "alleged", "wicked",
  "hundred", "supposed",
]);

type Filler = {
  label: string;
  pattern: RegExp;
  replacement: string;
  why: string;
};

function filler(
  source: string,
  replacement: string,
  why: string,
): Filler {
  return {
    label: source.replace(/\\s\+|\\b|\\s\*/g, " ").trim(),
    pattern: new RegExp(source, "gi"),
    replacement,
    why,
  };
}

const ceremony =
  "The phrase announces that a point is coming and then delays it.";

export const FILLER_PHRASES: readonly Filler[] = [
  filler("it is important to note that\\s+", "", ceremony),
  filler("it is worth noting that\\s+", "", ceremony),
  filler("it should be noted that\\s+", "", ceremony),
  filler("it is clear that\\s+", "", "If it is clear, the sentence can start at the fact."),
  filler("it is evident that\\s+", "", "If it is evident, start at the fact."),
  filler("it goes without saying that\\s+", "", "Then don't say it."),
  filler("it goes without saying,?\\s*", "", "Then don't say it."),
  filler("needless to say,?\\s*", "", "If it is needless, cut it."),
  filler("\\bdue to the fact that\\b", "because", "“Because” carries the same relation in one word."),
  filler("\\bin light of the fact that\\b", "because", "“Because” carries the same relation in one word."),
  filler("\\bin spite of the fact that\\b", "although", "“Although” is the relation. The rest is padding."),
  filler("\\bthe fact that\\b", "that", "“The fact that” adds a noun and no fact."),
  filler("\\bin the event that\\b", "if", "“If” is the condition."),
  filler("\\bin order to\\b", "to", "“To” already marks the purpose."),
  filler("\\bin order for\\b", "for", "“For” already marks the purpose."),
  filler("\\bin an effort to\\b", "to", "The effort is implied by the verb that follows."),
  filler("\\bfor the purpose of\\b", "to", "“To” is the purpose."),
  filler("at the end of the day,?\\s*", "", "A clock phrase standing in for a conclusion."),
  filler("\\bat this point in time\\b", "now", "“Now” is the time."),
  filler("\\bparadigm shifts?\\b", "change", "Name the change. “Paradigm” is a drumroll."),
  filler("\\brevolutionize[sd]?\\b", "change", "Say what changed. “Revolutionize” is a verdict without a mechanism."),
  filler("\\brevolutionise[sd]?\\b", "change", "Say what changed. “Revolutionise” is a verdict without a mechanism."),
  filler("\\bgame-changers?\\b", "real change", "Say what the change is, or the label is doing the thinking."),
  filler("\\bgame changers?\\b", "real change", "Say what the change is, or the label is doing the thinking."),
  filler("\\bcutting-edge\\b", "new", "“New” is checkable. “Cutting-edge” is a mood."),
  filler("\\bstate-of-the-art\\b", "current", "Say current relative to what, or just say current."),
  filler("\\bnext-generation\\b", "new", "A generation needs a predecessor. Otherwise it is an adjective of praise."),
  filler("\\bleverage\\b", "use", "“Use” is plainer and usually what was meant."),
  filler("\\butilize\\b", "use", "“Use” is the verb."),
  filler("\\butilise\\b", "use", "“Use” is the verb."),
  filler("\\bin terms of\\b", "in", "The framing can usually go."),
  filler("\\bwhen it comes to\\b", "for", "“For” gets there sooner."),
  filler("\\ba large number of\\b", "many", "“Many” is the quantity."),
  filler("for all intents and purposes,?\\s*", "", "The hedge is larger than the claim it protects."),
  filler("as a matter of fact,?\\s*", "", "Start at the fact."),
  filler("in today's world,?\\s*", "", "The reader already lives there."),
  filler("in this day and age,?\\s*", "", "The reader already lives there."),
  filler("\\bgoing forward\\b,?\\s*", "", "Time was already moving that way."),
  filler("\\bmoving forward\\b,?\\s*", "", "Time was already moving that way."),
  filler("\\beach and every\\b", "each", "One determiner is enough."),
  filler("first and foremost,?\\s*", "first, ", "One ordinal is enough."),
  filler("last but not least,?\\s*", "finally, ", "The apology for arriving last can go."),
  filler("\\bon a regular basis\\b", "regularly", "The adverb exists."),
  filler("\\bhas the ability to\\b", "can", "“Can” is the ability."),
  filler("\\bwith regard to\\b", "about", "“About” is the relation."),
  filler("\\bwith respect to\\b", "about", "“About” is the relation."),
  filler("as previously mentioned,?\\s*", "", "If it matters again, say it again properly."),
  filler("make no mistake,?\\s*", "", "A throat-clearing command."),
  filler("rest assured,?\\s*", "", "Assurance is not a fact."),
  filler("\\bgroundbreaking\\b", "notable", "“Notable” leaves room to say why."),
  filler("\\brevolutionary\\b", "unusual", "“Unusual” can be checked. “Revolutionary” cannot, not in this sentence."),
  filler("\\bseamlessly\\b", "", "Seamless is a claim about someone else's experience. Cut it or show the seam."),
  filler("\\bdelve into\\b", "look at", "“Look at” is the action."),
  filler("the reality is that\\s+", "", "Start at the reality."),
];

type Jargon = {
  term: string;
  pattern: RegExp;
  gloss: string;
};

function jargon(term: string, gloss: string, pattern = `\\b${escapeRegExp(term)}\\b`): Jargon {
  return { term, pattern: new RegExp(pattern, "gi"), gloss };
}

export const JARGON_TERMS: readonly Jargon[] = [
  jargon("RLHF", "reinforcement learning from human feedback"),
  jargon("MoE", "a mixture of experts, several specialist sub-models under one router"),
  jargon("KV-cache", "the attention keys and values a model stores so it can reuse earlier tokens", "\\bKV-?cache\\b"),
  jargon("quantization", "storing weights at lower numeric precision"),
  jargon("inference-time compute", "extra computation spent while answering, rather than during training"),
  jargon("speculative decoding", "a small model proposes tokens and a larger one checks them"),
  jargon("paged attention", "attention memory split into pages so a server can share it"),
  jargon("RAG", "retrieval-augmented generation, answers grounded in fetched documents"),
  jargon("LoRA", "a low-rank adapter used to fine-tune a model without retraining all of it"),
  jargon("QLoRA", "LoRA run on a quantized base model"),
  jargon("SFT", "supervised fine-tuning"),
  jargon("DPO", "direct preference optimization"),
  jargon("PPO", "proximal policy optimization"),
  jargon("GRPO", "group relative policy optimization"),
  jargon("SynthID", "Google's watermark for synthetic media"),
  jargon("FP8", "8-bit floating point"),
  jargon("FP4", "4-bit floating point"),
  jargon("INT8", "8-bit integers"),
  jargon("INT4", "4-bit integers"),
  jargon("AWQ", "activation-aware weight quantization"),
  jargon("GPTQ", "a post-training quantization method"),
  jargon("HNSW", "a graph index for approximate nearest-neighbor search"),
  jargon("vLLM", "an engine for serving large language models"),
  jargon("NCCL", "NVIDIA's library for moving data between GPUs"),
];

const GLOSS_STOP = new Set([
  "model", "models", "using", "which", "their", "about", "while", "where",
  "stored", "across", "lower", "extra", "during", "method", "search",
  "large", "serving", "library", "google", "applied", "rather", "under",
  "several", "earlier", "tokens", "token", "between", "without", "retraining",
  "answers", "documents", "point", "floating",
]);

/** Readers of this newsletter already know these. Flagging them is noise. */
const ACRONYM_ALLOW = new Set([
  "AI", "API", "URL", "HTTP", "HTTPS", "CSS", "HTML", "JSON", "GPU", "CPU",
  "SDK", "CLI", "UI", "UX", "FAQ", "EU", "US", "UK", "OK", "ID", "PDF",
  "RSS", "SQL", "GPT", "AWS", "GCP", "CEO", "CTO", "CFO", "SEO", "CSV",
  "XML", "YAML", "REST", "SSH", "TLS", "DNS", "CDN", "VPC", "SSO", "MFA",
  "IAM", "SKU", "FPS", "USB", "NLP", "LLM",
]);

export type SentenceSpan = { text: string; start: number; end: number };

export function splitSentences(text: string): SentenceSpan[] {
  const spans: SentenceSpan[] = [];
  let start = 0;

  const push = (from: number, to: number) => {
    const raw = text.slice(from, to);
    if (!raw.trim()) return;
    const lead = raw.length - raw.trimStart().length;
    const trail = raw.length - raw.trimEnd().length;
    spans.push({
      text: raw.trim(),
      start: from + lead,
      end: to - trail,
    });
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (ch === "." && (text[i + 1] === "." || text[i - 1] === ".")) continue;
    if (ch === "." && /[A-Za-z0-9]/.test(text[i + 1] ?? "")) continue;
    if (ch === "." && isAbbreviation(text, i)) continue;

    let j = i + 1;
    while (j < text.length && /["'”’)\]]/.test(text[j])) j++;
    if (j < text.length && !/\s/.test(text[j])) continue;

    push(start, j);
    start = j;
    while (start < text.length && /\s/.test(text[start])) start++;
    i = start - 1;
  }

  if (start < text.length) push(start, text.length);
  return spans;
}

function isAbbreviation(text: string, dotIndex: number): boolean {
  return ABBREVIATION.test(text.slice(Math.max(0, dotIndex - 12), dotIndex));
}

function isParticiple(word: string): boolean {
  const value = word.toLowerCase();
  if (NOT_PARTICIPLES.has(value)) return false;
  if (IRREGULAR_PARTICIPLES.has(value)) return true;
  if (value.length < 5) return false;
  return value.endsWith("ed") || value.endsWith("en");
}

function clauseSubject(before: string): { prefix: string; subject: string } {
  // Cut at punctuation, not at "and". A compound like "click and type" is one subject.
  const markers = ["; ", ", ", ". ", "! ", "? "];
  const lower = before.toLowerCase();
  let cut = 0;
  for (const marker of markers) {
    const index = lower.lastIndexOf(marker);
    if (index >= 0 && index + marker.length >= cut) cut = index + marker.length;
  }
  const subject = before
    .slice(cut)
    .trim()
    .replace(/^(as|that|which|while|because|and|but|when)\s+/i, "");
  const subjectAt = subject ? before.lastIndexOf(subject) : -1;
  return {
    prefix: subjectAt > 0 ? before.slice(0, subjectAt).trimEnd() : "",
    subject,
  };
}

type PassiveHit = {
  start: number;
  end: number;
  suggestion: string | null;
};

function findPassives(sentence: string): PassiveHit[] {
  const pattern = new RegExp(
    `\\b(${AUXILIARY})\\s+((?:[a-z]+ly)\\s+)?([A-Za-z]+)\\b`,
    "gi",
  );
  const hits: PassiveHit[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(sentence))) {
    const participle = match[3];
    if (!isParticiple(participle)) continue;
    const modal = sentence.slice(0, match.index).match(/([A-Za-z]+)\s*$/);
    if (modal && /^(may|might|can|could|should|would|shall|must|will)$/i.test(modal[1])) continue;

    const adverb = match[2] ?? "";
    const verbStart = match.index;
    const after = sentence.slice(pattern.lastIndex);
    const agentTail = "(?=\\s+(?:at|in|on|for|with|from|to|that|while)\\b|[.?!,]|$)";
    const direct = after.match(new RegExp(`^\\s+by\\s+([^,.;]+?)${agentTail}`, "i"));
    const withComplement = after.match(new RegExp(`^\\s+(.+?)\\s+by\\s+([^,.;]+?)${agentTail}`, "i"));
    const by = direct
      ? { complement: "", agent: direct[1], length: direct[0].length }
      : withComplement
        ? { complement: withComplement[1], agent: withComplement[2], length: withComplement[0].length }
        : null;

    if (by) {
      const complement = by.complement.trim();
      const agent = by.agent.trim();
      const fullEnd = pattern.lastIndex + by.length;
      const { subject } = clauseSubject(sentence.slice(0, verbStart));
      if (!subject) continue;
      const subjectAt = sentence.lastIndexOf(subject, verbStart);
      const start = subjectAt >= 0 ? subjectAt : verbStart;
      let suggestion = `${agent} ${adverb}${participle} ${subject}${complement ? ` ${complement}` : ""}`
        .replace(/\s+/g, " ")
        .trim();
      if (start === 0) suggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
      hits.push({ start, end: fullEnd, suggestion });
      pattern.lastIndex = fullEnd;
      continue;
    }

    const { subject } = clauseSubject(sentence.slice(0, verbStart));
    const subjectAt = subject ? sentence.lastIndexOf(subject, verbStart) : -1;
    const start = subjectAt >= 0 ? subjectAt : verbStart;
    hits.push({ start, end: pattern.lastIndex, suggestion: null });
  }

  return hits;
}

const FINITE_VERB =
  /^(is|are|was|were|has|have|had|will|can|could|should|would|may|might|must|do|does|did|made|said|went|kept|let|put|got|left|took|came|gave|told|found|shipped)$|ed$/i;

function hasFiniteVerbSoon(clause: string): boolean {
  const words = tokenizeWords(clause).slice(0, 6);
  return words.some((word) => FINITE_VERB.test(word.replace(/[^a-z]/gi, "")));
}

function splitLongSentence(sentence: string): string {
  WORD_PATTERN.lastIndex = 0;
  const words = [...sentence.matchAll(WORD_PATTERN)];
  if (words.length < LONG_SENTENCE + 1) return sentence;
  const joints = ["; ", ", and ", ", but ", ", because ", ", as "];
  const lower = sentence.toLowerCase();
  const mid = words[Math.floor(words.length / 2)]?.index ?? Math.floor(sentence.length / 2);
  const candidates: Array<{ index: number; length: number; distance: number }> = [];

  for (const joint of joints) {
    let from = 0;
    while (from < lower.length) {
      const index = lower.indexOf(joint, from);
      if (index === -1) break;
      const wordIndex = words.findIndex((word) => (word.index ?? 0) >= index);
      const fromEdge = Math.min(wordIndex, words.length - wordIndex);
      if (wordIndex > 6 && fromEdge > 6) {
        candidates.push({ index, length: joint.length, distance: Math.abs(index - mid) });
      }
      from = index + joint.length;
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  for (const candidate of candidates) {
    let left = sentence.slice(0, candidate.index).trim().replace(/[,:;]\s*$/, "");
    let right = sentence.slice(candidate.index + candidate.length).trim();
    if (!left || !right) continue;
    if (/^(at|which|for|to|by|with|from|of|and|or|that|while)\b/i.test(right)) continue;
    if (countWords(left) < 8 || countWords(right) < 8) continue;
    // A joint before a noun phrase ("the price at which…") produces a fragment, not a sentence.
    if (!hasFiniteVerbSoon(right)) continue;
    if (!/[.!?]$/.test(left)) left = `${left}.`;
    right = right.charAt(0).toUpperCase() + right.slice(1);
    if (!/[.!?]$/.test(right)) right = `${right}.`;
    return `${left} ${right}`;
  }

  return sentence;
}

function glossNearby(text: string, index: number, term: string, gloss: string): boolean {
  const windowText = text
    .slice(Math.max(0, index - 160), index + term.length + 180)
    .toLowerCase();
  const after = text.slice(index + term.length, index + term.length + 60);
  if (/^\s*\([^)]{4,}\)/.test(after)) return true;
  const words = gloss
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 5 && !GLOSS_STOP.has(word));
  return words.some((word) => new RegExp(`\\b${word}\\b`).test(windowText));
}

function syllableCount(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const groups = cleaned
    .replace(/e$/, "")
    .replace(/[^aeiouy]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return Math.max(1, groups.length);
}

export function computeDeterministicMetrics(text: string): WritingMetrics {
  const trimmed = text.trim();
  const words = tokenizeWords(trimmed);
  const sentences = splitSentences(trimmed).filter((sentence) => countWords(sentence.text) > 0);
  const paragraphs = trimmed
    ? trimmed.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];
  const sentenceCount = Math.max(sentences.length, trimmed ? 1 : 0);
  const wordCount = words.length;
  const syllables = words.reduce((sum, word) => sum + syllableCount(word), 0);
  const averageSentenceLength = wordCount === 0 ? 0 : wordCount / sentenceCount;
  const fleschKincaidGrade = wordCount === 0
    ? 0
    : 0.39 * averageSentenceLength + 11.8 * (syllables / wordCount) - 15.59;
  const longestParagraphWords = paragraphs.reduce(
    (max, paragraph) => Math.max(max, countWords(paragraph)),
    0,
  );

  return {
    wordCount,
    sentenceCount: trimmed ? sentences.length : 0,
    paragraphCount: paragraphs.length,
    averageSentenceLength: round1(averageSentenceLength),
    longestParagraphWords,
    fleschKincaidGrade: round1(Math.max(0, fleschKincaidGrade)),
    readingTimeMinutes: wordCount / READING_WPM,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function analyzeDraft(text: string): { metrics: WritingMetrics; issues: DraftIssue[] } {
  const metrics = computeDeterministicMetrics(text);
  const issues: DraftIssue[] = [];

  for (const sentence of splitSentences(text)) {
    const words = countWords(sentence.text);
    if (words > LONG_SENTENCE) {
      const severe = words > HARD_SENTENCE;
      issues.push({
        id: `long:${sentence.start}`,
        category: "long_sentence",
        severity: severe ? "red" : "amber",
        passage: sentence.text,
        start: sentence.start,
        end: sentence.end,
        explanation: severe
          ? `This sentence is ${words} words. Past ${HARD_SENTENCE}, even a careful reader loses the joint. Split it before you decorate it.`
          : `This sentence is ${words} words. Past ${LONG_SENTENCE}, the point arrives after the reader has started holding clauses in memory.`,
        suggestion: splitLongSentence(sentence.text),
        source: "rules",
      });
    }

    for (const hit of findPassives(sentence.text)) {
      const passage = sentence.text.slice(hit.start, hit.end);
      issues.push({
        id: `passive:${sentence.start + hit.start}`,
        category: "passive_voice",
        severity: "info",
        passage,
        start: sentence.start + hit.start,
        end: sentence.start + hit.end,
        explanation: hit.suggestion
          ? "A form of “to be” is carrying the action, so the reader meets the verb before the actor. Lead with whoever did it."
          : "A form of “to be” is carrying the action, and the sentence never names an actor. The desk will not invent one.",
        suggestion: hit.suggestion ?? passage,
        source: "rules",
      });
    }
  }

  const occupied: Array<{ start: number; end: number }> = [];
  const fillers = [...FILLER_PHRASES].sort((a, b) => b.label.length - a.label.length);
  for (const entry of fillers) {
    entry.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = entry.pattern.exec(text))) {
      const start = match.index;
      const end = start + match[0].length;
      if (occupied.some((span) => start < span.end && end > span.start)) continue;
      occupied.push({ start, end });
      const passage = match[0];
      issues.push({
        id: `filler:${start}`,
        category: "filler",
        severity: "info",
        passage,
        start,
        end,
        explanation: entry.why,
        suggestion: entry.replacement,
        source: "rules",
      });
      if (match[0].length === 0) entry.pattern.lastIndex += 1;
    }
  }

  const coveredTerms = new Set<string>();
  for (const entry of JARGON_TERMS) {
    entry.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = entry.pattern.exec(text))) {
      const start = match.index;
      const passage = match[0];
      if (glossNearby(text, start, passage, entry.gloss)) continue;
      coveredTerms.add(passage.toLowerCase());
      const host = sentenceAround(text, start);
      const withholding = /do not explain|did not explain|didn't explain|not disclosed|without explaining|never explain/i.test(host);
      issues.push({
        id: `jargon:${start}:${entry.term}`,
        category: "jargon",
        severity: "info",
        passage,
        start,
        end: start + passage.length,
        explanation: withholding
          ? `“${passage}” has no gloss. This sentence may be withholding the definition on purpose — dismiss the suggestion if spelling it out would pretend the source explained it.`
          : `“${passage}” is doing specialist work with no gloss nearby. A reader outside the lab will skip the clause or pretend they followed it.`,
        suggestion: `${passage} (${entry.gloss})`,
        source: "rules",
      });
    }
  }

  const acronym = /\b[A-Z]{3,6}\b/g;
  let acronymMatch: RegExpExecArray | null;
  while ((acronymMatch = acronym.exec(text))) {
    const passage = acronymMatch[0];
    if (ACRONYM_ALLOW.has(passage)) continue;
    if (coveredTerms.has(passage.toLowerCase())) continue;
    if (JARGON_TERMS.some((entry) => entry.term.toLowerCase() === passage.toLowerCase())) continue;
    if (glossNearby(text, acronymMatch.index, passage, "")) continue;
    const after = text.slice(acronymMatch.index + passage.length, acronymMatch.index + passage.length + 48);
    if (/^\s*\(/.test(after)) continue;
    issues.push({
      id: `jargon:${acronymMatch.index}:${passage}`,
      category: "jargon",
      severity: "info",
      passage,
      start: acronymMatch.index,
      end: acronymMatch.index + passage.length,
      explanation: `“${passage}” is an unexplained acronym. Spell it out on first use, or dismiss this if this audience already lives with it.`,
      suggestion: `${passage} (spell out on first use)`,
      source: "rules",
    });
  }

  return { metrics, issues };
}

function sentenceAround(text: string, index: number): string {
  const sentences = splitSentences(text);
  return sentences.find((sentence) => index >= sentence.start && index < sentence.end)?.text ?? text;
}

export function findUngroundedNumbers(
  draft: string,
  sources: Array<{ text: string }>,
): DraftIssue[] {
  if (!draft.trim() || sources.length === 0) return [];
  const corpus = sources.map((source) => source.text).join("\n");
  const issues: DraftIssue[] = [];

  for (const sentence of splitSentences(draft)) {
    const numbers = sentence.text.match(/\b\d{2,}(?:\.\d+)?%?|\b\d+\.\d+\b/g) ?? [];
    const missing = [...new Set(numbers.map(stripPercent))].filter(
      (token) => !corpusHasNumber(corpus, token),
    );
    if (missing.length === 0) continue;
    const shown = missing.slice(0, 3).join(", ");
    issues.push({
      id: `claim:${sentence.start}`,
      category: "unsupported",
      severity: "red",
      passage: sentence.text,
      start: sentence.start,
      end: sentence.end,
      explanation: `The figure ${shown} is not in any clipped source. A newsletter can report what a lab published. It cannot grow a number in the gap.`,
      suggestion: "",
      source: "rules",
    });
  }

  return issues;
}

function stripPercent(token: string): string {
  return token.endsWith("%") ? token.slice(0, -1) : token;
}

function corpusHasNumber(corpus: string, token: string): boolean {
  const pattern = new RegExp(`(?<![\\d.])${escapeRegExp(token)}(?![\\d.])`);
  return pattern.test(corpus);
}

export const READING_WORDS_PER_MINUTE = READING_WPM;

import { reconcileSourceCitations } from "../src/lib/citations";
import {
  analyzeDraft,
  FILLER_PHRASES,
  findUngroundedNumbers,
  splitSentences,
} from "../src/lib/deterministic-analyzer";
import { CURATED_BRIEF, DEMO_SOURCES, FLAWED_DRAFT, POLISHED_DRAFT } from "../src/lib/demo-workspace";
import { countWords } from "../src/lib/words";

let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

const opening = splitSentences(FLAWED_DRAFT)[0];
check("opening sentence is 34 words", countWords(opening?.text ?? "") === 34, String(countWords(opening?.text ?? "")));

const analysis = analyzeDraft(FLAWED_DRAFT);
const long = analysis.issues.filter((issue) => issue.category === "long_sentence");
check("34-word sentence is amber, not red", long.some((issue) => issue.severity === "amber" && issue.passage.startsWith("This week")));
check("no red long sentence in the flawed draft", long.every((issue) => issue.severity !== "red"));

const severe = analyzeDraft(
  "One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone thirtytwo thirtythree thirtyfour thirtyfive thirtysix.",
);
check(
  "36-word sentence is red",
  severe.issues.some((issue) => issue.category === "long_sentence" && issue.severity === "red"),
);

const categories = new Set(analysis.issues.map((issue) => issue.category));
check("flags passive voice", categories.has("passive_voice"));
check("flags filler", categories.has("filler"));
check("flags jargon", categories.has("jargon"));

const fillerLabels = analysis.issues
  .filter((issue) => issue.category === "filler")
  .map((issue) => issue.passage.toLowerCase());
for (const phrase of ["paradigm shift", "revolutionize", "it is important to note that", "needless to say", "in order to", "due to the fact that", "at the end of the day", "game-changer", "cutting-edge", "leverage"]) {
  check(`filler includes “${phrase}”`, fillerLabels.some((label) => label.includes(phrase)));
}
check("filler dictionary has 40 or more phrases", FILLER_PHRASES.length >= 40, String(FILLER_PHRASES.length));

const jargon = analysis.issues.filter((issue) => issue.category === "jargon").map((issue) => issue.passage);
check("flags RLHF", jargon.includes("RLHF"));
check("flags KV-cache", jargon.some((term) => /kv-?cache/i.test(term)));
check("flags quantization", jargon.some((term) => /quantization/i.test(term)));
check(
  "does not flag SynthID once watermark sits beside it",
  !jargon.some((term) => /synthid/i.test(term)),
);

const explained = analyzeDraft("RLHF (reinforcement learning from human feedback) trained the preference model.");
check(
  "glossed RLHF is not flagged",
  !explained.issues.some((issue) => issue.passage === "RLHF"),
);

const quiet = analyzeDraft("The editor was interested in the price. She was going to ship the note. Dr. Ng published a paper. Version 5.1 shipped on Monday.");
check(
  "does not flag “was interested” or “was going”",
  !quiet.issues.some((issue) => issue.category === "passive_voice"),
);
check("abbreviation and decimal do not invent sentences", splitSentences(quiet.metrics ? "Dr. Ng published a paper. The lab replied." : "").length === 2);
check(
  "Dr. Ng sentence stays intact",
  splitSentences("Dr. Ng published a paper. The lab replied.").length === 2,
);
check(
  "version number stays one sentence",
  splitSentences("Version 5.1 shipped on Monday.").length === 1,
);

const fragmentSentence =
  "For each workflow — support, a coding agent, security review, campaign video — write the model you may call, the model you may not, and the price at which the workflow stops making sense.";
const fragmentIssue = analyzeDraft(fragmentSentence).issues.find((issue) => issue.category === "long_sentence");
check(
  "a noun-phrase joint is not offered as a split",
  fragmentIssue?.passage === fragmentSentence && fragmentIssue.suggestion === fragmentSentence,
  fragmentIssue?.suggestion,
);

const rebundled = analysis.issues.find((issue) => issue.category === "passive_voice" && /rebundled/.test(issue.passage));
check(
  "passive rewrite keeps the real subject",
  rebundled?.suggestion === "the labs quietly rebundled frontier access",
  rebundled?.suggestion,
);
const shipped = analysis.issues.find(
  (issue) => issue.category === "passive_voice" && issue.passage.includes("was shipped by Anthropic"),
);
check(
  "passive rewrite names Anthropic",
  Boolean(shipped?.suggestion.startsWith("Anthropic shipped")),
  shipped?.suggestion,
);
const introduced = analysis.issues.find((issue) => issue.passage.includes("was introduced in public beta by Anthropic"));
check(
  "passive rewrite keeps the complement",
  Boolean(introduced?.suggestion.startsWith("Anthropic introduced") && introduced.suggestion.includes("public beta")),
  introduced?.suggestion,
);

const claims = findUngroundedNumbers(FLAWED_DRAFT, DEMO_SOURCES);
check(
  "11x is ungrounded",
  claims.some((issue) => issue.passage.includes("11x")),
);
check(
  "published prices are not flagged as ungrounded",
  !claims.some((issue) => issue.passage.includes("$0.55") || issue.passage.includes("49.0%")),
);

const grounded = reconcileSourceCitations(CURATED_BRIEF, DEMO_SOURCES);
check("curated brief drops no facts", grounded.dropped === 0, String(grounded.dropped));
check("curated brief keeps at least eight facts", grounded.brief.facts.length >= 8);

const polishedWords = countWords(POLISHED_DRAFT);
check("polished piece is 380–450 words", polishedWords >= 380 && polishedWords <= 450, String(polishedWords));

const metrics = analysis.metrics;
check("metrics count words", metrics.wordCount > 200);
check("reading time uses 238 wpm", Math.abs(metrics.readingTimeMinutes - metrics.wordCount / 238) < 0.001);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  console.log("\n--- flawed issues ---");
  for (const issue of analysis.issues) {
    console.log(`\n[${issue.category}] ${issue.passage}`);
    console.log(`→ ${issue.suggestion || "(cut)"}`);
  }
  process.exit(1);
}

console.log(`\npolished words: ${polishedWords}`);
console.log(`flawed issues: ${analysis.issues.length}`);

# Product and engineering note

The user is a working editor at This Week in AI. They already know how to find links. The slow, risky part is the gap between a pile of tabs and a draft they are willing to publish: holding three stories in their head at once, and then not being able to see which sentence is a fact and which sentence is them.

## Product thinking

### Who is the primary user?

One editor on a weekly desk, writing for founders, builders, and operators who do not read model cards for fun. Not a general “AI writer.” Not a newsroom of fifty. The interface assumes they will disagree with the tool and that the disagreement is the product.

Secondary user, deliberately unsupported: a second editor on another machine. The clip inbox is local process memory. Sharing it would be a different product.

### What problem did I choose?

Synthesis-to-draft friction, and the trust problem underneath it. Summaries are cheap. An editor does not publish a summary. They publish a claim, and they get burned when the claim is a paraphrase that the source does not actually contain, or when a writing tool sands a technical distinction into something smoother and wrong.

So the desk does two narrow jobs. It turns a set of clips into one argument with the facts pinned to quotes. It then lets the editor move that argument into a draft without giving the software permission to rewrite the piece on its own.

### What is the core workflow?

1. Clip or paste at least three sources. A failed fetch does not block the others.
2. Synthesize a brief. Read the fact list and open Verify on anything that will carry a sentence in the piece.
3. Start a draft from one angle. The brief’s sections become a scaffold, not a finished lede.
4. Edit. Rules mark the draft as you type. Accept or dismiss each mark. The model critique is a second pass, requested, and it is told not to repeat the rules.
5. Compare with the baseline before you trust the new version. Revert if the comparison looks like a different article.

The curated demo is that workflow with the research already done, so a reviewer can see it in one click.

### What I built, and what I cut

Built: inbox, fetch with paste fallback, bookmarklet, Chrome extension, grounded brief, three angles, draft marks, accept/dismiss, baseline diff, metrics with an explanation, demo, sample, this note.

Cut, on purpose:

- Accounts, publishing, and sending the newsletter. The job ends at a draft.
- Rewrite-all. A button that applies every suggestion would hide the decision the editor is here to make.
- Full version history. One baseline is enough to answer “what did I start from?” A timeline is a second product.
- Scraping X. It does not return a stable article. The inbox asks for a paste.
- Treating the Flesch–Kincaid grade as a score to beat.
- A collaborative inbox. Two editors would need a real store. This one is a single Node process.

### How I would know it is useful

Three numbers, read together, because any one of them can be gamed.

- **Suggestion acceptance by category.** Accept divided by accept plus dismiss. A high rate on filler is healthy. A high rate on jargon is a warning: the tool may be talking the editor out of precision. Review the jargon dismissals by hand.
- **Time to first publishable draft.** From “sources are ready” to the moment the editor sets a new baseline they would actually send. The demo is a proxy, not the metric.
- **Citation verification before a draft starts.** Share of facts where Verify was opened before “Start draft from this angle.” If that number is near zero, the quote check is decoration and the editor is trusting the prose.

I would not ship a dashboard of these until the events exist. The desk records the actions. It does not pretend to have a month of them.

## Engineering

### How is it structured?

Next.js App Router, one client desk, four routes.

`/api/inbox` receives the bookmarklet and the extension and keeps a short in-memory list the page polls. `/api/extract` fetches one URL. `/api/research` builds the brief. `/api/critique` asks for the second-pass notes. Zod parses every body and every model payload before the UI sees it. A bad payload becomes an error string, not a crash.

`extractReadableArticle` tries Mozilla Readability and falls back to Cheerio. Private hosts are refused. Timeouts are ten seconds. Twitter, X, and the other login walls return a reason instead of an exception.

`analyzeDraft` and `findUngroundedNumbers` run in the browser on each keystroke. That is the whole point of the split: the marks you can explain with a rule should not wait on a network.

### What is a rule, and what is a model?

Rules: sentence length over 25 and over 35, a passive of the form auxiliary + participle (and a rewrite only when “by” names someone), a fixed list of more than forty filler phrases, a jargon list plus unexplained acronyms, and any two-digit or decimal figure in the draft that is absent from the clips.

Model, and only when `OPENAI_API_KEY` is set: the cross-source brief, and a critique limited to repetition, structure, unsupported claims, and nuance. The critique prompt tells the model not to repeat the rules and not to delete proper names in the name of simplicity.

Without a key, the demo brief is the curated one, checked against the clips, and the screen says no model was used. Other source sets get an extract that refuses to invent “why it matters.” I would rather show a thin honest column than a fluent guess.

### What happens when the world is messy?

- **403, 402, timeout, empty HTML.** That source is marked “needs paste,” with whatever thin text came back sitting in the box. Other URLs in the same add still resolve.
- **Model returns prose, or quotes that are not in the clip.** Zod rejects a bad shape. `reconcileSourceCitations` drops any fact whose quote is not in that source. If nothing remains, the desk falls back to the extract and says why.
- **The inbox process restarts.** Clips in memory are gone. The draft in `localStorage` is not. That is an acceptable loss for a local tool and a bad one for a shared one.
- **DNS rebinding and SSRF.** Hostnames that are obviously private are blocked. A public hostname that resolves to an internal address is not. I would not ship the fetcher past a single editor without that check.

### What would another day buy?

1. Log accept and dismiss, so the three metrics above are real instead of proposed.
2. Replace process memory with a small store so the clipper survives a restart and a second browser.
3. When Verify is open, diff the clip against a fresh fetch of the URL, so a stale excerpt cannot bless a sentence the page no longer contains.
4. Support “the source implies this” with a span that is wider than an exact quote, still shown to the editor, still not silent.

I would not spend the day on more highlight colors.

## Editorial judgment

### What makes technical writing clear, rather than dumbed down?

Clear writing names the thing, once, in words a specific reader can use, and then gets out of the way. Dumbed-down writing deletes the name.

“MIT License” is not jargon to be smoothed into “a friendly open-source license,” and it is not an acronym that needs “Massachusetts Institute of Technology” stuffed in front of it. The permission is the point. “Computer use” is a short name for looking, clicking, and typing, and Anthropic already printed that definition. A gloss belongs on first use when the term is doing work the reader cannot see (`RLHF` with nothing around it). It does not belong when the sentence’s point is that the posts never explained the term. Defining quantization there pretends the sources taught it.

Short sentences are a tool. They are not the goal. The 34-word opening in the sample is a bad sentence because it spends its length on a drumroll. A 28-word sentence that keeps a safeguard distinction is a good sentence even if a grade level complains.

### How would I know the writing assistant actually helped?

Not by the grade moving. By a read of the before and after, with the decisions attached.

The test I want: can a reader who did not see the sources tell a fact from a reading, and did any accepted edit change a proper name, a number, or a permission? In the sample, the `11x` sentence is cut because the clips do not contain it. The quantization gloss is dismissed because inserting a definition would launder an absence into an explanation. Those are the edits that matter. A filler cut that turns “in order to” into “to” is housekeeping.

I would also sample dismissals. If editors dismiss the same jargon suggestion for the same reason, the rule is wrong and should be narrowed. If they accept every jargon gloss, the rule is too polite and the piece is getting softer.

### What must never be automatic?

- Changing a number, a proper name, or who is allowed to do a thing.
- Promoting a vendor’s benchmark from “they report” to “it is true.”
- Applying every suggestion because the list was long.
- Optimizing a readability grade by deleting the clause that carried the point.
- Filling a hole in the clips with a plausible sentence. The extractive brief is boring on purpose. A hole is not an invitation.

The editor accepts, dismisses, or rewrites by hand. The software’s job is to make the choice visible and to refuse the edits it cannot justify.

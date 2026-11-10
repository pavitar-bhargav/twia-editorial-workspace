# This Week in AI — Editorial desk

**Live Demo:** [https://twia-editorial-workspace.vercel.app](https://twia-editorial-workspace.vercel.app)

A three-pane desk for the newsletter: clip sources, synthesize a brief whose facts have to survive a quote check, then edit a draft with rules that run immediately and a model pass that is optional.
The desk opens on the work. There is no marketing page.

## What it does

- **Source inbox.** URLs, pasted text, a bookmarklet, and a Chrome extension (`extension/`) all land in the same list. A URL that 403s, times out, or is a login wall becomes a paste box for that source only. The rest of the batch continues.
- **Research brief.** What happened, why it matters to founders, builders, and operators, who should care, a practical implication, verifiable facts with quotes, speculation kept separate, and three newsletter angles. Each fact is dropped unless its quote is in the clip for that source. **Verify** shows the quote inside the clip.
- **Draft.** Hemingway-style marks for long sentences, passive voice, filler, and unexplained jargon, plus figures that do not appear in the clips. Accept replaces the exact span. Dismiss keeps it. A baseline can be compared side by side or inline, and reverted.
- **Curated demo.** One button loads three primary posts — [Anthropic computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) (22 October 2024), [OpenAI o1-preview](https://openai.com/index/introducing-openai-o1-preview/) (12 September 2024), and [DeepSeek-R1](https://www.deepseek.com/en/news/deepseek-r1/) (20 January 2025) — plus a checked brief and a flawed draft. No API key required.
- **Sample and product note.** The Sample tab is [`SAMPLE_EDITORIAL.md`](SAMPLE_EDITORIAL.md). The product note opens from the masthead and is [`PRODUCT_NOTE.md`](PRODUCT_NOTE.md).

## Architecture

```
browser clipper ──POST /api/inbox──▶ in-memory inbox ──poll──▶ desk state
manual URL     ──POST /api/extract─▶ extractReadableArticle (Readability, then Cheerio)
desk           ──POST /api/research─▶ buildResearchBrief
                                      ├─ no key + the three demo URLs → curated brief
                                      ├─ any model key → model JSON, then reconcileSourceCitations
                                      └─ otherwise → extract, labeled as an extract
desk           ──POST /api/critique─▶ model notes, or an honest "rules only" summary
draft keystrokes ─▶ analyzeDraft + findUngroundedNumbers (client, no network)
```

Rules live in `src/lib/deterministic-analyzer.ts`. They do not call a model. The model is not allowed to be the only thing standing between a claim and the page.

State for the desk sits in the browser (`localStorage`). The clip inbox is process memory on the server, which is enough for one local editor and is the thing to replace first if two people share a desk.

## Decisions worth knowing

- Readability scores are shown and explained. They are not a target. The product note says why.
- A jargon gloss is withheld when a plain word from the gloss already sits next to the term. `SynthID watermark` is not flagged. `RLHF` with no expansion is.
- Passive rewrites only fire when the sentence names an actor with “by”. The desk does not invent one.
- Long-sentence splits are refused when the right-hand piece would be a fragment. The mark stays; Accept does not.
- Vendor benchmarks are facts about what the vendor reported. The brief’s speculation column is where a reading has to live.

## Run it

Requires Node 22.

```bash
npm install
cp .env.example .env.local   # optional — the demo works with the file empty
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Load curated demo**.

Check the writing rules without the UI:

```bash
npm run test:analyzer
npm run build
```

### Environment

Any one key is enough. If several are set, the desk uses the first match: OpenAI, then Groq, then Gemini, then Anthropic.

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | No | Chat completions. Defaults: model `gpt-4o-mini`, base `https://api.openai.com/v1`. |
| `GROQ_API_KEY` | No | Groq's OpenAI-compatible API. Default model `openai/gpt-oss-120b`. |
| `GEMINI_API_KEY` | No | Gemini through Google's OpenAI-compatible endpoint (`generativelanguage.googleapis.com/v1beta/openai`). Default model `gemini-2.0-flash`. |
| `ANTHROPIC_API_KEY` | No | Anthropic Messages API. Default model `claude-3-5-haiku-latest`. |

`OPENAI_MODEL`, `OPENAI_BASE_URL`, `GROQ_MODEL`, `GROQ_BASE_URL`, `GEMINI_MODEL`, `GEMINI_BASE_URL`, and `ANTHROPIC_MODEL` override those defaults. Do not commit `.env.local`. [`.env.example`](.env.example) lists the names and nothing else.

### Clipper

**Bookmarklet.** Open **Clipper** in the masthead, drag “Clip to TWIA” to the bookmarks bar, or copy the bookmarklet and paste it as the URL of a new bookmark. On a page, select text if you want it, then run the bookmark. The desk polls `/api/inbox`.

**Chrome extension.** The unpacked extension lives in [`extension/`](extension/) (`manifest.json`, `popup.html`, `popup.js`). It reads the active tab's URL, title, and selection and POSTs them to `http://localhost:3000/api/inbox`.

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Choose Load unpacked and select the `extension` folder.

The popup's desk field defaults to `http://localhost:3000` and is stored in `chrome.storage.local`. `host_permissions` cover localhost only.

## Tools & Verification Disclosure

This desk was implemented in Cursor with the Grok coding agent, from the take-home brief. The architecture, the rule layer, the citation check, the choice of primary sources, and the sample editorial were specified in the repository and then checked.

The demo clips are sentences copied from the Anthropic computer-use post (22 October 2024), the OpenAI o1-preview post (12 September 2024), and the DeepSeek-R1 release note (20 January 2025). The Llama 3.3 sentence in the sample is the model-card line on [github.com/deepseek-ai/DeepSeek-R1](https://github.com/deepseek-ai/DeepSeek-R1). The MCP sentence is from [Anthropic's protocol announcement](https://www.anthropic.com/news/model-context-protocol). Apostrophes in the clips are straight so the quote check does not depend on a CMS glyph. The links are the citation.

Checked in this workspace:

- `npm run test:analyzer` — the 34-word sentence, the passive rewrites, the filler list, the jargon glosses, the ungrounded `11x`, and the curated quotes (none dropped).
- `npm run build` and ESLint.
- The demo path in a browser: load the curated desk, open a source from Verify, accept the ungrounded `11x` mark (the sentence leaves the draft), and confirm sources, the draft, and the inspector are on screen together at 1440px. Below `lg` the pane switcher is the only way between them.

The curated path does not call a model, and the UI says so. A live synthesis or critique uses whichever key is in `.env.local`. Product reasoning is in [`PRODUCT_NOTE.md`](PRODUCT_NOTE.md). The before-and-after newsletter is in [`SAMPLE_EDITORIAL.md`](SAMPLE_EDITORIAL.md).

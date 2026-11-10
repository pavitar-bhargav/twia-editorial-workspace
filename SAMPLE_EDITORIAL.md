# The screen, the pause, and the weights

A desk piece on three real releases, with the draft the writing assistant marked and the decisions an editor made. The final piece is 433 words. The posts are not from the same week. The argument is that they are not the same product.

## Sources

- [Computer use, Claude 3.5 Sonnet, and Claude 3.5 Haiku](https://www.anthropic.com/news/3-5-models-and-computer-use) — Anthropic, 22 October 2024
- [Introducing OpenAI o1-preview](https://openai.com/index/introducing-openai-o1-preview/) — OpenAI, 12 September 2024
- [DeepSeek-R1 Release](https://www.deepseek.com/en/news/deepseek-r1/) — DeepSeek, 20 January 2025
- [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) — Anthropic, 25 November 2024
- [DeepSeek-R1 model card](https://github.com/deepseek-ai/DeepSeek-R1) — the Llama 3.3 line

[S1], [S2], and [S3] in the desk are the first three URLs. Every figure in the polished piece is in one of those clips, except the Llama 3.3 model-card sentence, which is linked on its own. The MCP sentence is linked to the MCP post.

## Original raw draft

This week a paradigm shift occurred in the model market, as frontier access was quietly rebundled by the labs in a way that will revolutionize procurement for nearly every serious technical buyer this quarter.

It is important to note that OpenAI released o1-preview on September 12, 2024 in ChatGPT and the API. Computer use was introduced in public beta by Anthropic on Oct 22, 2024. Claude 3.5 Sonnet was shipped by Anthropic at the same price and speed as its predecessor, and outputs are generated with a coding score that moved from 33.4% to 49.0%.

Needless to say, these launches leverage a cutting-edge stack. In order to see why the season matters, a reader has to hold a screen, a longer trace, and a set of weights side by side rather than a single benchmark table. On OSWorld, Claude 3.5 Sonnet scored 14.9% from screenshots and 22.0% with more steps.

OpenAI says GPT-4o solved only 13% of an International Mathematics Olympiad qualifying exam, while the reasoning model scored 83%, and the coding evaluation reached the 89th percentile in Codeforces. o1-mini is 80% cheaper than o1-preview. The posts do not explain RLHF, the KV-cache, or quantization. Due to the fact that those choices stay inside the lab, the public facts are the price, the benchmark, and the license.

DeepSeek says a cache miss costs $0.55 per million input tokens and output costs $2.19 per million tokens, under the MIT License. The posts never mention a SynthID watermark. Internal notes suggest an 11x throughput gain on coding agents.

At the end of the day, the game-changer is the contract. Founders are buying a price and a permission, builders are routing across a screen and a reasoning model, and operators have to decide which weights they are willing to run. The practical move is to write, for each workflow, which model may be called, which model may not, and at what price the workflow stops making sense.

The opening sentence is 34 words. `SynthID` sits next to “watermark,” so the jargon rule leaves it alone.

## Feedback the writing assistant produced

These are the marks from `analyzeDraft`, in the order the engine emits them, plus the ungrounded-figure mark from `findUngroundedNumbers` once the three clips are loaded. A blank suggestion is a cut. Where the suggestion equals the passage, Accept stays disabled.

| Passage | Category | Why it hurts | Suggested edit | Decision |
| --- | --- | --- | --- | --- |
| This week a paradigm shift occurred in the model market, as frontier access was quietly rebundled by the labs in a way that will revolutionize procurement for nearly every serious technical buyer this quarter. | Long sentence | This sentence is 34 words. Past 25, the point arrives after the reader has started holding clauses in memory. | This week a paradigm shift occurred in the model market. Frontier access was quietly rebundled by the labs in a way that will revolutionize procurement for nearly every serious technical buyer this quarter. | Accepted the split, then rewrote the second sentence. It was still a drumroll. |
| frontier access was quietly rebundled by the labs | Passive | A form of “to be” is carrying the action, so the reader meets the verb before the actor. Lead with whoever did it. | the labs quietly rebundled frontier access | Accepted. “Quietly” did not survive the later rewrite. The actor did. |
| Computer use was introduced in public beta by Anthropic | Passive | A form of “to be” is carrying the action, so the reader meets the verb before the actor. Lead with whoever did it. | Anthropic introduced Computer use in public beta | Accepted. |
| Claude 3.5 Sonnet was shipped by Anthropic at the same price and speed as its predecessor, and outputs are generated with a coding score that moved from 33.4% to 49.0%. | Long sentence | This sentence is 30 words. Past 25, the point arrives after the reader has started holding clauses in memory. | Claude 3.5 Sonnet was shipped by Anthropic at the same price and speed as its predecessor. Outputs are generated with a coding score that moved from 33.4% to 49.0%. | Accepted the split. The new second sentence was still passive, and was rewritten by hand. |
| Claude 3.5 Sonnet was shipped by Anthropic | Passive | A form of “to be” is carrying the action, so the reader meets the verb before the actor. Lead with whoever did it. | Anthropic shipped Claude 3.5 Sonnet | Accepted. |
| outputs are generated | Passive | A form of “to be” is carrying the action, and the sentence never names an actor. The desk will not invent one. | outputs are generated | Left for a hand edit. Accept is disabled. |
| In order to see why the season matters, a reader has to hold a screen, a longer trace, and a set of weights side by side rather than a single benchmark table. | Long sentence | This sentence is 32 words. Past 25, the point arrives after the reader has started holding clauses in memory. | In order to see why the season matters, a reader has to hold a screen, a longer trace, and a set of weights side by side rather than a single benchmark table. | Rewritten by hand. The engine refused a fragment split, so Accept stays disabled. |
| OpenAI says GPT-4o solved only 13% of an International Mathematics Olympiad qualifying exam, while the reasoning model scored 83%, and the coding evaluation reached the 89th percentile in Codeforces. | Long sentence | This sentence is 29 words. Past 25, the point arrives after the reader has started holding clauses in memory. | OpenAI says GPT-4o solved only 13% of an International Mathematics Olympiad qualifying exam, while the reasoning model scored 83%. The coding evaluation reached the 89th percentile in Codeforces. | Accepted. The figures stay, because they are OpenAI’s. |
| Founders are buying a price and a permission, builders are routing across a screen and a reasoning model, and operators have to decide which weights they are willing to run. | Long sentence | This sentence is 30 words. Past 25, the point arrives after the reader has started holding clauses in memory. | Founders are buying a price and a permission, builders are routing across a screen and a reasoning model. Operators have to decide which weights they are willing to run. | Taken as a structural hint. The final piece gives each audience its own sentence. |
| The practical move is to write, for each workflow, which model may be called, which model may not, and at what price the workflow stops making sense. | Long sentence | This sentence is 27 words. Past 25, the point arrives after the reader has started holding clauses in memory. | The practical move is to write, for each workflow, which model may be called, which model may not, and at what price the workflow stops making sense. | Rewritten by hand into the close. Accept stays disabled. |
| It is important to note that | Filler | The phrase announces that a point is coming and then delays it. | (cut) | Accepted. |
| At the end of the day, | Filler | A clock phrase standing in for a conclusion. | (cut) | Accepted. |
| Due to the fact that | Filler | “Because” carries the same relation in one word. | because | Accepted, then the whole sentence was cut with the jargon row. |
| revolutionize | Filler | Say what changed. “Revolutionize” is a verdict without a mechanism. | change | Accepted as a cut. The word does not appear in the final piece. |
| Needless to say, | Filler | If it is needless, cut it. | (cut) | Accepted. |
| paradigm shift | Filler | Name the change. “Paradigm” is a drumroll. | change | Accepted as a direction. The final lede names the three products. |
| game-changer | Filler | Say what the change is, or the label is doing the thinking. | real change | Dismissed as a patch. The sentence was rewritten. |
| cutting-edge | Filler | “New” is checkable. “Cutting-edge” is a mood. | new | Accepted as a cut of the whole sentence. “New stack” would still have said nothing. |
| In order to | Filler | “To” already marks the purpose. | to | Accepted. |
| leverage | Filler | “Use” is plainer and usually what was meant. | use | Accepted as a cut of the sentence. “Use a stack” is still empty. |
| RLHF | Jargon | “RLHF” has no gloss. This sentence may be withholding the definition on purpose — dismiss the suggestion if spelling it out would pretend the source explained it. | RLHF (reinforcement learning from human feedback) | Dismissed with the quantization row. |
| KV-cache | Jargon | “KV-cache” has no gloss. This sentence may be withholding the definition on purpose — dismiss the suggestion if spelling it out would pretend the source explained it. | KV-cache (the attention keys and values a model stores so it can reuse earlier tokens) | Dismissed. Same reason. |
| quantization | Jargon | “quantization” has no gloss. This sentence may be withholding the definition on purpose — dismiss the suggestion if spelling it out would pretend the source explained it. | quantization (storing weights at lower numeric precision) | Rejected. Defining the term would turn an absence into a lesson. The posts never specify the method. The editor cut the sentence. |
| MIT | Jargon | “MIT” is an unexplained acronym. Spell it out on first use, or dismiss this if this audience already lives with it. | MIT (spell out on first use) | Dismissed. Here the license name is the permission. Expanding it to the institution would bury that. |
| Internal notes suggest an 11x throughput gain on coding agents. | Unsupported figure | The figure 11 is not in any clipped source. A newsletter can report what a lab published. It cannot grow a number in the gap. | (cut) | Accepted. |

## Final piece

The screen, the pause, and the weights

On 22 October 2024, Anthropic put computer use into public beta on an upgraded Claude 3.5 Sonnet. A developer can direct Claude to look at a screen, move a cursor, click, and type. On 12 September 2024, OpenAI released o1-preview, built to spend longer thinking before it answers. On 20 January 2025, DeepSeek released DeepSeek-R1 under the MIT License, at $0.55 per million input tokens on a cache miss and $2.19 per million output tokens.

These are not three rows on one leaderboard. The work can land on the user's screen, inside a longer trace, or on weights a team is allowed to ship.

Anthropic says Claude 3.5 Sonnet is the first frontier model with computer use in public beta, and that the capability is still experimental. The same post moves SWE-bench Verified from 33.4% to 49.0%, at the same price and speed as the previous Sonnet. On OSWorld, screenshot-only, Anthropic reports 14.9%, against a next-best of 7.8%, and 22.0% with more steps.

OpenAI's claim is about the trace. On an International Mathematics Olympiad qualifying exam, OpenAI says GPT-4o solved 13% and the reasoning model solved 83%. The coding evaluation reached the 89th percentile on Codeforces. o1-mini is 80% cheaper than o1-preview. At launch, ChatGPT allowed 30 messages a week for o1-preview and 50 for o1-mini. The API was limited to usage tier 5, at 20 requests per minute, without function calling or streaming.

DeepSeek's note is the invoice and the license. R1 is described as on par with OpenAI-o1 on math, code, and reasoning. The 32B and 70B distilled models are described as on par with o1-mini. The code and weights are MIT licensed, including distillation and commercial use. A cache hit is $0.14 per million input tokens. The model card says [DeepSeek-R1-Distill-Llama-70B is derived from Llama3.3-70B-Instruct](https://github.com/deepseek-ai/DeepSeek-R1).

A month later Anthropic open-sourced the [Model Context Protocol](https://www.anthropic.com/news/model-context-protocol), a new standard for connecting assistants to the systems where data lives.

Founders should price the job. An 80% discount is still a metered trace. An MIT weight at $2.19 per million output tokens can also be run in-house. Builders should split the client: computer use on the Anthropic API, Bedrock, or Vertex; o1 without function calling at that launch; DeepSeek via model=deepseek-reasoner, or the weights themselves. Operators should write down which of the three a support queue, a coding agent, and a customer-data workflow are allowed to use.

Name the model that may drive a screen, the model that may think longer, and the price or license at which the work stops. The three posts already have.

433 words. The claim that teams will route one product across all three, and that the MIT license will matter more than the 83% figure, stayed in the brief’s speculation column.

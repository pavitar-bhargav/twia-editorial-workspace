import type { DeskSource, ResearchBrief } from "@/lib/types";

/**
 * Clips, not reconstructed articles. Each sentence is copied from the primary
 * post named in `url`. Apostrophes are straight so a quote check does not
 * depend on a CMS glyph. The live page remains the citation.
 */

const ANTHROPIC_DATE = "Oct 22, 2024";
const ANTHROPIC_ANNOUNCE =
  "Today, we're announcing an upgraded Claude 3.5 Sonnet, and a new model, Claude 3.5 Haiku.";
const ANTHROPIC_INTRO =
  "We're also introducing a groundbreaking new capability in public beta: computer use.";
const ANTHROPIC_HOW =
  "Available today on the API, developers can direct Claude to use computers the way people do—by looking at a screen, moving a cursor, clicking buttons, and typing text.";
const ANTHROPIC_FIRST =
  "Claude 3.5 Sonnet is the first frontier AI model to offer computer use in public beta.";
const ANTHROPIC_EXPERIMENTAL =
  "At this stage, it is still experimental—at times cumbersome and error-prone.";
const ANTHROPIC_WHERE =
  "Starting today, developers can build with the computer use beta on the Anthropic API, Amazon Bedrock, and Google Cloud's Vertex AI.";
const ANTHROPIC_SWE =
  "On coding, it improves performance on SWE-bench Verified from 33.4% to 49.0%, scoring higher than all publicly available models—including reasoning models like OpenAI o1-preview and specialized systems designed for agentic coding.";
const ANTHROPIC_PRICE =
  "The new Claude 3.5 Sonnet offers these advancements at the same price and speed as its predecessor.";
const ANTHROPIC_OSWORLD =
  "On OSWorld, which evaluates AI models' ability to use computers like people do, Claude 3.5 Sonnet scored 14.9% in the screenshot-only category—notably better than the next-best AI system's score of 7.8%.";
const ANTHROPIC_STEPS =
  "When afforded more steps to complete the task, Claude scored 22.0%.";

const OPENAI_DATE = "September 12, 2024";
const OPENAI_THINK =
  "We've developed a new series of AI models designed to spend more time thinking before they respond.";
const OPENAI_RELEASE =
  "Today, we are releasing the first of this series in ChatGPT and our API.";
const OPENAI_IMO =
  "In a qualifying exam for the International Mathematics Olympiad (IMO), GPT-4o correctly solved only 13% of problems, while the reasoning model scored 83%.";
const OPENAI_CODE =
  "Their coding abilities were evaluated in contests and reached the 89th percentile in Codeforces competitions.";
const OPENAI_CHEAP =
  "As a smaller model, o1-mini is 80% cheaper than o1-preview, making it a powerful, cost-effective model for applications that require reasoning but not broad world knowledge.";
const OPENAI_LIMITS =
  "Both o1-preview and o1-mini can be selected manually in the model picker, and at launch, weekly rate limits will be 30 messages for o1-preview and 50 for o1-mini.";
const OPENAI_API =
  "The API for these models currently doesn't include function calling, streaming, support for system messages, and other features.";
const OPENAI_RPM =
  "Developers who qualify for API usage tier 5 can start prototyping with both models in the API today with a rate limit of 20 RPM.";

const DEEPSEEK_DATE = "January 20, 2025";
const DEEPSEEK_PAR =
  "Performance on par with OpenAI-o1";
const DEEPSEEK_MIT =
  "Code and models are released under the MIT License: Distill & commercialize freely!";
const DEEPSEEK_DISTILL =
  "32B & 70B models on par with OpenAI-o1-mini";
const DEEPSEEK_TASKS =
  "Math, code, and reasoning tasks on par with OpenAI-o1";
const DEEPSEEK_MODEL =
  "Use DeepSeek-R1 by setting model=deepseek-reasoner";
const DEEPSEEK_HIT = "$0.14 / million input tokens (cache hit)";
const DEEPSEEK_MISS = "$0.55 / million input tokens (cache miss)";
const DEEPSEEK_OUT = "$2.19 / million output tokens";

export const DEMO_SOURCE_IDS = {
  anthropic: "src-anthropic",
  openai: "src-openai",
  deepseek: "src-deepseek",
} as const;

export const DEMO_SOURCES: DeskSource[] = [
  {
    id: DEMO_SOURCE_IDS.anthropic,
    origin: "demo",
    status: "ready",
    title: "Claude computer use and Claude 3.5",
    url: "https://www.anthropic.com/news/3-5-models-and-computer-use",
    note: "Anthropic, 22 October 2024. Sentences from the computer-use announcement.",
    text: [
      ANTHROPIC_DATE,
      ANTHROPIC_ANNOUNCE,
      "The upgraded Claude 3.5 Sonnet delivers across-the-board improvements over its predecessor, with particularly significant gains in coding.",
      ANTHROPIC_INTRO,
      ANTHROPIC_HOW,
      ANTHROPIC_FIRST,
      ANTHROPIC_EXPERIMENTAL,
      "The upgraded Claude 3.5 Sonnet is now available for all users.",
      ANTHROPIC_WHERE,
      ANTHROPIC_SWE,
      "It also improves performance on TAU-bench, an agentic tool use task, from 62.6% to 69.2% in the retail domain, and from 36.0% to 46.0% in the more challenging airline domain.",
      ANTHROPIC_PRICE,
      ANTHROPIC_OSWORLD,
      ANTHROPIC_STEPS,
    ].join("\n\n"),
  },
  {
    id: DEMO_SOURCE_IDS.openai,
    origin: "demo",
    status: "ready",
    title: "OpenAI o1-preview",
    url: "https://openai.com/index/introducing-openai-o1-preview/",
    note: "OpenAI, 12 September 2024. Sentences from the o1-preview announcement.",
    text: [
      OPENAI_DATE,
      "Introducing OpenAI o1-preview. A new series of reasoning models for solving hard problems.",
      OPENAI_THINK,
      "They can reason through complex tasks and solve harder problems than previous models in science, coding, and math.",
      OPENAI_RELEASE,
      OPENAI_IMO,
      OPENAI_CODE,
      OPENAI_CHEAP,
      OPENAI_LIMITS,
      OPENAI_RPM,
      OPENAI_API,
      "Given this, we are resetting the counter back to 1 and naming this series OpenAI o1.",
    ].join("\n\n"),
  },
  {
    id: DEMO_SOURCE_IDS.deepseek,
    origin: "demo",
    status: "ready",
    title: "DeepSeek-R1",
    url: "https://www.deepseek.com/en/news/deepseek-r1/",
    note: "DeepSeek, 20 January 2025. Lines from the R1 release note. The 70B distill's Llama 3.3 base is on the model card, not this page: https://github.com/deepseek-ai/DeepSeek-R1",
    text: [
      DEEPSEEK_DATE,
      "DeepSeek-R1 Release",
      DEEPSEEK_PAR,
      "Fully open-source model and technical report",
      DEEPSEEK_MIT,
      "Distilled from DeepSeek-R1, 6 small models fully open-sourced",
      DEEPSEEK_DISTILL,
      "DeepSeek-R1 is now MIT licensed for clear open access",
      "API outputs can now be used for fine-tuning and distillation",
      DEEPSEEK_TASKS,
      DEEPSEEK_MODEL,
      DEEPSEEK_HIT,
      DEEPSEEK_MISS,
      DEEPSEEK_OUT,
    ].join("\n\n"),
  },
];

export const CURATED_BRIEF: ResearchBrief = {
  headline: "The screen, the pause, and the weights",
  dek: "Computer use, o1, and DeepSeek-R1 are three different products. A leaderboard collapses them into one.",
  whatHappened:
    "On 22 October 2024 Anthropic put computer use in public beta on an upgraded Claude 3.5 Sonnet: the model can look at a screen, move a cursor, click, and type. On 12 September 2024 OpenAI released o1-preview, a model trained to spend longer thinking before it answers. On 20 January 2025 DeepSeek released R1 under the MIT License, with a published API price of $0.55 per million input tokens on a cache miss and $2.19 per million output tokens.",
  whyItMatters: {
    founders:
      "The buyer is no longer shopping one line called intelligence. A screen-driving beta, a metered reasoning trace, and an MIT weight are three different costs, and only one of them can be taken in-house.",
    builders:
      "Anthropic's implementation note is the API: computer use is in beta on the Anthropic API, Bedrock, and Vertex. o1-preview, at launch, did not include function calling or streaming. DeepSeek's API is selected with model=deepseek-reasoner, and the weights can be distilled.",
    operators:
      "These are three permissions. Computer use can click. o1 spends a hidden trace and, at launch, was capped at 30 messages a week in ChatGPT for o1-preview. R1 can be shipped because the license says distill and commercialize. Procurement has to name which permission a workflow is allowed to use.",
  },
  whoShouldCare:
    "Anyone who will put an agent on a real screen, pay for a long reasoning trace, or ship a weight they do not want to rent forever. That is a founder pricing a workflow, a builder choosing a tool surface, and an operator who has to approve the click.",
  practicalImplication:
    "For support, a coding agent, and any workflow that touches customer data, write down which model may drive a screen, which model may spend a long trace, and the price or license at which the work stops.",
  facts: [
    {
      claim: "On 22 October 2024 Anthropic announced an upgraded Claude 3.5 Sonnet and Claude 3.5 Haiku.",
      quote: ANTHROPIC_ANNOUNCE,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "Computer use went out in public beta.",
      quote: ANTHROPIC_INTRO,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "The action Anthropic describes is looking, moving a cursor, clicking, and typing.",
      quote: ANTHROPIC_HOW,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "Anthropic calls Claude 3.5 Sonnet the first frontier model to offer computer use in public beta.",
      quote: ANTHROPIC_FIRST,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "Anthropic says the capability is still experimental.",
      quote: ANTHROPIC_EXPERIMENTAL,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "Computer use beta is on the Anthropic API, Amazon Bedrock, and Vertex AI.",
      quote: ANTHROPIC_WHERE,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "Anthropic reports SWE-bench Verified moving from 33.4% to 49.0%.",
      quote: "On coding, it improves performance on SWE-bench Verified from 33.4% to 49.0%",
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "Anthropic says those gains come at the same price and speed as the previous Claude 3.5 Sonnet.",
      quote: ANTHROPIC_PRICE,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "On OSWorld, screenshot-only, Anthropic reports 14.9%.",
      quote: "Claude 3.5 Sonnet scored 14.9% in the screenshot-only category",
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "With more steps, Anthropic reports 22.0% on that computer-use evaluation.",
      quote: ANTHROPIC_STEPS,
      sourceId: DEMO_SOURCE_IDS.anthropic,
    },
    {
      claim: "OpenAI describes o1 as models that spend more time thinking before they respond.",
      quote: OPENAI_THINK,
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "o1-preview shipped in ChatGPT and the API on 12 September 2024.",
      quote: OPENAI_RELEASE,
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "OpenAI says GPT-4o solved 13% of an IMO qualifying exam and the reasoning model solved 83%.",
      quote: OPENAI_IMO,
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "OpenAI says the coding evaluation reached the 89th percentile in Codeforces.",
      quote: OPENAI_CODE,
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "OpenAI says o1-mini is 80% cheaper than o1-preview.",
      quote: "o1-mini is 80% cheaper than o1-preview",
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "At launch, ChatGPT weekly limits were 30 messages for o1-preview and 50 for o1-mini.",
      quote: "at launch, weekly rate limits will be 30 messages for o1-preview and 50 for o1-mini.",
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "The o1 API, at that launch, did not include function calling or streaming.",
      quote: OPENAI_API,
      sourceId: DEMO_SOURCE_IDS.openai,
    },
    {
      claim: "DeepSeek says R1 is on par with OpenAI-o1 and is released under the MIT License.",
      quote: DEEPSEEK_MIT,
      sourceId: DEMO_SOURCE_IDS.deepseek,
    },
    {
      claim: "DeepSeek says the 32B and 70B distilled models are on par with o1-mini.",
      quote: DEEPSEEK_DISTILL,
      sourceId: DEMO_SOURCE_IDS.deepseek,
    },
    {
      claim: "The published API price is $0.14 per million input tokens on a cache hit, $0.55 on a miss, and $2.19 per million output tokens.",
      quote: DEEPSEEK_MISS,
      sourceId: DEMO_SOURCE_IDS.deepseek,
    },
  ],
  speculation: [
    {
      claim: "Teams will split one product across all three: computer use for the screen, o1 for the hard trace, R1 where the weights have to be shippable.",
      basis: "The posts describe different jobs. None of them measures that split.",
    },
    {
      claim: "The MIT license will matter more to a startup's margin than the 83% IMO figure.",
      basis: "A reading of the price and the license. Neither lab published that comparison.",
    },
  ],
  angles: [
    {
      id: "screen-is-the-api",
      title: "The screen is now an API",
      hook: "Claude can be told to look, click, and type. Anthropic still calls that beta experimental.",
      whyNow: "The computer-use post prints both the capability and the 14.9% OSWorld score. The limitation shipped with the feature.",
    },
    {
      id: "thinking-is-a-line-item",
      title: "Thinking time is a line item",
      hook: "o1-preview spends longer before it answers, and o1-mini is 80% cheaper than that preview.",
      whyNow: "OpenAI published the IMO split, the Codeforces percentile, and the launch rate limits in the same post.",
    },
    {
      id: "weights-have-a-price",
      title: "The weights have a price",
      hook: "DeepSeek-R1 is MIT licensed, the 32B and 70B distills are part of the release, and the API has a unit price.",
      whyNow: "A license plus $0.55 and $2.19 is a budget line. A benchmark without either is a press quote.",
    },
  ],
};

export const FLAWED_DRAFT = [
  "This week a paradigm shift occurred in the model market, as frontier access was quietly rebundled by the labs in a way that will revolutionize procurement for nearly every serious technical buyer this quarter.",
  "",
  "It is important to note that OpenAI released o1-preview on September 12, 2024 in ChatGPT and the API. Computer use was introduced in public beta by Anthropic on Oct 22, 2024. Claude 3.5 Sonnet was shipped by Anthropic at the same price and speed as its predecessor, and outputs are generated with a coding score that moved from 33.4% to 49.0%.",
  "",
  "Needless to say, these launches leverage a cutting-edge stack. In order to see why the season matters, a reader has to hold a screen, a longer trace, and a set of weights side by side rather than a single benchmark table. On OSWorld, Claude 3.5 Sonnet scored 14.9% from screenshots and 22.0% with more steps.",
  "",
  "OpenAI says GPT-4o solved only 13% of an International Mathematics Olympiad qualifying exam, while the reasoning model scored 83%, and the coding evaluation reached the 89th percentile in Codeforces. o1-mini is 80% cheaper than o1-preview. The posts do not explain RLHF, the KV-cache, or quantization. Due to the fact that those choices stay inside the lab, the public facts are the price, the benchmark, and the license.",
  "",
  "DeepSeek says a cache miss costs $0.55 per million input tokens and output costs $2.19 per million tokens, under the MIT License. The posts never mention a SynthID watermark. Internal notes suggest an 11x throughput gain on coding agents.",
  "",
  "At the end of the day, the game-changer is the contract. Founders are buying a price and a permission, builders are routing across a screen and a reasoning model, and operators have to decide which weights they are willing to run. The practical move is to write, for each workflow, which model may be called, which model may not, and at what price the workflow stops making sense.",
].join("\n");

export const POLISHED_DRAFT = [
  "The screen, the pause, and the weights",
  "",
  "On 22 October 2024, Anthropic put computer use into public beta on an upgraded Claude 3.5 Sonnet. A developer can direct Claude to look at a screen, move a cursor, click, and type. On 12 September 2024, OpenAI released o1-preview, built to spend longer thinking before it answers. On 20 January 2025, DeepSeek released DeepSeek-R1 under the MIT License, at $0.55 per million input tokens on a cache miss and $2.19 per million output tokens.",
  "",
  "These are not three rows on one leaderboard. The work can land on the user's screen, inside a longer trace, or on weights a team is allowed to ship.",
  "",
  "Anthropic says Claude 3.5 Sonnet is the first frontier model with computer use in public beta, and that the capability is still experimental. The same post moves SWE-bench Verified from 33.4% to 49.0%, at the same price and speed as the previous Sonnet. On OSWorld, screenshot-only, Anthropic reports 14.9%, against a next-best of 7.8%, and 22.0% with more steps.",
  "",
  "OpenAI's claim is about the trace. On an International Mathematics Olympiad qualifying exam, OpenAI says GPT-4o solved 13% and the reasoning model solved 83%. The coding evaluation reached the 89th percentile on Codeforces. o1-mini is 80% cheaper than o1-preview. At launch, ChatGPT allowed 30 messages a week for o1-preview and 50 for o1-mini. The API was limited to usage tier 5, at 20 requests per minute, without function calling or streaming.",
  "",
  "DeepSeek's note is the invoice and the license. R1 is described as on par with OpenAI-o1 on math, code, and reasoning. The 32B and 70B distilled models are described as on par with o1-mini. The code and weights are MIT licensed, including distillation and commercial use. A cache hit is $0.14 per million input tokens. The model card says DeepSeek-R1-Distill-Llama-70B is derived from Llama3.3-70B-Instruct.",
  "",
  "A month later Anthropic open-sourced the Model Context Protocol, a new standard for connecting assistants to the systems where data lives.",
  "",
  "Founders should price the job. An 80% discount is still a metered trace. An MIT weight at $2.19 per million output tokens can also be run in-house. Builders should split the client: computer use on the Anthropic API, Bedrock, or Vertex; o1 without function calling at that launch; DeepSeek via model=deepseek-reasoner, or the weights themselves. Operators should write down which of the three a support queue, a coding agent, and a customer-data workflow are allowed to use.",
  "",
  "Name the model that may drive a screen, the model that may think longer, and the price or license at which the work stops. The three posts already have.",
].join("\n");

export function isCuratedDemoSet(sources: Array<{ url?: string }>): boolean {
  if (sources.length !== DEMO_SOURCES.length) return false;
  const urls = new Set(sources.map((source) => canonicalize(source.url)));
  return DEMO_SOURCES.every((source) => urls.has(canonicalize(source.url)));
}

function canonicalize(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return url;
  }
}

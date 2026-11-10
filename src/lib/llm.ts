type ChatMessage = { role: "system" | "user"; content: string };

type Provider = {
  name: "openai" | "groq" | "gemini" | "anthropic";
  key: string;
  model: string;
  base?: string;
};

/**
 * One key is enough. If several are set, OpenAI wins, then Groq, then Gemini,
 * then Anthropic. OpenAI and Groq and Gemini share the chat-completions shape.
 * Anthropic uses the Messages API.
 */
function resolveProvider(): Provider | null {
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      name: "openai",
      key: openai,
      base: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      name: "groq",
      key: groq,
      base: (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/$/, ""),
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
    };
  }

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) {
    return {
      name: "gemini",
      key: gemini,
      base: (
        process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai"
      ).replace(/\/$/, ""),
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  }

  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    return {
      name: "anthropic",
      key: anthropic,
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
    };
  }

  return null;
}

export function hasModelKey(): boolean {
  return resolveProvider() !== null;
}

export async function completeJson(system: string, user: string): Promise<unknown | null> {
  const provider = resolveProvider();
  if (!provider) return null;

  if (provider.name === "anthropic") {
    const text = await anthropicText(provider, system, user);
    return text ? parseJson(text) : null;
  }

  const first = await chatCompletions(provider, system, user, true);
  if (first.ok) return first.value;
  if (first.status === 400) {
    const second = await chatCompletions(provider, system, user, false);
    if (second.ok) return second.value;
  }
  return null;
}

async function chatCompletions(
  provider: Provider,
  system: string,
  user: string,
  jsonMode: boolean,
): Promise<{ ok: true; value: unknown } | { ok: false; status: number }> {
  if (!provider.base) return { ok: false, status: 500 };
  const body: {
    model: string;
    temperature: number;
    messages: ChatMessage[];
    response_format?: { type: "json_object" };
  } = {
    model: provider.model,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const response = await fetch(`${provider.base}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    headers: {
      Authorization: `Bearer ${provider.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return { ok: false, status: response.status };
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return { ok: false, status: 502 };
  const value = parseJson(content);
  return value === null ? { ok: false, status: 502 } : { ok: true, value };
}

async function anthropicText(provider: Provider, system: string, user: string): Promise<string | null> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    headers: {
      "x-api-key": provider.key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 4096,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = payload.content?.find((block) => block.type === "text")?.text;
  return text ?? null;
}

function parseJson(content: string): unknown | null {
  try {
    return JSON.parse(stripFence(content));
  } catch {
    return null;
  }
}

function stripFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

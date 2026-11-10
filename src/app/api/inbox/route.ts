import { connection } from "next/server";
import { extractReadableArticle } from "@/lib/extract-article";
import { addClip, clearClips, listClips } from "@/lib/inbox-store";
import { inboxPostSchema } from "@/lib/schemas";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  await connection();
  return Response.json({ clips: listClips() }, { headers: CORS });
}

export async function DELETE() {
  await connection();
  clearClips();
  return Response.json({ ok: true }, { headers: CORS });
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "The clip was not valid JSON." }, { status: 400, headers: CORS });
  }

  const parsed = inboxPostSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "The clip was missing a URL or text." }, { status: 400, headers: CORS });
  }

  const body = parsed.data;
  const pasted = (body.text || body.selectedText || "").trim();
  const origin = body.origin ?? "manual";
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  if (pasted.length >= 80) {
    addClip({
      id,
      url: cleanUrl(body.url),
      title: body.title?.trim() || titleFromUrl(body.url) || "Pasted clip",
      text: pasted,
      status: "ready",
      origin,
      note: pasted.length < 400 ? "Short clip. The brief can only use what was selected." : undefined,
      createdAt,
    });
    return Response.json({ ok: true, clip: listClips()[0] }, { headers: CORS });
  }

  if (body.url) {
    const extracted = await extractReadableArticle(body.url);
    addClip({
      id,
      url: cleanUrl(body.url),
      title: body.title?.trim() || extracted.title || titleFromUrl(body.url) || "Untitled clip",
      text: extracted.text || pasted,
      status: extracted.ok ? "ready" : "needs_paste",
      note: extracted.ok ? undefined : extracted.reason,
      origin,
      createdAt,
    });
    return Response.json({ ok: true, clip: listClips()[0] }, { headers: CORS });
  }

  if (pasted.length > 0) {
    addClip({
      id,
      title: body.title?.trim() || "Pasted clip",
      text: pasted,
      status: "ready",
      note: "Short clip.",
      origin,
      createdAt,
    });
    return Response.json({ ok: true, clip: listClips()[0] }, { headers: CORS });
  }

  return Response.json(
    { ok: false, error: "Send a URL, selected text, or both." },
    { status: 400, headers: CORS },
  );
}

function cleanUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
}

function titleFromUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

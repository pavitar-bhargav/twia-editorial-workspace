import { extractReadableArticle } from "@/lib/extract-article";
import { extractRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "The request was not valid JSON." }, { status: 400 });
  }
  const parsed = extractRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, reason: "Missing a URL." }, { status: 400 });
  }
  const article = await extractReadableArticle(parsed.data.url);
  return Response.json(article);
}

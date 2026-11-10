import { researchRequestSchema } from "@/lib/schemas";
import { buildResearchBrief } from "@/lib/synthesize";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "The request was not valid JSON." }, { status: 400 });
  }
  const parsed = researchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Add at least one source with text." }, { status: 400 });
  }

  const ready = parsed.data.sources.filter((source) => source.text.trim().length > 0);
  const skipped = parsed.data.sources.length - ready.length;
  if (ready.length === 0) {
    return Response.json(
      { ok: false, error: "Every source still needs text. Paste the ones that would not fetch." },
      { status: 400 },
    );
  }

  try {
    const result = await buildResearchBrief(
      ready.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url || undefined,
        text: source.text,
      })),
    );
    const warning = [
      result.warning,
      skipped > 0 ? `${skipped} source${skipped === 1 ? "" : "s"} skipped because they have no text.` : "",
      ready.length < 3 ? "The desk is built for three or more sources. This brief is from fewer." : "",
    ]
      .filter(Boolean)
      .join(" ");

    return Response.json({
      ok: true,
      mode: result.mode,
      droppedFacts: result.droppedFacts,
      warning: warning || undefined,
      brief: result.brief,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The brief could not be built.";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

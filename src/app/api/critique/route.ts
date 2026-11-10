import { critiqueRequestSchema } from "@/lib/schemas";
import { buildCritique } from "@/lib/synthesize";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "The request was not valid JSON." }, { status: 400 });
  }
  const parsed = critiqueRequestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "The draft was empty or too large." }, { status: 400 });
  }

  try {
    const result = await buildCritique(parsed.data.draft, parsed.data.sources ?? []);
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json(
      { ok: false, error: "The critique pass failed. The rule marks are still live." },
      { status: 500 },
    );
  }
}

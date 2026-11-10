import { useState, type ReactNode } from "react";
import { findQuote } from "@/lib/citations";
import { Button } from "@/components/button";
import type { DeskSource, StoredBrief } from "@/lib/types";

export function ResearchBriefView({
  stored,
  sources,
  busy,
  onSynthesize,
  onStartAngle,
  onVerify,
}: {
  stored: StoredBrief | null;
  sources: DeskSource[];
  busy: boolean;
  onSynthesize: () => void;
  onStartAngle: (angleId: string) => void;
  onVerify: (sourceId: string) => void;
}) {
  const [openFact, setOpenFact] = useState<number | null>(null);
  const ready = sources.filter((source) => source.status === "ready" && source.text.trim()).length;

  if (!stored) {
    return (
      <div className="mx-auto max-w-[68ch] px-8 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-terra">Research brief</p>
        <h2 className="mt-3 font-serif text-[2rem] leading-tight text-ink">Nothing synthesized yet.</h2>
        <p className="mt-3 text-[15px] leading-6 text-slate">
          Add the clips, then ask the desk for a brief. With the curated set, this works before you add a model key.
        </p>
        <Button className="mt-6" tone="terra" onClick={onSynthesize} disabled={busy || ready === 0}>
          {busy ? "Reading the clips…" : "Synthesize brief"}
        </Button>
      </div>
    );
  }

  const { brief } = stored;
  return (
    <article className="mx-auto max-w-[72ch] px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-terra">{modeLabel(stored.mode)}</p>
        <Button tone="plain" onClick={onSynthesize} disabled={busy || ready === 0}>
          {busy ? "Reading the clips…" : "Run synthesis again"}
        </Button>
      </div>
      {stored.warning ? <p className="mt-3 text-[13px] leading-5 text-slate">{stored.warning}</p> : null}
      <h2 className="mt-4 font-serif text-[2.15rem] leading-[1.12] tracking-[-0.02em] text-ink">{brief.headline}</h2>
      <p className="mt-3 font-serif text-[1.2rem] italic leading-7 text-slate">{brief.dek}</p>

      <Section index="01" title="What happened">
        <p>{brief.whatHappened}</p>
      </Section>
      <Section index="02" title="Why it matters">
        <dl className="space-y-3">
          <Stake label="Founders" text={brief.whyItMatters.founders} />
          <Stake label="Builders" text={brief.whyItMatters.builders} />
          <Stake label="Operators" text={brief.whyItMatters.operators} />
        </dl>
      </Section>
      <Section index="03" title="Who should care">
        <p>{brief.whoShouldCare}</p>
      </Section>
      <Section index="04" title="Practical implication">
        <p>{brief.practicalImplication}</p>
      </Section>

      <Section index="05" title="Verifiable facts">
        <ol className="space-y-4">
          {brief.facts.map((fact, index) => {
            const sourceIndex = sources.findIndex((source) => source.id === fact.sourceId);
            const source = sources[sourceIndex];
            const located = source ? findQuote(source.text, fact.quote) : null;
            const open = openFact === index;
            return (
              <li key={`${fact.sourceId}-${index}`} className="border-t border-line pt-3">
                <p className="font-serif text-[17px] leading-6">{fact.claim}</p>
                <blockquote className="mt-2 border-l-2 border-terra pl-3 font-serif text-[15px] italic leading-6 text-slate">
                  “{fact.quote}”
                </blockquote>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-terra">
                    S{sourceIndex >= 0 ? sourceIndex + 1 : "?"}
                  </span>
                  <span className="font-mono text-[11px] text-forest">
                    {located ? "Quote is in the clip" : "Quote not found in the clip"}
                  </span>
                  <button
                    type="button"
                    className="text-[12px] text-ink underline-offset-2 hover:underline"
                    onClick={() => {
                      setOpenFact(open ? null : index);
                      if (source) onVerify(source.id);
                    }}
                  >
                    {open ? "Hide clip" : "Verify"}
                  </button>
                  {source?.url ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="text-[12px] text-forest">
                      Open original
                    </a>
                  ) : null}
                </div>
                {open && source ? <QuoteContext text={source.text} quote={fact.quote} /> : null}
              </li>
            );
          })}
        </ol>
      </Section>

      <Section index="06" title="Analysis and speculation">
        {brief.speculation.length === 0 ? (
          <p className="text-slate">None recorded. The extract does not invent a reading.</p>
        ) : (
          <ul className="space-y-3">
            {brief.speculation.map((item) => (
              <li key={item.claim}>
                <p>{item.claim}</p>
                <p className="mt-1 text-[13px] leading-5 text-slate">{item.basis}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section index="07" title="Newsletter angles">
        <ol className="space-y-5">
          {brief.angles.map((angle, index) => (
            <li key={angle.id} className="border-t border-line pt-3">
              <p className="font-mono text-[11px] tabular-nums text-slate">0{index + 1}</p>
              <h3 className="mt-1 font-serif text-[1.35rem] leading-snug">{angle.title}</h3>
              <p className="mt-2">{angle.hook}</p>
              <p className="mt-1 text-[13px] leading-5 text-slate">{angle.whyNow}</p>
              <Button className="mt-3" tone="terra" onClick={() => onStartAngle(angle.id)}>
                Start draft from this angle
              </Button>
            </li>
          ))}
        </ol>
      </Section>
    </article>
  );
}

function Section({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate">
        <span className="mr-2 tabular-nums text-terra">{index}</span>
        {title}
      </h3>
      <div className="mt-2 font-serif text-[17.5px] leading-7 text-ink">{children}</div>
    </section>
  );
}

function Stake({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="font-sans text-[12px] font-medium uppercase tracking-[0.12em] text-forest">{label}</dt>
      <dd className="mt-1">{text}</dd>
    </div>
  );
}

function QuoteContext({ text, quote }: { text: string; quote: string }) {
  const located = findQuote(text, quote);
  if (!located) {
    return <p className="mt-2 text-[13px] text-slate">The quote is not in the text this desk is holding.</p>;
  }
  const start = Math.max(0, located.start - 180);
  const end = Math.min(text.length, located.end + 180);
  return (
    <p className="mt-3 bg-stone px-3 py-2 font-serif text-[14px] leading-6 text-ink">
      {text.slice(start, located.start)}
      <mark className="mark-quote">{text.slice(located.start, located.end)}</mark>
      {text.slice(located.end, end)}
    </p>
  );
}

function modeLabel(mode: StoredBrief["mode"]): string {
  if (mode === "curated") return "Curated desk brief · quotes checked · no model";
  if (mode === "model") return "Model synthesis · quotes checked against the clips";
  return "Extract only · not a cross-source argument";
}

import { z } from "zod";

export const sourceInputSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(300),
  url: z.string().max(2_000).optional(),
  text: z.string().max(200_000),
});

export const researchRequestSchema = z.object({
  sources: z.array(sourceInputSchema).min(1).max(12),
});

export const extractRequestSchema = z.object({
  url: z.string().min(4).max(2_000),
});

export const inboxPostSchema = z.object({
  url: z.string().max(2_000).optional(),
  title: z.string().max(300).optional(),
  text: z.string().max(200_000).optional(),
  selectedText: z.string().max(50_000).optional(),
  origin: z.enum(["manual", "bookmarklet", "extension"]).optional(),
});

export const critiqueRequestSchema = z.object({
  draft: z.string().min(1).max(100_000),
  sources: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        text: z.string().max(200_000),
      }),
    )
    .max(12)
    .optional(),
});

export const researchBriefSchema = z.object({
  headline: z.string().min(4).max(200),
  dek: z.string().min(4).max(600),
  whatHappened: z.string().min(20),
  whyItMatters: z.object({
    founders: z.string().min(8),
    builders: z.string().min(8),
    operators: z.string().min(8),
  }),
  whoShouldCare: z.string().min(8),
  practicalImplication: z.string().min(8),
  facts: z
    .array(
      z.object({
        claim: z.string().min(4),
        quote: z.string().min(4),
        sourceId: z.string().min(1),
      }),
    )
    .min(1),
  speculation: z
    .array(
      z.object({
        claim: z.string().min(4),
        basis: z.string().min(4),
      }),
    )
    .default([]),
  angles: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        title: z.string().min(4),
        hook: z.string().min(4),
        whyNow: z.string().min(4),
      }),
    )
    .min(1)
    .max(5),
});

export const critiqueSchema = z.object({
  summary: z.string().min(8).max(1_200),
  issues: z
    .array(
      z.object({
        category: z.enum(["repetition", "structure", "unsupported", "nuance"]),
        passage: z.string().min(8),
        explanation: z.string().min(8),
        suggestion: z.string().max(2_000),
      }),
    )
    .max(8),
});

export const extractResponseSchema = z.object({
  ok: z.boolean(),
  title: z.string().optional(),
  text: z.string().optional(),
  reason: z.string().optional(),
});

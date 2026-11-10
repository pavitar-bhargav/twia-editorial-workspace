export function applySuggestion(
  draft: string,
  start: number,
  end: number,
  suggestion: string,
): string {
  if (start < 0 || end > draft.length || start > end) return draft;
  const passage = draft.slice(start, end);
  if (!passage || passage === suggestion) return draft;

  let next = draft.slice(0, start) + suggestion + draft.slice(end);
  if (suggestion !== "") return next;

  next = next
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ");

  const head = next.slice(0, start);
  const tail = next.slice(start);
  const atBoundary = start === 0 || /[.!?\n]\s*$/.test(head);
  if (!atBoundary) return next;
  return head + tail.replace(/^(\s*)([a-z])/, (_, space: string, letter: string) => {
    return space + letter.toUpperCase();
  });
}

/** Word tokens keep decimals and hyphenated compounds together, so "5.2" and "KV-cache" count once. */
export const WORD_PATTERN =
  /[A-Za-z0-9$]+(?:['’][A-Za-z]+)?(?:[.-][A-Za-z0-9]+)*/g;

export function tokenizeWords(text: string): string[] {
  WORD_PATTERN.lastIndex = 0;
  return text.match(WORD_PATTERN) ?? [];
}

export function countWords(text: string): number {
  return tokenizeWords(text).length;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

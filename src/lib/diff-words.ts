export type DiffPart = {
  type: "equal" | "delete" | "insert";
  text: string;
};

export function diffWords(before: string, after: string): DiffPart[] {
  const left = before.split(/(\s+)/);
  const right = after.split(/(\s+)/);
  if (left.length * right.length > 1_500_000) {
    return [
      { type: "delete", text: before },
      { type: "insert", text: after },
    ];
  }

  const rows = left.length + 1;
  const cols = right.length + 1;
  const scores: number[] = new Array(rows * cols).fill(0);
  const at = (row: number, col: number) => row * cols + col;
  for (let row = left.length - 1; row >= 0; row -= 1) {
    for (let col = right.length - 1; col >= 0; col -= 1) {
      scores[at(row, col)] =
        left[row] === right[col]
          ? scores[at(row + 1, col + 1)] + 1
          : Math.max(scores[at(row + 1, col)], scores[at(row, col + 1)]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (type: DiffPart["type"], text: string) => {
    if (!text) return;
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ type, text });
  };

  let row = 0;
  let col = 0;
  while (row < left.length && col < right.length) {
    if (left[row] === right[col]) {
      push("equal", left[row]);
      row += 1;
      col += 1;
    } else if (scores[at(row + 1, col)] >= scores[at(row, col + 1)]) {
      push("delete", left[row]);
      row += 1;
    } else {
      push("insert", right[col]);
      col += 1;
    }
  }
  while (row < left.length) push("delete", left[row++]);
  while (col < right.length) push("insert", right[col++]);
  return parts;
}

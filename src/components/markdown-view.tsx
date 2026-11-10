import type { ReactNode } from "react";

export function MarkdownView({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className="md-body">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

type Block =
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      const parsed = parseTable(tableLines);
      if (parsed) blocks.push(parsed);
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "h", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      index += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      const quoted: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quoted.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push({ type: "quote", text: quoted.join(" ") });
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].startsWith("#") &&
      !lines[index].startsWith("- ") &&
      !/^\d+\.\s+/.test(lines[index]) &&
      !lines[index].startsWith("> ") &&
      !lines[index].startsWith("|") &&
      !/^---+$/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "p", text: paragraph.join(" ") });
  }

  return blocks;
}

function parseTable(lines: string[]): Block | null {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  if (rows.length < 2) return null;
  return { type: "table", headers: rows[0], rows: rows.slice(1) };
}

function Block({ block }: { block: Block }) {
  if (block.type === "h") {
    const Tag = `h${block.level}` as "h1" | "h2" | "h3";
    return <Tag>{inline(block.text)}</Tag>;
  }
  if (block.type === "ul" || block.type === "ol") {
    const Tag = block.type === "ul" ? "ul" : "ol";
    return (
      <Tag>
        {block.items.map((item) => (
          <li key={item}>{inline(item)}</li>
        ))}
      </Tag>
    );
  }
  if (block.type === "quote") return <blockquote>{inline(block.text)}</blockquote>;
  if (block.type === "hr") return <hr />;
  if (block.type === "table") {
    return (
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th key={header}>{inline(header)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{inline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return <p>{inline(block.text)}</p>;
}

function inline(text: string): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    if (match[1] && match[2]) {
      nodes.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noreferrer">
          {match[1]}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={match.index}>{match[3]}</strong>);
    } else if (match[4]) {
      nodes.push(<code key={match.index}>{match[4]}</code>);
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

"use client";

import React from "react";

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  if (!content) return null;

  // Split into lines or blocks
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableRows: string[][] = [];
  let tableKey = 0;

  function flushTable() {
    if (tableRows.length === 0) return;
    const header = tableRows[0];
    const dataRows = tableRows.slice(1).filter((r) => !r.every((c) => /^[-:| ]+$/.test(c)));

    elements.push(
      <div key={`table-${tableKey++}`} className="my-2 overflow-x-auto rounded-lg border border-border/60 bg-muted/20">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 font-semibold text-foreground">
              {header.map((col, i) => (
                <th key={i} className="px-3 py-2">
                  {formatInline(col.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-1.5 text-foreground/85">
                    {formatInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for Table Row
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      const cells = line.split("|").slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Empty line
    if (!line) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Horizontal Rule
    if (line === "---" || line === "***") {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-border/60" />);
      continue;
    }

    // Blockquote (often for DB tool execution callouts)
    if (line.startsWith(">")) {
      const bqText = line.replace(/^>\s?/, "");
      elements.push(
        <div
          key={`bq-${i}`}
          className="my-1.5 rounded-lg border-l-4 border-emerald-500 bg-emerald-500/10 px-3 py-2 text-xs text-foreground/90 backdrop-blur-xs"
        >
          {formatInline(bqText)}
        </div>
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${i}`} className="mt-3 mb-1 text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
          {formatInline(line.replace("### ", ""))}
        </h4>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="mt-4 mb-1.5 text-base font-bold tracking-tight text-foreground">
          {formatInline(line.replace("## ", ""))}
        </h3>
      );
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="mt-4 mb-2 text-lg font-extrabold text-foreground">
          {formatInline(line.replace("# ", ""))}
        </h2>
      );
      continue;
    }

    // Bullet points
    if (/^[-*•]\s/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={`bullet-${i}`} className="ml-2 my-0.5 flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
          <span className="text-primary mt-1 text-[8px]">●</span>
          <span className="flex-1">{formatInline(itemText)}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      const [, num, itemText] = numMatch;
      elements.push(
        <div key={`num-${i}`} className="ml-2 my-0.5 flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
          <span className="font-semibold text-primary/80 min-w-[16px] text-right">{num}.</span>
          <span className="flex-1">{formatInline(itemText)}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1 text-xs leading-relaxed text-foreground/90">
        {formatInline(line)}
      </p>
    );
  }

  if (inTable) flushTable();

  return <div className="space-y-0.5 text-xs text-foreground">{elements}</div>;
}

/**
 * Parses inline markdown:
 * - **bold**
 * - *italic*
 * - `code`
 * - Badges: 🔴, 🟡, 🟢, [DB_TOOL: ...], [RED ZONE]
 */
function formatInline(text: string): React.ReactNode {
  // Regex to match code blocks, bold, badges
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // 1. Tool execution badge: `[DB_TOOL: name()]`
    const toolMatch = remaining.match(/`\[DB_TOOL:\s*([^\]]+)\]`/);
    if (toolMatch && toolMatch.index !== undefined) {
      if (toolMatch.index > 0) {
        parts.push(...parseFormatting(remaining.slice(0, toolMatch.index), key++));
      }
      parts.push(
        <span
          key={`tool-${key++}`}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold"
        >
          ⚡ Tool: {toolMatch[1]}
        </span>
      );
      remaining = remaining.slice(toolMatch.index + toolMatch[0].length);
      continue;
    }

    // 2. Inline code `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(...parseFormatting(remaining.slice(0, codeMatch.index), key++));
      }
      parts.push(
        <code
          key={`code-${key++}`}
          className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px] text-primary font-medium"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // If no more special matches, parse remaining
    parts.push(...parseFormatting(remaining, key++));
    break;
  }

  return parts;
}

function parseFormatting(text: string, baseKey: number): React.ReactNode[] {
  // Handle **bold** and *italic*
  const result: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let subKey = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(renderTextWithBadges(text.slice(lastIndex, match.index), `${baseKey}-${subKey++}`));
    }

    if (match[2]) {
      // Bold
      result.push(
        <strong key={`b-${baseKey}-${subKey++}`} className="font-semibold text-foreground">
          {renderTextWithBadges(match[2], `${baseKey}-${subKey++}`)}
        </strong>
      );
    } else if (match[3]) {
      // Italic
      result.push(
        <em key={`i-${baseKey}-${subKey++}`} className="italic text-foreground/80">
          {match[3]}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(renderTextWithBadges(text.slice(lastIndex), `${baseKey}-${subKey++}`));
  }

  return result;
}

function renderTextWithBadges(text: string, key: string): React.ReactNode {
  // Highlight hazard badges: RED ZONE, YELLOW ZONE, GREEN ZONE
  if (text.includes("RED ZONE") || text.includes("IMMEDIATE")) {
    const parts = text.split(/(RED ZONE|IMMEDIATE)/g);
    return (
      <span key={key}>
        {parts.map((part, i) =>
          part === "RED ZONE" || part === "IMMEDIATE" ? (
            <span
              key={i}
              className="inline-flex items-center rounded-sm bg-destructive/15 border border-destructive/30 px-1 py-0.2 text-[10px] font-bold text-destructive"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  return text;
}

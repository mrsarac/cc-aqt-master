/**
 * JSONL (JSON Lines) parser utilities
 *
 * Streaming parser for Claude Code log files
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * Parse a single JSONL line
 */
export function parseJsonlLine<T>(line: string): T | null {
  try {
    const trimmed = line.trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/**
 * Stream and parse a JSONL file
 * Yields parsed objects one by one
 */
export async function* streamJsonl<T>(filePath: string): AsyncGenerator<T> {
  const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const parsed = parseJsonlLine<T>(line);
    if (parsed !== null) {
      yield parsed;
    }
  }
}

/**
 * Read entire JSONL file into array
 * Use streamJsonl for large files
 */
export async function readJsonl<T>(filePath: string): Promise<T[]> {
  const results: T[] = [];
  for await (const item of streamJsonl<T>(filePath)) {
    results.push(item);
  }
  return results;
}

/**
 * Claude Code log entry structure (partial)
 */
export interface ClaudeLogEntry {
  timestamp?: string;
  type?: string;
  message?: {
    role?: string;
    content?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  model?: string;
  session_id?: string;
}

/**
 * Calculate token totals from log entries
 */
export function calculateTokenTotals(entries: ClaudeLogEntry[]): {
  input: number;
  output: number;
  cached: number;
  total: number;
} {
  let input = 0;
  let output = 0;
  let cached = 0;

  for (const entry of entries) {
    if (entry.usage) {
      input += entry.usage.input_tokens || 0;
      output += entry.usage.output_tokens || 0;
      cached +=
        (entry.usage.cache_creation_input_tokens || 0) +
        (entry.usage.cache_read_input_tokens || 0);
    }
  }

  return {
    input,
    output,
    cached,
    total: input + output,
  };
}

/**
 * JSONL (JSON Lines) Streaming Parser
 *
 * Production-ready parser for Claude Code log files
 * Supports: streaming, gzip, progress tracking, error handling
 */

import { createReadStream, statSync } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import type {
  RawLogEntry,
  TokenUsage,
  TokenTotals,
  JSONLParserOptions,
  ParseError,
  ParseResult,
  ParserStats,
  SessionSummary,
} from '../types/claude-log.js';

/**
 * Default parser options
 */
const DEFAULT_OPTIONS: JSONLParserOptions = {
  skipMalformed: true,
  validate: false,
};

/**
 * Parse a single JSONL line
 * @returns Parsed object or null if invalid
 */
export function parseJsonlLine<T = RawLogEntry>(
  line: string,
  lineNumber: number = 0,
  onError?: (error: ParseError) => void
): T | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null; // Empty line or comment
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (err) {
    if (onError) {
      onError({
        lineNumber,
        raw: trimmed.slice(0, 200), // Truncate for safety
        error: err instanceof Error ? err.message : 'Unknown parse error',
      });
    }
    return null;
  }
}

/**
 * Check if file is gzip compressed
 */
export function isGzipFile(filePath: string): boolean {
  return filePath.endsWith('.gz') || filePath.endsWith('.gzip');
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

/**
 * Create a readable stream with optional gzip decompression
 */
function createInputStream(filePath: string): Readable {
  const fileStream = createReadStream(filePath);

  if (isGzipFile(filePath)) {
    const gunzip = createGunzip();
    fileStream.pipe(gunzip);
    return gunzip;
  }

  return fileStream;
}

/**
 * Stream and parse a JSONL file with async generator
 * Yields parsed objects one by one
 *
 * @example
 * ```typescript
 * for await (const entry of streamJsonl('~/.claude/logs.jsonl')) {
 *   console.log(entry.type, entry.usage);
 * }
 * ```
 */
export async function* streamJsonl<T = RawLogEntry>(
  filePath: string,
  options: JSONLParserOptions = {}
): AsyncGenerator<T, ParserStats, undefined> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const totalBytes = getFileSize(filePath);
  let bytesRead = 0;
  let lineNumber = 0;
  let parsedLines = 0;
  let skippedLines = 0;
  const startTime = Date.now();

  const inputStream = createInputStream(filePath);

  // Track bytes for progress
  inputStream.on('data', (chunk: Buffer | string) => {
    const chunkSize = typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
    bytesRead += chunkSize;
    if (opts.onProgress && totalBytes > 0) {
      opts.onProgress(bytesRead, totalBytes);
    }
  });

  const rl = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  try {
    for await (const line of rl) {
      lineNumber++;

      const parsed = parseJsonlLine<T>(line, lineNumber, opts.onError);

      if (parsed === null) {
        if (line.trim()) {
          skippedLines++;
        }
        continue;
      }

      // Filter by type if specified
      if (opts.filterTypes && opts.filterTypes.length > 0) {
        const entry = parsed as unknown as RawLogEntry;
        if (entry.type && !opts.filterTypes.includes(entry.type)) {
          continue;
        }
      }

      parsedLines++;
      yield parsed;
    }
  } finally {
    rl.close();
    inputStream.destroy();
  }

  // Return stats (accessible via generator.return())
  return {
    totalLines: lineNumber,
    parsedLines,
    skippedLines,
    bytesProcessed: bytesRead,
    duration: Date.now() - startTime,
  };
}

/**
 * Convenience wrapper that returns parsed entries with metadata
 */
export async function* streamJsonlWithMeta<T = RawLogEntry>(
  filePath: string,
  options: JSONLParserOptions = {}
): AsyncGenerator<ParseResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const inputStream = createInputStream(filePath);

  const rl = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let lineNumber = 0;

  try {
    for await (const line of rl) {
      lineNumber++;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      try {
        const data = JSON.parse(trimmed) as T;

        // Filter by type if specified
        if (opts.filterTypes && opts.filterTypes.length > 0) {
          const entry = data as unknown as RawLogEntry;
          if (entry.type && !opts.filterTypes.includes(entry.type)) {
            continue;
          }
        }

        yield {
          data,
          lineNumber,
          raw: trimmed,
        };
      } catch (err) {
        if (opts.onError) {
          opts.onError({
            lineNumber,
            raw: trimmed.slice(0, 200),
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
        if (!opts.skipMalformed) {
          throw err;
        }
      }
    }
  } finally {
    rl.close();
    inputStream.destroy();
  }
}

/**
 * Read entire JSONL file into array
 * Use streamJsonl for large files to avoid memory issues
 */
export async function readJsonl<T = RawLogEntry>(
  filePath: string,
  options: JSONLParserOptions = {}
): Promise<T[]> {
  const results: T[] = [];
  for await (const item of streamJsonl<T>(filePath, options)) {
    results.push(item);
  }
  return results;
}

/**
 * Parse JSONL from string content (useful for testing)
 */
export function* parseJsonlString<T = RawLogEntry>(
  content: string,
  options: JSONLParserOptions = {}
): Generator<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const parsed = parseJsonlLine<T>(lines[i], i + 1, opts.onError);

    if (parsed === null) {
      continue;
    }

    // Filter by type if specified
    if (opts.filterTypes && opts.filterTypes.length > 0) {
      const entry = parsed as unknown as RawLogEntry;
      if (entry.type && !opts.filterTypes.includes(entry.type)) {
        continue;
      }
    }

    yield parsed;
  }
}

/**
 * Calculate token totals from log entries
 *
 * @example
 * ```typescript
 * const entries = await readJsonl<RawLogEntry>('logs.jsonl');
 * const totals = calculateTokenTotals(entries);
 * console.log(`Total cost: $${totals.costEstimate.totalCost.toFixed(4)}`);
 * ```
 */
export function calculateTokenTotals(entries: RawLogEntry[]): TokenTotals {
  let input = 0;
  let output = 0;
  let cacheCreation = 0;
  let cacheRead = 0;

  for (const entry of entries) {
    if (entry.usage) {
      input += entry.usage.input_tokens || 0;
      output += entry.usage.output_tokens || 0;
      cacheCreation += entry.usage.cache_creation_input_tokens || 0;
      cacheRead += entry.usage.cache_read_input_tokens || 0;
    }
  }

  // Claude pricing (as of 2024): Sonnet
  // Input: $3/MTok, Output: $15/MTok, Cache read: $0.30/MTok
  const inputCost = (input / 1_000_000) * 3;
  const outputCost = (output / 1_000_000) * 15;
  const cacheReadCost = (cacheRead / 1_000_000) * 0.3;

  return {
    input,
    output,
    cacheCreation,
    cacheRead,
    total: input + output,
    costEstimate: {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost + cacheReadCost,
    },
  };
}

/**
 * Calculate token totals using streaming (for large files)
 */
export async function calculateTokenTotalsStream(
  filePath: string,
  options: JSONLParserOptions = {}
): Promise<TokenTotals> {
  let input = 0;
  let output = 0;
  let cacheCreation = 0;
  let cacheRead = 0;

  for await (const entry of streamJsonl<RawLogEntry>(filePath, options)) {
    if (entry.usage) {
      input += entry.usage.input_tokens || 0;
      output += entry.usage.output_tokens || 0;
      cacheCreation += entry.usage.cache_creation_input_tokens || 0;
      cacheRead += entry.usage.cache_read_input_tokens || 0;
    }
  }

  const inputCost = (input / 1_000_000) * 3;
  const outputCost = (output / 1_000_000) * 15;
  const cacheReadCost = (cacheRead / 1_000_000) * 0.3;

  return {
    input,
    output,
    cacheCreation,
    cacheRead,
    total: input + output,
    costEstimate: {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost + cacheReadCost,
    },
  };
}

/**
 * Extract session summaries from log entries
 */
export function extractSessionSummaries(entries: RawLogEntry[]): SessionSummary[] {
  const sessions = new Map<string, SessionSummary>();

  for (const entry of entries) {
    const sessionId = entry.session_id || 'unknown';

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        sessionId,
        startTime: entry.timestamp || new Date().toISOString(),
        model: entry.model,
        messageCount: {
          user: 0,
          assistant: 0,
          tool: 0,
          system: 0,
          error: 0,
        },
        tokenUsage: {
          input: 0,
          output: 0,
          cacheCreation: 0,
          cacheRead: 0,
          total: 0,
          costEstimate: { inputCost: 0, outputCost: 0, totalCost: 0 },
        },
      });
    }

    const session = sessions.get(sessionId)!;

    // Update timestamp
    if (entry.timestamp) {
      if (!session.startTime || entry.timestamp < session.startTime) {
        session.startTime = entry.timestamp;
      }
      if (!session.endTime || entry.timestamp > session.endTime) {
        session.endTime = entry.timestamp;
      }
    }

    // Update model
    if (entry.model) {
      session.model = entry.model;
    }

    // Count message types
    switch (entry.type) {
      case 'user':
        session.messageCount.user++;
        break;
      case 'assistant':
        session.messageCount.assistant++;
        break;
      case 'tool':
        session.messageCount.tool++;
        break;
      case 'system':
        session.messageCount.system++;
        break;
      case 'error':
        session.messageCount.error++;
        break;
    }

    // Accumulate token usage
    if (entry.usage) {
      session.tokenUsage.input += entry.usage.input_tokens || 0;
      session.tokenUsage.output += entry.usage.output_tokens || 0;
      session.tokenUsage.cacheCreation += entry.usage.cache_creation_input_tokens || 0;
      session.tokenUsage.cacheRead += entry.usage.cache_read_input_tokens || 0;
      session.tokenUsage.total = session.tokenUsage.input + session.tokenUsage.output;
    }
  }

  // Calculate costs for each session
  for (const session of sessions.values()) {
    const { input, output, cacheRead } = session.tokenUsage;
    session.tokenUsage.costEstimate = {
      inputCost: (input / 1_000_000) * 3,
      outputCost: (output / 1_000_000) * 15,
      totalCost:
        (input / 1_000_000) * 3 +
        (output / 1_000_000) * 15 +
        (cacheRead / 1_000_000) * 0.3,
    };
  }

  return Array.from(sessions.values()).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
}

/**
 * Count entries by type
 */
export async function countEntriesByType(
  filePath: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for await (const entry of streamJsonl<RawLogEntry>(filePath)) {
    const type = entry.type || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  }

  return counts;
}

// Re-export types for convenience
export type { RawLogEntry, TokenUsage, TokenTotals, JSONLParserOptions, ParseError, ParserStats };

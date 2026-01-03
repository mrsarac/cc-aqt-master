/**
 * Claude Code Log Entry Types
 *
 * Type definitions for Claude Code conversation log files
 * Located at: ~/.claude/projects/<project>/logs.jsonl
 */

import { z } from 'zod';

/**
 * Token usage information from Claude API
 */
export const TokenUsageSchema = z.object({
  input_tokens: z.number().optional(),
  output_tokens: z.number().optional(),
  cache_creation_input_tokens: z.number().optional(),
  cache_read_input_tokens: z.number().optional(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

/**
 * User message entry
 */
export const UserEntrySchema = z.object({
  type: z.literal('user'),
  timestamp: z.string(),
  content: z.string(),
  session_id: z.string().optional(),
});

export type UserEntry = z.infer<typeof UserEntrySchema>;

/**
 * Assistant (Claude) message entry
 */
export const AssistantEntrySchema = z.object({
  type: z.literal('assistant'),
  timestamp: z.string(),
  content: z.string(),
  model: z.string().optional(),
  usage: TokenUsageSchema.optional(),
  session_id: z.string().optional(),
  stop_reason: z.string().optional(),
});

export type AssistantEntry = z.infer<typeof AssistantEntrySchema>;

/**
 * Tool call entry (Read, Write, Bash, etc.)
 */
export const ToolEntrySchema = z.object({
  type: z.literal('tool'),
  timestamp: z.string(),
  name: z.string(),
  input: z.record(z.unknown()).optional(),
  result: z.string().optional(),
  error: z.string().optional(),
  duration_ms: z.number().optional(),
  session_id: z.string().optional(),
});

export type ToolEntry = z.infer<typeof ToolEntrySchema>;

/**
 * System message entry
 */
export const SystemEntrySchema = z.object({
  type: z.literal('system'),
  timestamp: z.string(),
  content: z.string(),
  session_id: z.string().optional(),
});

export type SystemEntry = z.infer<typeof SystemEntrySchema>;

/**
 * Error entry
 */
export const ErrorEntrySchema = z.object({
  type: z.literal('error'),
  timestamp: z.string(),
  message: z.string(),
  code: z.string().optional(),
  session_id: z.string().optional(),
});

export type ErrorEntry = z.infer<typeof ErrorEntrySchema>;

/**
 * Session metadata entry
 */
export const SessionEntrySchema = z.object({
  type: z.literal('session'),
  timestamp: z.string(),
  session_id: z.string(),
  action: z.enum(['start', 'end', 'resume']),
  project_path: z.string().optional(),
  model: z.string().optional(),
});

export type SessionEntry = z.infer<typeof SessionEntrySchema>;

/**
 * Union of all log entry types
 */
export const ClaudeLogEntrySchema = z.discriminatedUnion('type', [
  UserEntrySchema,
  AssistantEntrySchema,
  ToolEntrySchema,
  SystemEntrySchema,
  ErrorEntrySchema,
  SessionEntrySchema,
]);

export type ClaudeLogEntry = z.infer<typeof ClaudeLogEntrySchema>;

/**
 * Generic log entry for parsing (before validation)
 */
export interface RawLogEntry {
  type?: string;
  timestamp?: string;
  content?: string;
  message?: {
    role?: string;
    content?: string;
  };
  usage?: TokenUsage;
  model?: string;
  session_id?: string;
  name?: string;
  input?: Record<string, unknown>;
  result?: string;
  error?: string;
  [key: string]: unknown;
}

/**
 * Token totals calculated from log entries
 */
export interface TokenTotals {
  input: number;
  output: number;
  cacheCreation: number;
  cacheRead: number;
  total: number;
  costEstimate: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
  };
}

/**
 * Session summary extracted from logs
 */
export interface SessionSummary {
  sessionId: string;
  startTime: string;
  endTime?: string;
  model?: string;
  projectPath?: string;
  messageCount: {
    user: number;
    assistant: number;
    tool: number;
    system: number;
    error: number;
  };
  tokenUsage: TokenTotals;
}

/**
 * Parse result with metadata
 */
export interface ParseResult<T> {
  data: T;
  lineNumber: number;
  raw: string;
}

/**
 * Parse error information
 */
export interface ParseError {
  lineNumber: number;
  raw: string;
  error: string;
}

/**
 * Parser options
 */
export interface JSONLParserOptions {
  /** Skip malformed lines instead of throwing */
  skipMalformed?: boolean;
  /** Callback for parse errors */
  onError?: (error: ParseError) => void;
  /** Progress callback (bytesRead, totalBytes) */
  onProgress?: (bytesRead: number, totalBytes: number) => void;
  /** Validate entries against schema */
  validate?: boolean;
  /** Filter entries by type */
  filterTypes?: string[];
}

/**
 * Parser statistics
 */
export interface ParserStats {
  totalLines: number;
  parsedLines: number;
  skippedLines: number;
  bytesProcessed: number;
  duration: number;
}

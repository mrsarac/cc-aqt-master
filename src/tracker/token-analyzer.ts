/**
 * Token Analyzer
 *
 * Analyze token usage from Claude Code log files
 */

import {
  streamJsonl,
  calculateTokenTotalsStream,
  extractSessionSummaries,
  readJsonl,
  type RawLogEntry,
  type TokenTotals,
} from '../utils/jsonl.js';
import type { SessionInfo } from './session-detector.js';

/**
 * Session usage summary
 */
export interface SessionUsage {
  sessionId: string;
  sessionLabel: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreation: number;
  cacheRead: number;
  totalTokens: number;
  costUSD: number;
  cacheHitRatio: number;
  messageCount: number;
  timestamp: Date;
  duration?: number; // in milliseconds
}

/**
 * Project usage summary
 */
export interface ProjectUsage {
  projectId: string;
  projectName: string;
  sessions: SessionUsage[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheCreation: number;
    cacheRead: number;
    totalTokens: number;
    costUSD: number;
    cacheHitRatio: number;
    messageCount: number;
    sessionCount: number;
  };
}

/**
 * Token pricing (Claude Sonnet as of 2024)
 */
const PRICING = {
  inputPerMillion: 3, // $3 per 1M input tokens
  outputPerMillion: 15, // $15 per 1M output tokens
  cacheReadPerMillion: 0.3, // $0.30 per 1M cached tokens
};

/**
 * Calculate cost from token counts
 */
export function calculateCost(
  input: number,
  output: number,
  cacheRead: number = 0
): number {
  const inputCost = (input / 1_000_000) * PRICING.inputPerMillion;
  const outputCost = (output / 1_000_000) * PRICING.outputPerMillion;
  const cacheCost = (cacheRead / 1_000_000) * PRICING.cacheReadPerMillion;
  return inputCost + outputCost + cacheCost;
}

/**
 * Calculate cache hit ratio
 */
export function calculateCacheHitRatio(
  input: number,
  cacheRead: number
): number {
  if (input + cacheRead === 0) return 0;
  return cacheRead / (input + cacheRead);
}

/**
 * Format timestamp for display
 */
export function formatSessionLabel(timestamp: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sessionDate = new Date(
    timestamp.getFullYear(),
    timestamp.getMonth(),
    timestamp.getDate()
  );

  const timeStr = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (sessionDate.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  } else if (sessionDate.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  } else {
    const dateStr = timestamp.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr} ${timeStr}`;
  }
}

/**
 * Analyze a single log file
 */
export async function analyzeLogFile(logFile: string): Promise<SessionUsage> {
  const entries = await readJsonl<RawLogEntry>(logFile);

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheCreation = 0;
  let cacheRead = 0;
  let messageCount = 0;
  let firstTimestamp: Date | null = null;
  let lastTimestamp: Date | null = null;
  let sessionId = '';

  for (const entry of entries) {
    // Track timestamps for duration
    if (entry.timestamp) {
      const ts = new Date(entry.timestamp);
      if (!firstTimestamp || ts < firstTimestamp) {
        firstTimestamp = ts;
      }
      if (!lastTimestamp || ts > lastTimestamp) {
        lastTimestamp = ts;
      }
    }

    // Get session ID from first entry that has it
    if (!sessionId && entry.session_id) {
      sessionId = entry.session_id;
    }

    // Count messages
    if (entry.type === 'user' || entry.type === 'assistant') {
      messageCount++;
    }

    // Accumulate token usage
    if (entry.usage) {
      inputTokens += entry.usage.input_tokens || 0;
      outputTokens += entry.usage.output_tokens || 0;
      cacheCreation += entry.usage.cache_creation_input_tokens || 0;
      cacheRead += entry.usage.cache_read_input_tokens || 0;
    }
  }

  const totalTokens = inputTokens + outputTokens;
  const costUSD = calculateCost(inputTokens, outputTokens, cacheRead);
  const cacheHitRatio = calculateCacheHitRatio(inputTokens, cacheRead);
  const timestamp = firstTimestamp || new Date();
  const duration =
    firstTimestamp && lastTimestamp
      ? lastTimestamp.getTime() - firstTimestamp.getTime()
      : undefined;

  return {
    sessionId: sessionId || logFile,
    sessionLabel: formatSessionLabel(timestamp),
    inputTokens,
    outputTokens,
    cacheCreation,
    cacheRead,
    totalTokens,
    costUSD,
    cacheHitRatio,
    messageCount,
    timestamp,
    duration,
  };
}

/**
 * Analyze multiple sessions
 */
export async function analyzeSessions(
  sessions: SessionInfo[],
  limit: number = 5
): Promise<SessionUsage[]> {
  const results: SessionUsage[] = [];
  const sessionsToAnalyze = sessions.slice(0, limit);

  for (const session of sessionsToAnalyze) {
    try {
      const usage = await analyzeLogFile(session.logFile);
      // Use the session's timestamp if available
      if (session.timestamp) {
        usage.timestamp = session.timestamp;
        usage.sessionLabel = formatSessionLabel(session.timestamp);
      }
      results.push(usage);
    } catch (error) {
      // Skip files that can't be parsed
      console.error(`Warning: Could not analyze ${session.logFile}`);
    }
  }

  return results;
}

/**
 * Analyze all sessions for a project
 */
export async function analyzeProject(
  projectId: string,
  projectName: string,
  sessions: SessionInfo[],
  limit: number = 5
): Promise<ProjectUsage> {
  const sessionUsages = await analyzeSessions(sessions, limit);

  // Calculate totals
  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreation: 0,
    cacheRead: 0,
    totalTokens: 0,
    costUSD: 0,
    cacheHitRatio: 0,
    messageCount: 0,
    sessionCount: sessionUsages.length,
  };

  for (const session of sessionUsages) {
    totals.inputTokens += session.inputTokens;
    totals.outputTokens += session.outputTokens;
    totals.cacheCreation += session.cacheCreation;
    totals.cacheRead += session.cacheRead;
    totals.totalTokens += session.totalTokens;
    totals.costUSD += session.costUSD;
    totals.messageCount += session.messageCount;
  }

  // Calculate overall cache hit ratio
  totals.cacheHitRatio = calculateCacheHitRatio(
    totals.inputTokens,
    totals.cacheRead
  );

  return {
    projectId,
    projectName,
    sessions: sessionUsages,
    totals,
  };
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format cost as USD
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(0)}%`;
}

/**
 * Export usage data as JSON
 */
export function exportUsageJSON(usage: ProjectUsage): string {
  return JSON.stringify(usage, null, 2);
}

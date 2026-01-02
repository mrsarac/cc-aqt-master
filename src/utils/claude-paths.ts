/**
 * Claude Code path utilities
 *
 * Cross-platform helpers for accessing ~/.claude/ directory structure
 */

import { homedir } from 'os';
import { join } from 'path';

/**
 * Get the Claude home directory path
 * Can be overridden with AQT_CLAUDE_HOME environment variable
 */
export function getClaudeHome(): string {
  return process.env.AQT_CLAUDE_HOME || join(homedir(), '.claude');
}

/**
 * Get the Claude projects directory path
 * Contains JSONL log files for each project
 */
export function getProjectsDir(): string {
  return join(getClaudeHome(), 'projects');
}

/**
 * Get the Claude config file path
 */
export function getConfigPath(): string {
  return join(getClaudeHome(), 'config');
}

/**
 * Get the settings.local.json path
 */
export function getLocalSettingsPath(): string {
  return join(getClaudeHome(), 'settings.local.json');
}

/**
 * Get project-specific log directory
 */
export function getProjectLogDir(projectPath: string): string {
  // Claude Code uses the absolute path as directory name
  const normalizedPath = projectPath.replace(/\//g, '-').replace(/^-/, '');
  return join(getProjectsDir(), normalizedPath);
}

/**
 * Get all possible JSONL log file patterns
 */
export function getLogFilePatterns(): string[] {
  return ['*.jsonl', '**/*.jsonl'];
}

/**
 * Check if a path looks like a Claude JSONL log
 */
export function isClaudeLogFile(filePath: string): boolean {
  return filePath.endsWith('.jsonl');
}

/**
 * Environment variable names used by AQT
 */
export const ENV_VARS = {
  CLAUDE_HOME: 'AQT_CLAUDE_HOME',
  LOG_LEVEL: 'AQT_LOG_LEVEL',
  SIEVE_MODEL: 'AQT_SIEVE_MODEL',
  NO_COLOR: 'AQT_NO_COLOR',
} as const;

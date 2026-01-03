/**
 * Claude Code Path Utilities
 *
 * Cross-platform helpers for accessing Claude Code directory structure
 * Supports: macOS, Linux (with XDG), Windows
 */

import { homedir, platform } from 'os';
import { join, basename } from 'path';
import {
  readdirSync,
  statSync,
  accessSync,
  constants,
} from 'fs';

/**
 * Supported platforms
 */
export type Platform = 'darwin' | 'linux' | 'win32';

/**
 * Claude installation status
 */
export interface ClaudeInstallStatus {
  installed: boolean;
  homeDir: string | null;
  projectsDir: string | null;
  configFile: string | null;
  error?: string;
}

/**
 * Project metadata
 */
export interface ProjectInfo {
  id: string;
  path: string;
  name: string;
  lastAccessed: Date;
  lastModified: Date;
  size: number;
  logFiles: string[];
  sessionCount: number;
}

/**
 * Project summary (lighter than full info)
 */
export interface ProjectSummary {
  id: string;
  name: string;
  lastModified: Date;
  logFileCount: number;
}

/**
 * Error types for path operations
 */
export class ClaudePathError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_INSTALLED' | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'INVALID_PATH',
    public readonly path?: string
  ) {
    super(message);
    this.name = 'ClaudePathError';
  }
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

/**
 * Get current platform
 */
export function getCurrentPlatform(): Platform {
  const p = platform();
  if (p === 'darwin' || p === 'linux' || p === 'win32') {
    return p;
  }
  // Default to linux for other unix-like systems
  return 'linux';
}

/**
 * Get the Claude home directory path based on platform
 *
 * - macOS: ~/.claude
 * - Linux: $XDG_CONFIG_HOME/claude or ~/.claude
 * - Windows: %APPDATA%\claude
 *
 * Can be overridden with AQT_CLAUDE_HOME environment variable
 */
export function getClaudeHome(customPath?: string): string {
  // Check for override
  if (customPath) {
    return customPath;
  }

  if (process.env[ENV_VARS.CLAUDE_HOME]) {
    return process.env[ENV_VARS.CLAUDE_HOME]!;
  }

  const p = getCurrentPlatform();

  switch (p) {
    case 'darwin':
      return join(homedir(), '.claude');

    case 'linux':
      // Check XDG_CONFIG_HOME first (Linux standard)
      if (process.env.XDG_CONFIG_HOME) {
        return join(process.env.XDG_CONFIG_HOME, 'claude');
      }
      // Fall back to ~/.claude
      return join(homedir(), '.claude');

    case 'win32':
      // Use APPDATA on Windows
      if (process.env.APPDATA) {
        return join(process.env.APPDATA, 'claude');
      }
      // Fallback to user profile
      return join(homedir(), '.claude');

    default:
      return join(homedir(), '.claude');
  }
}

/**
 * Get the Claude projects directory path
 */
export function getProjectsDir(claudeHome?: string): string {
  return join(claudeHome || getClaudeHome(), 'projects');
}

/**
 * Get the Claude config file path
 */
export function getConfigPath(claudeHome?: string): string {
  return join(claudeHome || getClaudeHome(), 'config');
}

/**
 * Get the settings.local.json path
 */
export function getLocalSettingsPath(claudeHome?: string): string {
  return join(claudeHome || getClaudeHome(), 'settings.local.json');
}

/**
 * Get credentials file path
 */
export function getCredentialsPath(claudeHome?: string): string {
  return join(claudeHome || getClaudeHome(), 'credentials.json');
}

/**
 * Check if a directory exists and is accessible
 */
export function directoryExists(path: string): boolean {
  try {
    const stat = statSync(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a file exists and is accessible
 */
export function fileExists(path: string): boolean {
  try {
    const stat = statSync(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if path is readable
 */
export function isReadable(path: string): boolean {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check Claude installation status
 */
export function checkClaudeInstallation(customHome?: string): ClaudeInstallStatus {
  const homeDir = getClaudeHome(customHome);

  if (!directoryExists(homeDir)) {
    return {
      installed: false,
      homeDir: null,
      projectsDir: null,
      configFile: null,
      error: `Claude home directory not found at: ${homeDir}`,
    };
  }

  if (!isReadable(homeDir)) {
    return {
      installed: false,
      homeDir,
      projectsDir: null,
      configFile: null,
      error: `Permission denied: Cannot read ${homeDir}`,
    };
  }

  const projectsDir = getProjectsDir(homeDir);
  const configFile = getConfigPath(homeDir);

  return {
    installed: true,
    homeDir,
    projectsDir: directoryExists(projectsDir) ? projectsDir : null,
    configFile: fileExists(configFile) ? configFile : null,
  };
}

/**
 * Validate Claude installation and throw if not found
 */
export function requireClaudeInstallation(customHome?: string): ClaudeInstallStatus {
  const status = checkClaudeInstallation(customHome);

  if (!status.installed) {
    throw new ClaudePathError(
      status.error || 'Claude Code is not installed',
      'NOT_INSTALLED',
      status.homeDir || undefined
    );
  }

  return status;
}

/**
 * Get directory size in bytes (recursive)
 */
function getDirectorySize(dirPath: string): number {
  let size = 0;

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isFile()) {
        size += statSync(fullPath).size;
      } else if (entry.isDirectory()) {
        size += getDirectorySize(fullPath);
      }
    }
  } catch {
    // Ignore permission errors
  }

  return size;
}

/**
 * Get JSONL log files in a directory
 */
function getLogFiles(dirPath: string): string[] {
  const logFiles: string[] = [];

  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        logFiles.push(fullPath);
      } else if (entry.isDirectory()) {
        logFiles.push(...getLogFiles(fullPath));
      }
    }
  } catch {
    // Ignore permission errors
  }

  return logFiles;
}

/**
 * Extract project name from directory name
 * Claude uses encoded paths as directory names
 */
function parseProjectName(dirName: string): string {
  // Claude encodes paths like: -Users-name-project becomes /Users/name/project
  if (dirName.startsWith('-')) {
    const decoded = '/' + dirName.slice(1).replace(/-/g, '/');
    return basename(decoded) || dirName;
  }
  return dirName;
}

/**
 * List all projects with summary info
 */
export function listProjects(customHome?: string): ProjectSummary[] {
  const projectsDir = getProjectsDir(customHome);

  if (!directoryExists(projectsDir)) {
    return [];
  }

  const projects: ProjectSummary[] = [];

  try {
    const entries = readdirSync(projectsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const projectPath = join(projectsDir, entry.name);
      const logFiles = getLogFiles(projectPath);

      try {
        const stat = statSync(projectPath);

        projects.push({
          id: entry.name,
          name: parseProjectName(entry.name),
          lastModified: stat.mtime,
          logFileCount: logFiles.length,
        });
      } catch {
        // Skip if we can't read stats
      }
    }
  } catch {
    // Return empty if we can't read the directory
  }

  // Sort by last modified (most recent first)
  return projects.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

/**
 * Get full project info
 */
export function getProjectInfo(projectId: string, customHome?: string): ProjectInfo | null {
  const projectsDir = getProjectsDir(customHome);
  const projectPath = join(projectsDir, projectId);

  if (!directoryExists(projectPath)) {
    return null;
  }

  try {
    const stat = statSync(projectPath);
    const logFiles = getLogFiles(projectPath);

    // Count unique sessions by parsing log file names
    const sessions = new Set<string>();
    for (const logFile of logFiles) {
      const name = basename(logFile, '.jsonl');
      sessions.add(name);
    }

    return {
      id: projectId,
      path: projectPath,
      name: parseProjectName(projectId),
      lastAccessed: stat.atime,
      lastModified: stat.mtime,
      size: getDirectorySize(projectPath),
      logFiles,
      sessionCount: sessions.size,
    };
  } catch {
    return null;
  }
}

/**
 * Get project logs directory
 */
export function getProjectLogDir(projectId: string, customHome?: string): string {
  return join(getProjectsDir(customHome), projectId);
}

/**
 * Get all JSONL files for a project
 */
export function getProjectLogFiles(projectId: string, customHome?: string): string[] {
  const projectDir = getProjectLogDir(projectId, customHome);

  if (!directoryExists(projectDir)) {
    return [];
  }

  return getLogFiles(projectDir);
}

/**
 * Find project by original path
 * Claude encodes the original project path as the directory name
 */
export function findProjectByPath(originalPath: string, customHome?: string): ProjectSummary | null {
  // Encode path the way Claude does
  const encoded = originalPath.replace(/\//g, '-').replace(/^-/, '-');

  const projects = listProjects(customHome);
  return projects.find(p => p.id === encoded) || null;
}

/**
 * Get most recent project
 */
export function getMostRecentProject(customHome?: string): ProjectSummary | null {
  const projects = listProjects(customHome);
  return projects.length > 0 ? projects[0] : null;
}

/**
 * Check if path looks like a Claude JSONL log
 */
export function isClaudeLogFile(filePath: string): boolean {
  return filePath.endsWith('.jsonl');
}

/**
 * Get all possible JSONL log file patterns
 */
export function getLogFilePatterns(): string[] {
  return ['*.jsonl', '**/*.jsonl'];
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * ClaudePaths class for OOP-style access
 */
export class ClaudePaths {
  private readonly _home: string;
  private readonly _status: ClaudeInstallStatus;

  constructor(customHome?: string) {
    this._home = getClaudeHome(customHome);
    this._status = checkClaudeInstallation(customHome);
  }

  /** Claude home directory */
  get home(): string {
    return this._home;
  }

  /** Projects directory */
  get projects(): string {
    return getProjectsDir(this._home);
  }

  /** Config file path */
  get config(): string {
    return getConfigPath(this._home);
  }

  /** Settings file path */
  get settings(): string {
    return getLocalSettingsPath(this._home);
  }

  /** Credentials file path */
  get credentials(): string {
    return getCredentialsPath(this._home);
  }

  /** Installation status */
  get status(): ClaudeInstallStatus {
    return this._status;
  }

  /** Check if Claude is installed */
  get isInstalled(): boolean {
    return this._status.installed;
  }

  /** List all projects */
  listProjects(): ProjectSummary[] {
    return listProjects(this._home);
  }

  /** Get project info */
  getProject(projectId: string): ProjectInfo | null {
    return getProjectInfo(projectId, this._home);
  }

  /** Get project log files */
  getProjectLogs(projectId: string): string[] {
    return getProjectLogFiles(projectId, this._home);
  }

  /** Get most recent project */
  getMostRecent(): ProjectSummary | null {
    return getMostRecentProject(this._home);
  }

  /** Find project by original path */
  findByPath(originalPath: string): ProjectSummary | null {
    return findProjectByPath(originalPath, this._home);
  }

  /** Require installation (throws if not installed) */
  requireInstallation(): void {
    if (!this._status.installed) {
      throw new ClaudePathError(
        this._status.error || 'Claude Code is not installed',
        'NOT_INSTALLED',
        this._home
      );
    }
  }
}

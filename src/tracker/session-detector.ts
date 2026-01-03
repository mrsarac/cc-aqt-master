/**
 * Session Detector
 *
 * Auto-detect current project and find Claude Code sessions
 */

import { execSync } from 'child_process';
import { basename } from 'path';
import {
  listProjects,
  getProjectLogFiles,
  findProjectByPath,
  type ProjectSummary,
} from '../utils/claude-paths.js';

/**
 * Session information
 */
export interface SessionInfo {
  id: string;
  logFile: string;
  timestamp: Date;
  projectId: string;
  projectName: string;
}

/**
 * Project detection result
 */
export interface DetectedProject {
  projectId: string;
  projectName: string;
  projectPath: string;
  logFiles: string[];
  sessions: SessionInfo[];
}

/**
 * Get git root directory from a path
 */
export function getGitRoot(fromPath?: string): string | null {
  try {
    const cwd = fromPath || process.cwd();
    const result = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch {
    return null;
  }
}

/**
 * Encode a path the way Claude Code does it
 * /Users/name/project -> -Users-name-project
 */
export function encodeProjectPath(path: string): string {
  return path.replace(/\//g, '-');
}

/**
 * Decode a Claude Code project ID to a path
 * -Users-name-project -> /Users/name/project
 */
export function decodeProjectPath(projectId: string): string {
  if (projectId.startsWith('-')) {
    return projectId.replace(/-/g, '/');
  }
  return projectId;
}

/**
 * Extract session ID and timestamp from log filename
 * Format: uuid.jsonl or timestamp-uuid.jsonl
 */
function parseLogFilename(filename: string): { id: string; timestamp: Date } {
  const name = basename(filename, '.jsonl');

  // Try to extract timestamp from the filename
  // Claude uses various formats, we'll try to detect them
  const timestampMatch = name.match(/^(\d{4}-\d{2}-\d{2}T[\d:.Z+-]+)/);

  if (timestampMatch) {
    return {
      id: name,
      timestamp: new Date(timestampMatch[1]),
    };
  }

  // If no timestamp in filename, use file modification time won't work here
  // Just use current date as fallback (we'll get real timestamp from log content)
  return {
    id: name,
    timestamp: new Date(),
  };
}

/**
 * Get sessions from log files
 */
function getSessions(projectId: string, logFiles: string[]): SessionInfo[] {
  const projectName = basename(decodeProjectPath(projectId));

  return logFiles.map(logFile => {
    const parsed = parseLogFilename(logFile);
    return {
      id: parsed.id,
      logFile,
      timestamp: parsed.timestamp,
      projectId,
      projectName,
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Auto-detect current project from git root
 */
export function detectCurrentProject(customHome?: string): DetectedProject | null {
  const gitRoot = getGitRoot();

  if (!gitRoot) {
    return null;
  }

  // Find project by path
  const project = findProjectByPath(gitRoot, customHome);

  if (!project) {
    // Project not found in Claude Code logs
    return null;
  }

  const logFiles = getProjectLogFiles(project.id, customHome);
  const sessions = getSessions(project.id, logFiles);

  return {
    projectId: project.id,
    projectName: project.name,
    projectPath: gitRoot,
    logFiles,
    sessions,
  };
}

/**
 * Find project by ID or path
 */
export function findProject(
  idOrPath: string,
  customHome?: string
): DetectedProject | null {
  const projects = listProjects(customHome);

  // First try exact ID match
  let project = projects.find(p => p.id === idOrPath);

  // If not found, try to match by path
  if (!project) {
    const encodedPath = encodeProjectPath(idOrPath);
    project = projects.find(p => p.id === encodedPath);
  }

  // If still not found, try partial name match
  if (!project) {
    project = projects.find(p =>
      p.name.toLowerCase().includes(idOrPath.toLowerCase())
    );
  }

  if (!project) {
    return null;
  }

  const logFiles = getProjectLogFiles(project.id, customHome);
  const sessions = getSessions(project.id, logFiles);

  return {
    projectId: project.id,
    projectName: project.name,
    projectPath: decodeProjectPath(project.id),
    logFiles,
    sessions,
  };
}

/**
 * List all available projects
 */
export function listAvailableProjects(customHome?: string): ProjectSummary[] {
  return listProjects(customHome);
}

/**
 * Get recent sessions across all projects
 */
export function getRecentSessions(
  limit: number = 10,
  customHome?: string
): SessionInfo[] {
  const projects = listProjects(customHome);
  const allSessions: SessionInfo[] = [];

  for (const project of projects) {
    const logFiles = getProjectLogFiles(project.id, customHome);
    const sessions = getSessions(project.id, logFiles);
    allSessions.push(...sessions);
  }

  // Sort by timestamp and return limit
  return allSessions
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

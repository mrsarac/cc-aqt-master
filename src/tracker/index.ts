/**
 * Tracker Module
 *
 * Token usage tracking and session analysis
 */

// Session detection
export {
  getGitRoot,
  encodeProjectPath,
  decodeProjectPath,
  detectCurrentProject,
  findProject,
  listAvailableProjects,
  getRecentSessions,
  type SessionInfo,
  type DetectedProject,
} from './session-detector.js';

// Token analysis
export {
  calculateCost,
  calculateCacheHitRatio,
  formatSessionLabel,
  analyzeLogFile,
  analyzeSessions,
  analyzeProject,
  formatNumber,
  formatCost,
  formatPercent,
  exportUsageJSON,
  type SessionUsage,
  type ProjectUsage,
} from './token-analyzer.js';

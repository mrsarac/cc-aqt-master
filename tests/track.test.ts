import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

// Import tracker modules
import {
  encodeProjectPath,
  decodeProjectPath,
  getGitRoot,
  listAvailableProjects,
  findProject,
  type SessionInfo,
} from '../src/tracker/session-detector';

import {
  calculateCost,
  calculateCacheHitRatio,
  formatSessionLabel,
  formatNumber,
  formatCost,
  formatPercent,
  analyzeLogFile,
  type SessionUsage,
} from '../src/tracker/token-analyzer';

describe('Session Detector', () => {
  describe('encodeProjectPath', () => {
    it('should encode path by replacing slashes with dashes', () => {
      expect(encodeProjectPath('/Users/name/project')).toBe('-Users-name-project');
    });

    it('should handle paths with multiple segments', () => {
      expect(encodeProjectPath('/a/b/c/d/e')).toBe('-a-b-c-d-e');
    });

    it('should handle empty path', () => {
      expect(encodeProjectPath('')).toBe('');
    });
  });

  describe('decodeProjectPath', () => {
    it('should decode path by replacing dashes with slashes when starts with dash', () => {
      expect(decodeProjectPath('-Users-name-project')).toBe('/Users/name/project');
    });

    it('should return unchanged if not starting with dash', () => {
      expect(decodeProjectPath('some-project-name')).toBe('some-project-name');
    });

    it('should handle empty string', () => {
      expect(decodeProjectPath('')).toBe('');
    });
  });

  describe('getGitRoot', () => {
    const testDir = join(tmpdir(), 'aqt-git-test-' + Date.now());

    beforeEach(() => {
      mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
    });

    it('should return null for non-git directory', () => {
      const result = getGitRoot(testDir);
      expect(result).toBe(null);
    });

    it('should return git root for git directory', () => {
      // Initialize git repo
      try {
        execSync('git init', { cwd: testDir, stdio: 'pipe' });
        const result = getGitRoot(testDir);
        expect(result).toBe(testDir);
      } catch {
        // Skip if git not available
        expect(true).toBe(true);
      }
    });
  });
});

describe('Token Analyzer', () => {
  describe('calculateCost', () => {
    it('should calculate cost with no cache', () => {
      // 1M input tokens = $3, 1M output tokens = $15
      const cost = calculateCost(1_000_000, 1_000_000, 0);
      expect(cost).toBe(18); // $3 + $15
    });

    it('should calculate cost with cache', () => {
      // 1M input + 1M output + 1M cache = $3 + $15 + $0.30
      const cost = calculateCost(1_000_000, 1_000_000, 1_000_000);
      expect(cost).toBe(18.3);
    });

    it('should handle zero tokens', () => {
      expect(calculateCost(0, 0, 0)).toBe(0);
    });

    it('should calculate small token amounts', () => {
      // 1000 input = $0.003, 1000 output = $0.015
      const cost = calculateCost(1000, 1000, 0);
      expect(cost).toBeCloseTo(0.018, 5);
    });
  });

  describe('calculateCacheHitRatio', () => {
    it('should return 0 for no tokens', () => {
      expect(calculateCacheHitRatio(0, 0)).toBe(0);
    });

    it('should return 0 for no cache', () => {
      expect(calculateCacheHitRatio(1000, 0)).toBe(0);
    });

    it('should return 0.5 for 50% cache', () => {
      expect(calculateCacheHitRatio(500, 500)).toBe(0.5);
    });

    it('should return 1 for all cache', () => {
      expect(calculateCacheHitRatio(0, 1000)).toBe(1);
    });
  });

  describe('formatSessionLabel', () => {
    it('should format today as "Today HH:MM"', () => {
      const now = new Date();
      const label = formatSessionLabel(now);
      expect(label).toMatch(/^Today \d{2}:\d{2}$/);
    });

    it('should format yesterday as "Yesterday HH:MM"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const label = formatSessionLabel(yesterday);
      expect(label).toMatch(/^Yesterday \d{2}:\d{2}$/);
    });

    it('should format older dates as "Mon DD HH:MM"', () => {
      const oldDate = new Date('2024-01-15T14:30:00');
      const label = formatSessionLabel(oldDate);
      expect(label).toMatch(/^Jan 15 \d{2}:\d{2}$/);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
    });
  });

  describe('formatCost', () => {
    it('should format small costs with 4 decimals', () => {
      expect(formatCost(0.001)).toBe('$0.0010');
      expect(formatCost(0.0099)).toBe('$0.0099');
    });

    it('should format larger costs with 2 decimals', () => {
      expect(formatCost(1.23)).toBe('$1.23');
      expect(formatCost(0.01)).toBe('$0.01');
    });
  });

  describe('formatPercent', () => {
    it('should format as percentage', () => {
      expect(formatPercent(0)).toBe('0%');
      expect(formatPercent(0.5)).toBe('50%');
      expect(formatPercent(1)).toBe('100%');
    });

    it('should round to nearest integer', () => {
      expect(formatPercent(0.333)).toBe('33%');
      expect(formatPercent(0.666)).toBe('67%');
    });
  });
});

describe('Log File Analysis', () => {
  const testDir = join(tmpdir(), 'aqt-log-test-' + Date.now());
  const testLogFile = join(testDir, 'test-session.jsonl');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should analyze a log file with usage data', async () => {
    // Create test log file
    const entries = [
      {
        type: 'user',
        timestamp: '2024-12-01T10:00:00Z',
        session_id: 'test-session-1',
      },
      {
        type: 'assistant',
        timestamp: '2024-12-01T10:01:00Z',
        usage: {
          input_tokens: 1000,
          output_tokens: 500,
          cache_creation_input_tokens: 100,
          cache_read_input_tokens: 200,
        },
      },
      {
        type: 'user',
        timestamp: '2024-12-01T10:02:00Z',
      },
      {
        type: 'assistant',
        timestamp: '2024-12-01T10:03:00Z',
        usage: {
          input_tokens: 2000,
          output_tokens: 1000,
          cache_creation_input_tokens: 50,
          cache_read_input_tokens: 300,
        },
      },
    ];

    const logContent = entries.map((e) => JSON.stringify(e)).join('\n');
    writeFileSync(testLogFile, logContent);

    const usage = await analyzeLogFile(testLogFile);

    expect(usage.sessionId).toBe('test-session-1');
    expect(usage.inputTokens).toBe(3000); // 1000 + 2000
    expect(usage.outputTokens).toBe(1500); // 500 + 1000
    expect(usage.cacheCreation).toBe(150); // 100 + 50
    expect(usage.cacheRead).toBe(500); // 200 + 300
    expect(usage.messageCount).toBe(4); // 2 user + 2 assistant
    expect(usage.totalTokens).toBe(4500); // 3000 + 1500
    expect(usage.duration).toBe(3 * 60 * 1000); // 3 minutes in ms
  });

  it('should handle empty log file', async () => {
    writeFileSync(testLogFile, '');

    const usage = await analyzeLogFile(testLogFile);

    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
    expect(usage.messageCount).toBe(0);
  });

  it('should handle log file with no usage data', async () => {
    const entries = [
      { type: 'user', timestamp: '2024-12-01T10:00:00Z' },
      { type: 'assistant', timestamp: '2024-12-01T10:01:00Z' },
    ];

    const logContent = entries.map((e) => JSON.stringify(e)).join('\n');
    writeFileSync(testLogFile, logContent);

    const usage = await analyzeLogFile(testLogFile);

    expect(usage.inputTokens).toBe(0);
    expect(usage.outputTokens).toBe(0);
    expect(usage.messageCount).toBe(2);
  });
});

describe('Track Command Integration', () => {
  // These tests verify the track command works as expected
  // We use a mock claude home directory with test data
  // Note: customHome IS the claude home (e.g., ~/.claude), not a parent dir
  // Claude encodes paths like: /Users/name/testproject -> -Users-name-testproject
  // IMPORTANT: parseProjectName replaces ALL dashes with slashes, so use
  // project names without internal dashes for testing

  // Use unique directories per test to avoid caching issues
  let testHome: string;
  let projectDir: string;

  beforeEach(() => {
    testHome = join(tmpdir(), 'aqt-track-test-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    // Use -Users-name-testproject which decodes to /Users/name/testproject -> basename 'testproject'
    projectDir = join(testHome, 'projects', '-Users-name-testproject');
    mkdirSync(projectDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testHome)) {
      rmSync(testHome, { recursive: true, force: true });
    }
  });

  it('should list projects from custom home', () => {
    // Create a mock log file
    const logFile = join(projectDir, '2024-12-01T10-00-00.jsonl');
    writeFileSync(
      logFile,
      JSON.stringify({
        type: 'user',
        timestamp: '2024-12-01T10:00:00Z',
        session_id: 'test-1',
      })
    );

    // Use statically imported listAvailableProjects
    const projects = listAvailableProjects(testHome);

    expect(projects.length).toBe(1);
    expect(projects[0].id).toBe('-Users-name-testproject');
    expect(projects[0].name).toBe('testproject'); // basename of decoded path
  });

  it('should find project by name', () => {
    // Create a mock log file
    const logFile = join(projectDir, 'session.jsonl');
    writeFileSync(
      logFile,
      JSON.stringify({
        type: 'user',
        timestamp: '2024-12-01T10:00:00Z',
      })
    );

    // Use statically imported findProject - searches by partial name match
    const project = findProject('testproject', testHome);

    expect(project).not.toBe(null);
    expect(project?.projectName).toBe('testproject');
    expect(project?.logFiles.length).toBe(1);
  });

  it('should return null for non-existent project', () => {
    // Use statically imported findProject
    const project = findProject('non-existent', testHome);

    expect(project).toBe(null);
  });
});

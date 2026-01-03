import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';
import {
  getClaudeHome,
  getProjectsDir,
  getConfigPath,
  getLocalSettingsPath,
  getCredentialsPath,
  getCurrentPlatform,
  directoryExists,
  fileExists,
  isReadable,
  checkClaudeInstallation,
  requireClaudeInstallation,
  listProjects,
  getProjectInfo,
  getProjectLogDir,
  getProjectLogFiles,
  findProjectByPath,
  getMostRecentProject,
  isClaudeLogFile,
  getLogFilePatterns,
  formatBytes,
  ClaudePaths,
  ClaudePathError,
  ENV_VARS,
} from '../src/utils/claude-paths';

describe('Claude Paths', () => {
  const testDir = join(tmpdir(), 'aqt-claude-paths-test-' + Date.now());
  const mockClaudeHome = join(testDir, '.claude');

  beforeEach(() => {
    // Create mock Claude directory structure
    mkdirSync(mockClaudeHome, { recursive: true });
    mkdirSync(join(mockClaudeHome, 'projects'), { recursive: true });

    // Create mock config file
    writeFileSync(join(mockClaudeHome, 'config'), '{}');
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    // Clean up env vars
    delete process.env[ENV_VARS.CLAUDE_HOME];
    delete process.env.XDG_CONFIG_HOME;
  });

  describe('getCurrentPlatform', () => {
    it('should return current platform', () => {
      const platform = getCurrentPlatform();
      expect(['darwin', 'linux', 'win32']).toContain(platform);
    });
  });

  describe('getClaudeHome', () => {
    it('should return custom path when provided', () => {
      const customPath = '/custom/claude/path';
      expect(getClaudeHome(customPath)).toBe(customPath);
    });

    it('should respect AQT_CLAUDE_HOME environment variable', () => {
      const envPath = '/env/claude/path';
      process.env[ENV_VARS.CLAUDE_HOME] = envPath;

      expect(getClaudeHome()).toBe(envPath);
    });

    it('should return default path when no override', () => {
      const home = getClaudeHome();
      expect(home).toContain('.claude');
    });

    it('should use XDG_CONFIG_HOME on Linux when set', () => {
      // This test is platform-dependent
      if (getCurrentPlatform() === 'linux') {
        process.env.XDG_CONFIG_HOME = '/custom/xdg';
        const home = getClaudeHome();
        expect(home).toBe('/custom/xdg/claude');
      }
    });
  });

  describe('Path getters', () => {
    it('should return correct projects directory', () => {
      const projectsDir = getProjectsDir(mockClaudeHome);
      expect(projectsDir).toBe(join(mockClaudeHome, 'projects'));
    });

    it('should return correct config path', () => {
      const configPath = getConfigPath(mockClaudeHome);
      expect(configPath).toBe(join(mockClaudeHome, 'config'));
    });

    it('should return correct settings path', () => {
      const settingsPath = getLocalSettingsPath(mockClaudeHome);
      expect(settingsPath).toBe(join(mockClaudeHome, 'settings.local.json'));
    });

    it('should return correct credentials path', () => {
      const credentialsPath = getCredentialsPath(mockClaudeHome);
      expect(credentialsPath).toBe(join(mockClaudeHome, 'credentials.json'));
    });
  });

  describe('Filesystem checks', () => {
    it('directoryExists should return true for existing directory', () => {
      expect(directoryExists(mockClaudeHome)).toBe(true);
    });

    it('directoryExists should return false for non-existing directory', () => {
      expect(directoryExists('/nonexistent/path')).toBe(false);
    });

    it('directoryExists should return false for file', () => {
      const filePath = join(mockClaudeHome, 'config');
      expect(directoryExists(filePath)).toBe(false);
    });

    it('fileExists should return true for existing file', () => {
      const filePath = join(mockClaudeHome, 'config');
      expect(fileExists(filePath)).toBe(true);
    });

    it('fileExists should return false for non-existing file', () => {
      expect(fileExists('/nonexistent/file')).toBe(false);
    });

    it('fileExists should return false for directory', () => {
      expect(fileExists(mockClaudeHome)).toBe(false);
    });

    it('isReadable should return true for readable path', () => {
      expect(isReadable(mockClaudeHome)).toBe(true);
    });

    it('isReadable should return false for non-existing path', () => {
      expect(isReadable('/nonexistent/path')).toBe(false);
    });
  });

  describe('checkClaudeInstallation', () => {
    it('should detect installed Claude', () => {
      const status = checkClaudeInstallation(mockClaudeHome);

      expect(status.installed).toBe(true);
      expect(status.homeDir).toBe(mockClaudeHome);
      expect(status.projectsDir).toBe(join(mockClaudeHome, 'projects'));
      expect(status.configFile).toBe(join(mockClaudeHome, 'config'));
    });

    it('should detect when Claude is not installed', () => {
      const status = checkClaudeInstallation('/nonexistent/path');

      expect(status.installed).toBe(false);
      expect(status.homeDir).toBe(null);
      expect(status.error).toContain('not found');
    });

    it('should handle missing projects directory', () => {
      const noProjectsDir = join(testDir, 'no-projects');
      mkdirSync(noProjectsDir, { recursive: true });
      writeFileSync(join(noProjectsDir, 'config'), '{}');

      const status = checkClaudeInstallation(noProjectsDir);

      expect(status.installed).toBe(true);
      expect(status.projectsDir).toBe(null);
    });

    it('should handle missing config file', () => {
      const noConfigDir = join(testDir, 'no-config');
      mkdirSync(join(noConfigDir, 'projects'), { recursive: true });

      const status = checkClaudeInstallation(noConfigDir);

      expect(status.installed).toBe(true);
      expect(status.configFile).toBe(null);
    });
  });

  describe('requireClaudeInstallation', () => {
    it('should return status when installed', () => {
      const status = requireClaudeInstallation(mockClaudeHome);
      expect(status.installed).toBe(true);
    });

    it('should throw ClaudePathError when not installed', () => {
      expect(() => requireClaudeInstallation('/nonexistent/path')).toThrow(
        ClaudePathError
      );
    });

    it('should include error code in exception', () => {
      try {
        requireClaudeInstallation('/nonexistent/path');
      } catch (error) {
        expect(error).toBeInstanceOf(ClaudePathError);
        expect((error as ClaudePathError).code).toBe('NOT_INSTALLED');
      }
    });
  });

  describe('Project listing', () => {
    beforeEach(() => {
      // Create mock projects
      const projectsDir = join(mockClaudeHome, 'projects');

      // Project 1: -Users-test-project1
      const project1 = join(projectsDir, '-Users-test-project1');
      mkdirSync(project1, { recursive: true });
      writeFileSync(join(project1, 'session1.jsonl'), '{"type":"user"}');
      writeFileSync(join(project1, 'session2.jsonl'), '{"type":"user"}');

      // Project 2: -Users-test-project2
      const project2 = join(projectsDir, '-Users-test-project2');
      mkdirSync(project2, { recursive: true });
      writeFileSync(join(project2, 'session1.jsonl'), '{"type":"user"}');
    });

    it('should list all projects', () => {
      const projects = listProjects(mockClaudeHome);

      expect(projects).toHaveLength(2);
      expect(projects.map(p => p.id)).toContain('-Users-test-project1');
      expect(projects.map(p => p.id)).toContain('-Users-test-project2');
    });

    it('should parse project names from encoded paths', () => {
      const projects = listProjects(mockClaudeHome);
      const project = projects.find(p => p.id === '-Users-test-project1');

      expect(project?.name).toBe('project1');
    });

    it('should count log files', () => {
      const projects = listProjects(mockClaudeHome);
      const project1 = projects.find(p => p.id === '-Users-test-project1');
      const project2 = projects.find(p => p.id === '-Users-test-project2');

      expect(project1?.logFileCount).toBe(2);
      expect(project2?.logFileCount).toBe(1);
    });

    it('should sort by last modified (most recent first)', () => {
      const projects = listProjects(mockClaudeHome);

      for (let i = 1; i < projects.length; i++) {
        expect(projects[i - 1].lastModified.getTime()).toBeGreaterThanOrEqual(
          projects[i].lastModified.getTime()
        );
      }
    });

    it('should return empty array when projects directory does not exist', () => {
      const noProjectsDir = join(testDir, 'empty-claude');
      mkdirSync(noProjectsDir, { recursive: true });

      const projects = listProjects(noProjectsDir);
      expect(projects).toHaveLength(0);
    });
  });

  describe('getProjectInfo', () => {
    beforeEach(() => {
      const projectsDir = join(mockClaudeHome, 'projects');
      const project = join(projectsDir, '-Users-test-myproject');
      mkdirSync(project, { recursive: true });
      writeFileSync(join(project, 'session1.jsonl'), '{"type":"user"}');
      writeFileSync(join(project, 'session2.jsonl'), '{"type":"user"}');
    });

    it('should return full project info', () => {
      const info = getProjectInfo('-Users-test-myproject', mockClaudeHome);

      expect(info).not.toBeNull();
      expect(info?.id).toBe('-Users-test-myproject');
      expect(info?.name).toBe('myproject');
      expect(info?.logFiles).toHaveLength(2);
      expect(info?.sessionCount).toBe(2);
      expect(info?.size).toBeGreaterThan(0);
    });

    it('should return null for non-existent project', () => {
      const info = getProjectInfo('nonexistent', mockClaudeHome);
      expect(info).toBeNull();
    });
  });

  describe('getProjectLogDir', () => {
    it('should return correct log directory path', () => {
      const logDir = getProjectLogDir('my-project', mockClaudeHome);
      expect(logDir).toBe(join(mockClaudeHome, 'projects', 'my-project'));
    });
  });

  describe('getProjectLogFiles', () => {
    beforeEach(() => {
      const projectsDir = join(mockClaudeHome, 'projects');
      const project = join(projectsDir, 'test-project');
      mkdirSync(project, { recursive: true });
      writeFileSync(join(project, 'log1.jsonl'), '{}');
      writeFileSync(join(project, 'log2.jsonl'), '{}');
      writeFileSync(join(project, 'other.txt'), 'not a log');
    });

    it('should return only JSONL files', () => {
      const files = getProjectLogFiles('test-project', mockClaudeHome);

      expect(files).toHaveLength(2);
      expect(files.every(f => f.endsWith('.jsonl'))).toBe(true);
    });

    it('should return empty array for non-existent project', () => {
      const files = getProjectLogFiles('nonexistent', mockClaudeHome);
      expect(files).toHaveLength(0);
    });
  });

  describe('getMostRecentProject', () => {
    beforeEach(() => {
      const projectsDir = join(mockClaudeHome, 'projects');
      mkdirSync(join(projectsDir, 'project1'), { recursive: true });
      mkdirSync(join(projectsDir, 'project2'), { recursive: true });
    });

    it('should return most recent project', () => {
      const recent = getMostRecentProject(mockClaudeHome);
      expect(recent).not.toBeNull();
    });

    it('should return null when no projects exist', () => {
      const emptyClaudeHome = join(testDir, 'empty');
      mkdirSync(join(emptyClaudeHome, 'projects'), { recursive: true });

      const recent = getMostRecentProject(emptyClaudeHome);
      expect(recent).toBeNull();
    });
  });

  describe('Utility functions', () => {
    describe('isClaudeLogFile', () => {
      it('should detect JSONL files', () => {
        expect(isClaudeLogFile('session.jsonl')).toBe(true);
        expect(isClaudeLogFile('/path/to/file.jsonl')).toBe(true);
      });

      it('should reject non-JSONL files', () => {
        expect(isClaudeLogFile('file.json')).toBe(false);
        expect(isClaudeLogFile('file.txt')).toBe(false);
        expect(isClaudeLogFile('file.jsonl.bak')).toBe(false);
      });
    });

    describe('getLogFilePatterns', () => {
      it('should return glob patterns', () => {
        const patterns = getLogFilePatterns();
        expect(patterns).toContain('*.jsonl');
        expect(patterns).toContain('**/*.jsonl');
      });
    });

    describe('formatBytes', () => {
      it('should format bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(500)).toBe('500.0 B');
        expect(formatBytes(1024)).toBe('1.0 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(1048576)).toBe('1.0 MB');
        expect(formatBytes(1073741824)).toBe('1.0 GB');
      });
    });
  });

  describe('ClaudePaths class', () => {
    it('should provide OOP-style access', () => {
      const paths = new ClaudePaths(mockClaudeHome);

      expect(paths.home).toBe(mockClaudeHome);
      expect(paths.projects).toBe(join(mockClaudeHome, 'projects'));
      expect(paths.config).toBe(join(mockClaudeHome, 'config'));
      expect(paths.isInstalled).toBe(true);
    });

    it('should list projects via class method', () => {
      // Create a project
      const projectsDir = join(mockClaudeHome, 'projects');
      mkdirSync(join(projectsDir, 'test-project'), { recursive: true });

      const paths = new ClaudePaths(mockClaudeHome);
      const projects = paths.listProjects();

      expect(projects).toHaveLength(1);
    });

    it('should get project info via class method', () => {
      // Create a project
      const projectsDir = join(mockClaudeHome, 'projects');
      const project = join(projectsDir, 'test-project');
      mkdirSync(project, { recursive: true });
      writeFileSync(join(project, 'log.jsonl'), '{}');

      const paths = new ClaudePaths(mockClaudeHome);
      const info = paths.getProject('test-project');

      expect(info).not.toBeNull();
      expect(info?.id).toBe('test-project');
    });

    it('should get project logs via class method', () => {
      // Create a project with logs
      const projectsDir = join(mockClaudeHome, 'projects');
      const project = join(projectsDir, 'test-project');
      mkdirSync(project, { recursive: true });
      writeFileSync(join(project, 'log.jsonl'), '{}');

      const paths = new ClaudePaths(mockClaudeHome);
      const logs = paths.getProjectLogs('test-project');

      expect(logs).toHaveLength(1);
    });

    it('should throw on requireInstallation when not installed', () => {
      const paths = new ClaudePaths('/nonexistent/path');

      expect(() => paths.requireInstallation()).toThrow(ClaudePathError);
    });

    it('should report installation status', () => {
      const paths = new ClaudePaths(mockClaudeHome);

      expect(paths.status.installed).toBe(true);
      expect(paths.status.homeDir).toBe(mockClaudeHome);
    });
  });

  describe('ClaudePathError', () => {
    it('should have correct properties', () => {
      const error = new ClaudePathError('Test error', 'NOT_INSTALLED', '/path');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('NOT_INSTALLED');
      expect(error.path).toBe('/path');
      expect(error.name).toBe('ClaudePathError');
    });

    it('should be instanceof Error', () => {
      const error = new ClaudePathError('Test', 'NOT_FOUND');
      expect(error).toBeInstanceOf(Error);
    });
  });
});

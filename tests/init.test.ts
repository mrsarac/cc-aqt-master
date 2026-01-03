import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Mock @inquirer/prompts before importing the module
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  confirm: vi.fn(),
  select: vi.fn(),
}));

import { input, confirm, select } from '@inquirer/prompts';
import {
  initCommand,
  CONFIG_FILENAME,
  AGENTS_FILENAME,
  DEFAULT_AGENTS,
} from '../src/commands/init';

describe('Init Command', () => {
  const testDir = join(tmpdir(), 'aqt-init-test-' + Date.now());

  beforeEach(() => {
    // Create test directory
    mkdirSync(testDir, { recursive: true });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Non-interactive mode (--yes)', () => {
    it('should create config file with defaults', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      expect(result.configPath).toBe(join(testDir, CONFIG_FILENAME));
      expect(existsSync(result.configPath)).toBe(true);

      const config = JSON.parse(readFileSync(result.configPath, 'utf-8'));
      expect(config.autoSieve).toBe(true);
      expect(config.logLevel).toBe('info');
      expect(config.defaultAgent).toBe('master-architect');
    });

    it('should create agents file in yes mode', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      expect(result.agentsPath).toBe(join(testDir, AGENTS_FILENAME));
      expect(existsSync(result.agentsPath!)).toBe(true);

      const agents = JSON.parse(readFileSync(result.agentsPath!, 'utf-8'));
      expect(agents).toEqual(DEFAULT_AGENTS);
    });

    it('should add config to gitignore in yes mode', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      expect(result.addedToGitignore).toBe(true);
      const gitignore = readFileSync(join(testDir, '.gitignore'), 'utf-8');
      expect(gitignore).toContain(CONFIG_FILENAME);
    });

    it('should fail if config exists without force flag', async () => {
      // Create existing config
      writeFileSync(join(testDir, CONFIG_FILENAME), '{}');

      await expect(initCommand({ yes: true, targetDir: testDir })).rejects.toThrow(
        'Config already exists'
      );
    });

    it('should overwrite config with force flag', async () => {
      // Create existing config
      writeFileSync(join(testDir, CONFIG_FILENAME), '{"old": true}');

      const result = await initCommand({ yes: true, force: true, targetDir: testDir });

      const config = JSON.parse(readFileSync(result.configPath, 'utf-8'));
      expect(config.old).toBeUndefined();
      expect(config.autoSieve).toBe(true);
    });
  });

  describe('Interactive mode', () => {
    it('should use prompted values for config', async () => {
      // Mock all prompts
      vi.mocked(confirm).mockResolvedValueOnce(false); // autoSieve = false
      vi.mocked(select).mockResolvedValueOnce('debug'); // logLevel = debug
      vi.mocked(input).mockResolvedValueOnce('custom-agent'); // defaultAgent
      vi.mocked(input).mockResolvedValueOnce('25000'); // sessionWarning
      vi.mocked(input).mockResolvedValueOnce('75000'); // sessionCritical
      vi.mocked(confirm).mockResolvedValueOnce(true); // create agents file
      vi.mocked(confirm).mockResolvedValueOnce(true); // add to gitignore

      const result = await initCommand({ targetDir: testDir });

      const config = JSON.parse(readFileSync(result.configPath, 'utf-8'));
      expect(config.autoSieve).toBe(false);
      expect(config.logLevel).toBe('debug');
      expect(config.defaultAgent).toBe('custom-agent');
      expect(config.tokenAlerts.sessionWarning).toBe(25000);
      expect(config.tokenAlerts.sessionCritical).toBe(75000);
    });

    it('should ask before overwriting existing config', async () => {
      // Create existing config
      writeFileSync(join(testDir, CONFIG_FILENAME), '{}');

      // Mock prompts - decline overwrite
      vi.mocked(confirm).mockResolvedValueOnce(false);

      await expect(initCommand({ targetDir: testDir })).rejects.toThrow('cancelled by user');
    });

    it('should allow overwriting when user confirms', async () => {
      // Create existing config
      writeFileSync(join(testDir, CONFIG_FILENAME), '{}');

      // Mock prompts - accept overwrite, then fill in config
      vi.mocked(confirm).mockResolvedValueOnce(true); // overwrite
      vi.mocked(confirm).mockResolvedValueOnce(true); // autoSieve
      vi.mocked(select).mockResolvedValueOnce('info');
      vi.mocked(input).mockResolvedValueOnce('default');
      vi.mocked(input).mockResolvedValueOnce('50000');
      vi.mocked(input).mockResolvedValueOnce('100000');
      vi.mocked(confirm).mockResolvedValueOnce(true); // create agents
      vi.mocked(confirm).mockResolvedValueOnce(true); // gitignore

      const result = await initCommand({ targetDir: testDir });
      expect(existsSync(result.configPath)).toBe(true);
    });

    it('should skip agents file creation when user declines', async () => {
      vi.mocked(confirm).mockResolvedValueOnce(true); // autoSieve
      vi.mocked(select).mockResolvedValueOnce('info');
      vi.mocked(input).mockResolvedValueOnce('default');
      vi.mocked(input).mockResolvedValueOnce('50000');
      vi.mocked(input).mockResolvedValueOnce('100000');
      vi.mocked(confirm).mockResolvedValueOnce(false); // don't create agents
      vi.mocked(confirm).mockResolvedValueOnce(true); // gitignore

      const result = await initCommand({ targetDir: testDir });

      expect(result.agentsPath).toBeNull();
      expect(existsSync(join(testDir, AGENTS_FILENAME))).toBe(false);
    });

    it('should skip gitignore when user declines', async () => {
      vi.mocked(confirm).mockResolvedValueOnce(true);
      vi.mocked(select).mockResolvedValueOnce('info');
      vi.mocked(input).mockResolvedValueOnce('default');
      vi.mocked(input).mockResolvedValueOnce('50000');
      vi.mocked(input).mockResolvedValueOnce('100000');
      vi.mocked(confirm).mockResolvedValueOnce(true); // create agents
      vi.mocked(confirm).mockResolvedValueOnce(false); // don't add to gitignore

      const result = await initCommand({ targetDir: testDir });

      expect(result.addedToGitignore).toBe(false);
    });
  });

  describe('Gitignore handling', () => {
    it('should create .gitignore if it does not exist', async () => {
      await initCommand({ yes: true, targetDir: testDir });

      expect(existsSync(join(testDir, '.gitignore'))).toBe(true);
    });

    it('should append to existing .gitignore', async () => {
      writeFileSync(join(testDir, '.gitignore'), 'node_modules/\n');

      await initCommand({ yes: true, targetDir: testDir });

      const gitignore = readFileSync(join(testDir, '.gitignore'), 'utf-8');
      expect(gitignore).toContain('node_modules/');
      expect(gitignore).toContain(CONFIG_FILENAME);
    });

    it('should not duplicate entry if already in gitignore', async () => {
      writeFileSync(join(testDir, '.gitignore'), `${CONFIG_FILENAME}\n`);

      const result = await initCommand({ yes: true, targetDir: testDir });

      expect(result.addedToGitignore).toBe(false);
      const gitignore = readFileSync(join(testDir, '.gitignore'), 'utf-8');
      const matches = gitignore.match(new RegExp(CONFIG_FILENAME, 'g'));
      expect(matches?.length).toBe(1);
    });
  });

  describe('Config validation', () => {
    it('should create valid config structure', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      const config = JSON.parse(readFileSync(result.configPath, 'utf-8'));
      expect(config).toHaveProperty('autoSieve');
      expect(config).toHaveProperty('logLevel');
      expect(config).toHaveProperty('defaultAgent');
      expect(config).toHaveProperty('tokenAlerts');
      expect(config.tokenAlerts).toHaveProperty('sessionWarning');
      expect(config.tokenAlerts).toHaveProperty('sessionCritical');
    });

    it('should validate token thresholds are numbers', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      const config = JSON.parse(readFileSync(result.configPath, 'utf-8'));
      expect(typeof config.tokenAlerts.sessionWarning).toBe('number');
      expect(typeof config.tokenAlerts.sessionCritical).toBe('number');
    });
  });

  describe('Result object', () => {
    it('should return correct result structure', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      expect(result).toHaveProperty('configPath');
      expect(result).toHaveProperty('agentsPath');
      expect(result).toHaveProperty('addedToGitignore');
      expect(result).toHaveProperty('config');
    });

    it('should return the created config object', async () => {
      const result = await initCommand({ yes: true, targetDir: testDir });

      expect(result.config.autoSieve).toBe(true);
      expect(result.config.logLevel).toBe('info');
      expect(result.config.defaultAgent).toBe('master-architect');
    });
  });

  describe('Edge cases', () => {
    it('should handle directory with special characters', async () => {
      const specialDir = join(testDir, 'project with spaces');
      mkdirSync(specialDir, { recursive: true });

      const result = await initCommand({ yes: true, targetDir: specialDir });

      expect(existsSync(result.configPath)).toBe(true);
    });

    it('should not recreate agents file if it already exists', async () => {
      writeFileSync(
        join(testDir, AGENTS_FILENAME),
        JSON.stringify({ custom: true })
      );

      const result = await initCommand({ yes: true, targetDir: testDir });

      // Should not have created/overwritten agents file
      expect(result.agentsPath).toBeNull();
      const agents = JSON.parse(
        readFileSync(join(testDir, AGENTS_FILENAME), 'utf-8')
      );
      expect(agents.custom).toBe(true);
    });
  });
});

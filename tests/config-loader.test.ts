import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  loadConfig,
  loadConfigFromFile,
  searchConfig,
  getDefaultConfig,
  validateConfig,
  isConfigError,
  clearConfigCache,
} from '../src/config/loader';

describe('Config Loader', () => {
  const testDir = join(tmpdir(), 'aqt-test-' + Date.now());

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    clearConfigCache();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration values', () => {
      const config = getDefaultConfig();

      expect(config.autoSieve).toBe(true);
      expect(config.logLevel).toBe('info');
      expect(config.defaultAgent).toBe('master-architect');
      expect(config.tokenAlerts.sessionWarning).toBe(150000);
      expect(config.tokenAlerts.sessionCritical).toBe(180000);
    });
  });

  describe('validateConfig', () => {
    it('should validate a valid configuration', () => {
      const config = validateConfig({
        autoSieve: false,
        logLevel: 'debug',
      });

      expect(config.autoSieve).toBe(false);
      expect(config.logLevel).toBe('debug');
    });

    it('should apply defaults for missing fields', () => {
      const config = validateConfig({});

      expect(config.autoSieve).toBe(true);
      expect(config.defaultAgent).toBe('master-architect');
    });

    it('should throw for invalid log level', () => {
      expect(() => validateConfig({ logLevel: 'invalid' })).toThrow();
    });
  });

  describe('loadConfigFromFile', () => {
    it('should load config from JSON file', async () => {
      const configPath = join(testDir, '.aqtrc.json');
      writeFileSync(
        configPath,
        JSON.stringify({
          autoSieve: false,
          logLevel: 'debug',
          defaultAgent: 'custom-agent',
        })
      );

      const result = await loadConfigFromFile(configPath);

      expect(result.config.autoSieve).toBe(false);
      expect(result.config.logLevel).toBe('debug');
      expect(result.config.defaultAgent).toBe('custom-agent');
      expect(result.filepath).toBe(configPath);
      expect(result.isEmpty).toBe(false);
    });

    it('should apply defaults for partial config', async () => {
      const configPath = join(testDir, '.aqtrc.json');
      writeFileSync(configPath, JSON.stringify({ logLevel: 'warn' }));

      const result = await loadConfigFromFile(configPath);

      expect(result.config.logLevel).toBe('warn');
      expect(result.config.autoSieve).toBe(true); // default
      expect(result.config.defaultAgent).toBe('master-architect'); // default
    });

    it('should throw validation error for invalid config', async () => {
      const configPath = join(testDir, '.aqtrc.json');
      writeFileSync(
        configPath,
        JSON.stringify({
          logLevel: 'not-a-valid-level',
        })
      );

      await expect(loadConfigFromFile(configPath)).rejects.toMatchObject({
        type: 'validation',
      });
    });
  });

  describe('searchConfig', () => {
    it('should find config in directory', async () => {
      const configPath = join(testDir, '.aqtrc.json');
      writeFileSync(
        configPath,
        JSON.stringify({
          autoSieve: false,
        })
      );

      const result = await searchConfig(testDir);

      expect(result.config.autoSieve).toBe(false);
      expect(result.filepath).toBe(configPath);
    });

    it('should return defaults when no config found', async () => {
      const result = await searchConfig(testDir);

      expect(result.config.autoSieve).toBe(true);
      expect(result.filepath).toBe(null);
      expect(result.isEmpty).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should load from explicit path', async () => {
      const configPath = join(testDir, 'custom-config.json');
      writeFileSync(
        configPath,
        JSON.stringify({
          logLevel: 'error',
        })
      );

      const result = await loadConfig({ configPath });

      expect(result.config.logLevel).toBe('error');
    });

    it('should search when no path provided', async () => {
      const result = await loadConfig({ searchFrom: testDir });

      expect(result.filepath).toBe(null);
      expect(result.config.autoSieve).toBe(true);
    });
  });

  describe('isConfigError', () => {
    it('should identify config errors', () => {
      const error = { type: 'validation', message: 'test' };
      expect(isConfigError(error)).toBe(true);
    });

    it('should reject non-config errors', () => {
      expect(isConfigError(new Error('test'))).toBe(false);
      expect(isConfigError(null)).toBe(false);
      expect(isConfigError('string')).toBe(false);
    });
  });
});

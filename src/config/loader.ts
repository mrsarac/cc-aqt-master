/**
 * Configuration loader using Cosmiconfig
 *
 * Supports:
 * - .aqtrc
 * - .aqtrc.json
 * - .aqtrc.yaml
 * - .aqtrc.yml
 * - aqt.config.js
 * - aqt.config.cjs
 * - package.json (aqt key)
 */

import { cosmiconfig } from 'cosmiconfig';
import { AQTConfigSchema, type AQTConfig } from './schema.js';
import { ZodError } from 'zod';

const MODULE_NAME = 'aqt';

export interface ConfigLoadResult {
  config: AQTConfig;
  filepath: string | null;
  isEmpty: boolean;
}

export interface ConfigLoadError {
  type: 'validation' | 'parse' | 'not_found' | 'unknown';
  message: string;
  details?: unknown;
}

/**
 * Format Zod validation errors into readable messages
 */
function formatZodError(error: ZodError): string {
  return error.errors
    .map((e) => {
      const path = e.path.join('.');
      return path ? `  - ${path}: ${e.message}` : `  - ${e.message}`;
    })
    .join('\n');
}

/**
 * Create a cosmiconfig explorer instance
 */
function createExplorer() {
  return cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      'package.json',
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `.${MODULE_NAME}rc.js`,
      `.${MODULE_NAME}rc.cjs`,
      `${MODULE_NAME}.config.js`,
      `${MODULE_NAME}.config.cjs`,
    ],
  });
}

/**
 * Load configuration from a specific file path
 */
export async function loadConfigFromFile(
  filepath: string
): Promise<ConfigLoadResult> {
  const explorer = createExplorer();

  try {
    const result = await explorer.load(filepath);

    if (!result || result.isEmpty) {
      return {
        config: AQTConfigSchema.parse({}),
        filepath,
        isEmpty: true,
      };
    }

    const validated = AQTConfigSchema.parse(result.config);

    return {
      config: validated,
      filepath: result.filepath,
      isEmpty: false,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw {
        type: 'validation',
        message: `Invalid configuration in ${filepath}:\n${formatZodError(error)}`,
        details: error.errors,
      } as ConfigLoadError;
    }

    throw {
      type: 'parse',
      message: `Failed to parse config file: ${filepath}`,
      details: error,
    } as ConfigLoadError;
  }
}

/**
 * Search for configuration file starting from a directory
 */
export async function searchConfig(
  searchFrom?: string
): Promise<ConfigLoadResult> {
  const explorer = createExplorer();

  try {
    const result = await explorer.search(searchFrom);

    if (!result || result.isEmpty) {
      // Return defaults when no config found
      return {
        config: AQTConfigSchema.parse({}),
        filepath: null,
        isEmpty: true,
      };
    }

    const validated = AQTConfigSchema.parse(result.config);

    return {
      config: validated,
      filepath: result.filepath,
      isEmpty: false,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw {
        type: 'validation',
        message: `Invalid configuration:\n${formatZodError(error)}`,
        details: error.errors,
      } as ConfigLoadError;
    }

    throw {
      type: 'unknown',
      message: 'Failed to load configuration',
      details: error,
    } as ConfigLoadError;
  }
}

/**
 * Load configuration with fallback to defaults
 *
 * Priority:
 * 1. Explicit filepath (--config flag)
 * 2. Search from current directory upwards
 * 3. Default values
 */
export async function loadConfig(options?: {
  configPath?: string;
  searchFrom?: string;
}): Promise<ConfigLoadResult> {
  // If explicit path provided, load from that file
  if (options?.configPath) {
    return loadConfigFromFile(options.configPath);
  }

  // Otherwise search for config
  return searchConfig(options?.searchFrom);
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): AQTConfig {
  return AQTConfigSchema.parse({});
}

/**
 * Validate a configuration object
 */
export function validateConfig(config: unknown): AQTConfig {
  return AQTConfigSchema.parse(config);
}

/**
 * Check if a configuration error is a ConfigLoadError
 */
export function isConfigError(error: unknown): error is ConfigLoadError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
}

/**
 * Clear the config cache (useful for testing)
 */
export function clearConfigCache(): void {
  const explorer = createExplorer();
  explorer.clearCaches();
}

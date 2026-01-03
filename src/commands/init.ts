/**
 * AQT Init Command
 *
 * Initialize AQT configuration in the current project
 */

import { existsSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join, basename } from 'path';
import chalk from 'chalk';
import { input, confirm, select } from '@inquirer/prompts';
import { getDefaultConfig, validateConfig, type AQTConfig } from '../config/index.js';

const CONFIG_FILENAME = '.aqtrc.json';
const AGENTS_FILENAME = 'aqt.agents.json';

export interface InitOptions {
  yes?: boolean;
  force?: boolean;
  targetDir?: string;
}

export interface InitResult {
  configPath: string;
  agentsPath: string | null;
  addedToGitignore: boolean;
  config: AQTConfig;
}

/**
 * Default agents configuration
 */
const DEFAULT_AGENTS = {
  $schema: 'https://aqt.dev/schemas/agents.json',
  version: '1.0',
  agents: [
    {
      name: 'master-architect',
      description: 'Master Architect - Default Claude Code agent',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: null,
    },
  ],
};

/**
 * Check if file exists at path
 */
function fileExists(path: string): boolean {
  try {
    return existsSync(path);
  } catch {
    return false;
  }
}

/**
 * Get project name from directory
 */
function getProjectName(dir: string): string {
  return basename(dir);
}

/**
 * Check if .gitignore exists and contains pattern
 */
function gitignoreContains(baseDir: string, pattern: string): boolean {
  const gitignorePath = join(baseDir, '.gitignore');
  if (!fileExists(gitignorePath)) {
    return false;
  }
  try {
    const content = readFileSync(gitignorePath, 'utf-8');
    return content.split('\n').some(line => line.trim() === pattern);
  } catch {
    return false;
  }
}

/**
 * Add pattern to .gitignore
 */
function addToGitignore(baseDir: string, pattern: string): boolean {
  const gitignorePath = join(baseDir, '.gitignore');
  try {
    if (!fileExists(gitignorePath)) {
      writeFileSync(gitignorePath, `${pattern}\n`);
    } else {
      appendFileSync(gitignorePath, `\n${pattern}\n`);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Run interactive init prompts
 */
async function runInteractivePrompts(defaults: AQTConfig): Promise<AQTConfig> {
  console.log(chalk.cyan('\nLet\'s configure AQT for your project.\n'));

  // Auto Sieve
  const autoSieve = await confirm({
    message: 'Enable auto-sieve for prompt optimization?',
    default: defaults.autoSieve,
  });

  // Log Level
  const logLevel = await select({
    message: 'Select log level:',
    choices: [
      { name: 'debug - All messages', value: 'debug' },
      { name: 'info - Info and above', value: 'info' },
      { name: 'warn - Warnings and errors only', value: 'warn' },
      { name: 'error - Errors only', value: 'error' },
    ],
    default: defaults.logLevel,
  });

  // Default Agent
  const defaultAgent = await input({
    message: 'Default agent name:',
    default: defaults.defaultAgent,
  });

  // Token Warning Threshold
  const sessionWarningStr = await input({
    message: 'Token warning threshold (e.g., 50000):',
    default: String(defaults.tokenAlerts.sessionWarning),
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        return 'Please enter a valid positive number';
      }
      return true;
    },
  });
  const sessionWarning = parseInt(sessionWarningStr, 10);

  // Token Critical Threshold
  const sessionCriticalStr = await input({
    message: 'Token critical threshold (e.g., 100000):',
    default: String(defaults.tokenAlerts.sessionCritical),
    validate: (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        return 'Please enter a valid positive number';
      }
      if (num <= sessionWarning) {
        return 'Critical threshold must be greater than warning threshold';
      }
      return true;
    },
  });
  const sessionCritical = parseInt(sessionCriticalStr, 10);

  return {
    autoSieve,
    logLevel: logLevel as 'debug' | 'info' | 'warn' | 'error',
    defaultAgent,
    tokenAlerts: {
      sessionWarning,
      sessionCritical,
    },
  };
}

/**
 * Initialize AQT in the target directory
 */
export async function initCommand(options: InitOptions = {}): Promise<InitResult> {
  const targetDir = options.targetDir || process.cwd();
  const configPath = join(targetDir, CONFIG_FILENAME);
  const agentsPath = join(targetDir, AGENTS_FILENAME);
  const projectName = getProjectName(targetDir);

  console.log(chalk.green(`\n🚀 Initializing AQT for ${chalk.bold(projectName)}\n`));

  // Check for existing config
  if (fileExists(configPath) && !options.force) {
    if (options.yes) {
      console.log(chalk.yellow(`Config already exists at ${CONFIG_FILENAME}`));
      console.log(chalk.gray('Use --force to overwrite'));
      throw new Error('Config already exists. Use --force to overwrite.');
    }

    const overwrite = await confirm({
      message: `${CONFIG_FILENAME} already exists. Overwrite?`,
      default: false,
    });

    if (!overwrite) {
      console.log(chalk.gray('Initialization cancelled.'));
      throw new Error('Initialization cancelled by user.');
    }
  }

  // Get configuration
  let config: AQTConfig;
  const defaults = getDefaultConfig();

  if (options.yes) {
    // Non-interactive mode - use defaults
    config = defaults;
    console.log(chalk.gray('Using default configuration (--yes mode)'));
  } else {
    // Interactive mode
    config = await runInteractivePrompts(defaults);
  }

  // Validate configuration
  config = validateConfig(config);

  // Write config file
  const configContent = JSON.stringify(config, null, 2);
  writeFileSync(configPath, configContent + '\n');
  console.log(chalk.green(`✓ Created ${CONFIG_FILENAME}`));

  // Create agents file
  let createdAgents = false;
  if (!fileExists(agentsPath)) {
    if (options.yes) {
      writeFileSync(agentsPath, JSON.stringify(DEFAULT_AGENTS, null, 2) + '\n');
      createdAgents = true;
      console.log(chalk.green(`✓ Created ${AGENTS_FILENAME}`));
    } else {
      const createAgents = await confirm({
        message: `Create ${AGENTS_FILENAME} for custom agents?`,
        default: true,
      });
      if (createAgents) {
        writeFileSync(agentsPath, JSON.stringify(DEFAULT_AGENTS, null, 2) + '\n');
        createdAgents = true;
        console.log(chalk.green(`✓ Created ${AGENTS_FILENAME}`));
      }
    }
  }

  // Add to .gitignore
  let addedToGitignore = false;
  const shouldAddGitignore = !gitignoreContains(targetDir, CONFIG_FILENAME);

  if (shouldAddGitignore) {
    if (options.yes) {
      // In yes mode, add to gitignore by default
      addedToGitignore = addToGitignore(targetDir, CONFIG_FILENAME);
      if (addedToGitignore) {
        console.log(chalk.green(`✓ Added ${CONFIG_FILENAME} to .gitignore`));
      }
    } else {
      const addGitignore = await confirm({
        message: `Add ${CONFIG_FILENAME} to .gitignore?`,
        default: true,
      });
      if (addGitignore) {
        addedToGitignore = addToGitignore(targetDir, CONFIG_FILENAME);
        if (addedToGitignore) {
          console.log(chalk.green(`✓ Added ${CONFIG_FILENAME} to .gitignore`));
        }
      }
    }
  }

  // Print summary
  console.log(chalk.cyan('\n📋 Configuration Summary:\n'));
  console.log(`  Auto Sieve:       ${config.autoSieve ? chalk.green('enabled') : chalk.gray('disabled')}`);
  console.log(`  Log Level:        ${chalk.white(config.logLevel)}`);
  console.log(`  Default Agent:    ${chalk.white(config.defaultAgent)}`);
  console.log(`  Token Warning:    ${chalk.yellow(config.tokenAlerts.sessionWarning.toLocaleString())}`);
  console.log(`  Token Critical:   ${chalk.red(config.tokenAlerts.sessionCritical.toLocaleString())}`);

  // Print next steps
  console.log(chalk.cyan('\n📖 Next Steps:\n'));
  console.log('  1. Run ' + chalk.white('aqt track') + ' to start monitoring Claude Code usage');
  console.log('  2. Run ' + chalk.white('aqt sieve <question>') + ' to optimize your prompts');
  console.log('  3. Run ' + chalk.white('aqt config') + ' to view current configuration');
  if (createdAgents) {
    console.log('  4. Edit ' + chalk.white(AGENTS_FILENAME) + ' to define custom agents');
  }
  console.log('');

  return {
    configPath,
    agentsPath: createdAgents ? agentsPath : null,
    addedToGitignore,
    config,
  };
}

/**
 * Export for testing
 */
export { CONFIG_FILENAME, AGENTS_FILENAME, DEFAULT_AGENTS };

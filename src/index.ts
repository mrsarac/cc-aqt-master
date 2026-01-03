#!/usr/bin/env node
/**
 * CC-AQT-MASTER - Claude Code Advanced Query Toolkit
 *
 * Main CLI entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  loadConfig,
  isConfigError,
  type AQTConfig,
  type ConfigLoadResult,
} from './config/index.js';
import { initCommand } from './commands/index.js';

const program = new Command();

// Global config holder
let globalConfig: ConfigLoadResult | null = null;

/**
 * Load configuration before command execution
 */
async function ensureConfig(configPath?: string): Promise<AQTConfig> {
  if (globalConfig && !configPath) {
    return globalConfig.config;
  }

  try {
    globalConfig = await loadConfig({ configPath });

    if (globalConfig.filepath) {
      if (program.opts().verbose) {
        console.log(chalk.gray(`Config loaded from: ${globalConfig.filepath}`));
      }
    }

    return globalConfig.config;
  } catch (error) {
    if (isConfigError(error)) {
      console.error(chalk.red(`Configuration Error: ${error.message}`));
      process.exit(1);
    }
    throw error;
  }
}

program
  .name('aqt')
  .description(
    'Claude Code Advanced Query Toolkit - Optimize human-AI interaction'
  )
  .version('0.1.0-alpha')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --verbose', 'Verbose output')
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    await ensureConfig(opts.config);
  });

// Init command
program
  .command('init')
  .description('Initialize AQT in current project')
  .option('-y, --yes', 'Skip prompts, use defaults')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    try {
      await initCommand({
        yes: options.yes,
        force: options.force,
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Error: ${error.message}`));
      }
      process.exit(1);
    }
  });

// Track command
program
  .command('track')
  .description('Track Claude Code resource usage')
  .option('-w, --watch', 'Watch mode for live updates')
  .option('-e, --export <file>', 'Export metrics to JSON file')
  .option('-p, --project <path>', 'Project path to analyze')
  .action(async (options) => {
    const config = globalConfig?.config;

    console.log(chalk.blue('Resource Tracker'));
    console.log(chalk.gray(`Log Level: ${config?.logLevel}`));
    console.log(
      chalk.gray(`Token Warning: ${config?.tokenAlerts.sessionWarning}`)
    );

    console.log(chalk.yellow('TODO: Implement track command'));
    if (options.watch) console.log(chalk.gray('Watch mode enabled'));
    if (options.export) console.log(chalk.gray(`Export to: ${options.export}`));
  });

// Sieve command
program
  .command('sieve <question>')
  .description('Run a question through the Master Prompt Sieve')
  .option('-c, --context <path>', 'Additional context path')
  .action(async (question, _options) => {
    const config = globalConfig?.config;

    console.log(chalk.magenta('Master Prompt Sieve'));
    console.log(chalk.gray(`Auto Sieve: ${config?.autoSieve}`));
    console.log(chalk.gray(`Default Agent: ${config?.defaultAgent}`));
    console.log(chalk.gray(`Input: ${question}`));

    console.log(chalk.yellow('TODO: Implement sieve command'));
  });

// Agents command
program
  .command('agents')
  .description('Manage Claude Code agents')
  .argument('[action]', 'Action: list, export, load', 'list')
  .argument('[name]', 'Agent name')
  .action(async (action, name) => {
    const config = globalConfig?.config;

    console.log(chalk.cyan('Agent Manager'));
    console.log(chalk.gray(`Default Agent: ${config?.defaultAgent}`));
    console.log(chalk.gray(`Action: ${action}, Name: ${name || 'all'}`));

    console.log(chalk.yellow('TODO: Implement agents command'));
  });

// Dashboard command
program
  .command('dashboard')
  .description('Show metrics dashboard')
  .action(async () => {
    const config = globalConfig?.config;

    console.log(chalk.green('='.repeat(50)));
    console.log(chalk.green.bold('  CC-AQT-MASTER Dashboard'));
    console.log(chalk.green('='.repeat(50)));

    console.log(chalk.gray(`\nConfiguration:`));
    console.log(chalk.gray(`  Auto Sieve: ${config?.autoSieve}`));
    console.log(chalk.gray(`  Log Level: ${config?.logLevel}`));
    console.log(chalk.gray(`  Default Agent: ${config?.defaultAgent}`));
    console.log(
      chalk.gray(`  Token Warning: ${config?.tokenAlerts.sessionWarning}`)
    );
    console.log(
      chalk.gray(`  Token Critical: ${config?.tokenAlerts.sessionCritical}`)
    );

    if (globalConfig?.filepath) {
      console.log(chalk.gray(`\n  Config File: ${globalConfig.filepath}`));
    } else {
      console.log(chalk.gray(`\n  Config File: (using defaults)`));
    }

    console.log(chalk.yellow('\nTODO: Implement full dashboard'));
  });

// Config command - show current config
program
  .command('config')
  .description('Show current configuration')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const config = globalConfig?.config;

    if (options.json) {
      console.log(JSON.stringify(config, null, 2));
      return;
    }

    console.log(chalk.cyan('Current Configuration'));
    console.log(chalk.gray('─'.repeat(40)));

    if (globalConfig?.filepath) {
      console.log(chalk.gray(`Source: ${globalConfig.filepath}`));
    } else {
      console.log(chalk.gray('Source: defaults (no config file found)'));
    }

    console.log(chalk.gray('─'.repeat(40)));
    console.log(`  autoSieve:       ${chalk.white(config?.autoSieve)}`);
    console.log(`  logLevel:        ${chalk.white(config?.logLevel)}`);
    console.log(`  defaultAgent:    ${chalk.white(config?.defaultAgent)}`);
    console.log(`  claudeHome:      ${chalk.white(config?.claudeHome || '~/.claude')}`);
    console.log(chalk.gray('\n  tokenAlerts:'));
    console.log(`    sessionWarning:  ${chalk.yellow(config?.tokenAlerts.sessionWarning)}`);
    console.log(`    sessionCritical: ${chalk.red(config?.tokenAlerts.sessionCritical)}`);
  });

program.parse();

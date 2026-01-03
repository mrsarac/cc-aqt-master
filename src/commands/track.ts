/**
 * AQT Track Command
 *
 * Track token usage for Claude Code sessions
 */

import { writeFileSync } from 'fs';
import chalk from 'chalk';
import {
  detectCurrentProject,
  findProject,
  listAvailableProjects,
  analyzeProject,
  formatNumber,
  formatCost,
  formatPercent,
  exportUsageJSON,
  type ProjectUsage,
  type SessionUsage,
} from '../tracker/index.js';

export interface TrackOptions {
  project?: string;
  sessions?: number;
  watch?: boolean;
  export?: string;
  list?: boolean;
  customHome?: string;
}

export interface TrackResult {
  projectId: string;
  projectName: string;
  usage: ProjectUsage;
  exported?: string;
}

/**
 * Print token usage table
 */
function printUsageTable(usage: ProjectUsage): void {
  const { sessions, totals } = usage;

  if (sessions.length === 0) {
    console.log(chalk.yellow('\n  No sessions found for this project.\n'));
    return;
  }

  // Header
  console.log(chalk.cyan('\n  Session Token Usage\n'));

  // Column headers
  const headers = [
    'Session'.padEnd(18),
    'Input'.padStart(10),
    'Output'.padStart(10),
    'Cache'.padStart(8),
    'Cost'.padStart(8),
    'Msgs'.padStart(6),
  ];
  console.log(chalk.gray('  ' + headers.join(' ')));
  console.log(chalk.gray('  ' + '─'.repeat(62)));

  // Session rows
  for (const session of sessions) {
    const row = [
      session.sessionLabel.padEnd(18),
      formatNumber(session.inputTokens).padStart(10),
      formatNumber(session.outputTokens).padStart(10),
      formatPercent(session.cacheHitRatio).padStart(8),
      formatCost(session.costUSD).padStart(8),
      String(session.messageCount).padStart(6),
    ];
    console.log('  ' + row.join(' '));
  }

  // Totals row
  console.log(chalk.gray('  ' + '─'.repeat(62)));
  const totalsRow = [
    chalk.bold('Total'.padEnd(18)),
    chalk.bold(formatNumber(totals.inputTokens).padStart(10)),
    chalk.bold(formatNumber(totals.outputTokens).padStart(10)),
    chalk.bold(formatPercent(totals.cacheHitRatio).padStart(8)),
    chalk.bold(formatCost(totals.costUSD).padStart(8)),
    chalk.bold(String(totals.messageCount).padStart(6)),
  ];
  console.log('  ' + totalsRow.join(' '));
  console.log('');
}

/**
 * Print summary stats
 */
function printSummary(usage: ProjectUsage): void {
  const { totals } = usage;

  console.log(chalk.cyan('  Summary\n'));
  console.log(`  Sessions analyzed:  ${chalk.white(totals.sessionCount)}`);
  console.log(`  Total tokens:       ${chalk.white(formatNumber(totals.totalTokens))}`);
  console.log(`  Cache hit ratio:    ${chalk.white(formatPercent(totals.cacheHitRatio))}`);
  console.log(`  Estimated cost:     ${chalk.green(formatCost(totals.costUSD))}`);
  console.log('');
}

/**
 * List available projects
 */
function listProjects(customHome?: string): void {
  const projects = listAvailableProjects(customHome);

  if (projects.length === 0) {
    console.log(chalk.yellow('\n  No Claude Code projects found.\n'));
    console.log(chalk.gray('  Make sure you have used Claude Code in at least one project.\n'));
    return;
  }

  console.log(chalk.cyan('\n  Available Projects\n'));

  for (const project of projects) {
    const sessionCount = project.sessionCount || 0;
    const sessionLabel = sessionCount === 1 ? 'session' : 'sessions';
    console.log(`  ${chalk.white(project.name)} ${chalk.gray(`(${sessionCount} ${sessionLabel})`)}`);
    console.log(`    ${chalk.gray(project.id)}`);
  }

  console.log('');
}

/**
 * Watch mode - poll for changes
 */
async function watchMode(
  projectId: string,
  projectName: string,
  sessions: number,
  customHome?: string
): Promise<void> {
  const POLL_INTERVAL = 5000; // 5 seconds

  console.log(chalk.cyan(`\n  Watching ${chalk.bold(projectName)} for changes...`));
  console.log(chalk.gray('  Press Ctrl+C to stop\n'));

  let lastUpdate = Date.now();

  const refresh = async (): Promise<void> => {
    const project = findProject(projectId, customHome);
    if (!project) return;

    const usage = await analyzeProject(
      project.projectId,
      project.projectName,
      project.sessions,
      sessions
    );

    // Clear screen and reprint
    console.clear();
    console.log(chalk.green(`\n  📊 ${chalk.bold(projectName)}`));
    console.log(chalk.gray(`  Last updated: ${new Date().toLocaleTimeString()}\n`));

    printUsageTable(usage);
    printSummary(usage);

    console.log(chalk.gray('  Press Ctrl+C to stop'));
  };

  // Initial refresh
  await refresh();

  // Poll for changes
  const interval = setInterval(refresh, POLL_INTERVAL);

  // Handle exit
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log(chalk.gray('\n  Stopped watching.\n'));
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

/**
 * Main track command
 */
export async function trackCommand(options: TrackOptions = {}): Promise<TrackResult | null> {
  const sessions = options.sessions || 5;

  // List mode
  if (options.list) {
    listProjects(options.customHome);
    return null;
  }

  // Find project
  let project;

  if (options.project) {
    // Use specified project
    project = findProject(options.project, options.customHome);
    if (!project) {
      console.log(chalk.red(`\n  Project not found: ${options.project}\n`));
      console.log(chalk.gray('  Use --list to see available projects.\n'));
      throw new Error(`Project not found: ${options.project}`);
    }
  } else {
    // Auto-detect from git root
    project = detectCurrentProject(options.customHome);
    if (!project) {
      console.log(chalk.yellow('\n  Could not auto-detect project.\n'));
      console.log(chalk.gray('  Make sure you are in a git repository that has been used with Claude Code.'));
      console.log(chalk.gray('  Or specify a project with --project <name>\n'));
      console.log(chalk.gray('  Use --list to see available projects.\n'));
      throw new Error('Could not auto-detect project. Use --project or --list.');
    }
  }

  console.log(chalk.green(`\n  📊 ${chalk.bold(project.projectName)}`));
  console.log(chalk.gray(`  ${project.projectPath}\n`));

  // Watch mode
  if (options.watch) {
    await watchMode(project.projectId, project.projectName, sessions, options.customHome);
    return null;
  }

  // Analyze usage
  const usage = await analyzeProject(
    project.projectId,
    project.projectName,
    project.sessions,
    sessions
  );

  // Print table
  printUsageTable(usage);
  printSummary(usage);

  // Export if requested
  let exported: string | undefined;
  if (options.export) {
    const json = exportUsageJSON(usage);
    writeFileSync(options.export, json);
    exported = options.export;
    console.log(chalk.green(`  ✓ Exported to ${options.export}\n`));
  }

  return {
    projectId: project.projectId,
    projectName: project.projectName,
    usage,
    exported,
  };
}

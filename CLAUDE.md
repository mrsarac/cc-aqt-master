# CC-AQT-MASTER - Claude Code Instructions

## Project Overview

CC-AQT-MASTER (Claude Code Advanced Query Toolkit) is a TypeScript CLI tool that optimizes human-AI interaction in Claude Code environments.

## Core Concepts

### 1. Master Prompt Sieve
Transforms raw questions into structured, actionable multiple-choice options.

### 2. Resource Tracker
Monitors token consumption from `~/.claude/projects/*.jsonl` files.

### 3. Agent Orchestrator
Manages custom agent definitions for Claude Code `--agents` flag.

## Development Commands

```bash
npm run dev        # Watch mode development
npm run build      # Build for production
npm run test       # Run tests
npm run lint       # Lint code
npm run typecheck  # Type checking
```

## File Structure

```
src/
├── cli/commands/  # CLI command implementations
├── sieve/         # Master Prompt Sieve logic
├── tracker/       # Resource tracking
├── agents/        # Agent definitions
├── config/        # Configuration management
└── utils/         # Shared utilities
```

## Key Files

- `/docs/ARCHITECTURE.md` - Full system architecture
- `/src/index.ts` - CLI entry point
- `/src/agents/definitions/*.json` - Agent JSON definitions

## Coding Standards

1. **TypeScript strict mode** - All code must pass strict type checking
2. **Zod schemas** - Use Zod for runtime validation
3. **ESM only** - No CommonJS imports
4. **Functional approach** - Prefer pure functions over classes where possible

## Testing

Tests use Vitest. Run with `npm test`.

## Integration Points

This tool integrates with:
- `~/.claude/` - Claude Code configuration directory
- `~/.claude/projects/` - JSONL log files
- Project `CLAUDE.md` files

## Important Notes

- Never store API keys or credentials
- All operations are read-only on Claude Code logs
- Export functions should sanitize sensitive paths

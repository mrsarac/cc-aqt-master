# CC-AQT-MASTER

Claude Code Advanced Query Toolkit - Token tracking and intelligent question refinement for Claude Code.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-157%20passing-brightgreen.svg)]()

## Installation

```bash
git clone https://github.com/mrsarac/cc-aqt-master.git
cd cc-aqt-master
npm install
npm run build
npm link
```

## Quick Start

### Track Token Usage

```bash
# Show token usage for current project
aqt track

# List all Claude Code projects
aqt track -l

# Watch mode (live updates)
aqt track -w

# Export to JSON
aqt track -e usage.json

# Show last 10 sessions
aqt track -n 10
```

### Initialize Project

```bash
# Interactive setup
aqt init

# Quick setup with defaults
aqt init -y

# Force overwrite existing config
aqt init -f
```

### View Configuration

```bash
# Show current config
aqt config

# Output as JSON
aqt config --json
```

## Features

### Token Tracking

Monitor Claude Code resource consumption across all projects.

| Metric | Description |
|--------|-------------|
| Input Tokens | Tokens sent to Claude |
| Output Tokens | Tokens received from Claude |
| Cache Tokens | Tokens served from cache |
| Cache Hit Ratio | Percentage of cached responses |
| Cost Estimate | USD cost based on Claude pricing |

**Pricing (Claude 3.5 Sonnet):**
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- Cache Read: $0.30 / 1M tokens

### Session Detection

Automatically detects Claude Code projects from `~/.claude/projects/`.

```bash
# Auto-detect current git project
aqt track

# Specify project by name
aqt track -p myproject

# List available projects
aqt track -l
```

### Configuration

Supports multiple config formats via [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig):

- `.aqtrc.json`
- `.aqtrc.yaml`
- `.aqtrc.js`
- `aqt.config.js`
- `package.json` (`aqt` key)

```json
{
  "autoSieve": true,
  "logLevel": "info",
  "defaultAgent": "master-architect",
  "claudeHome": "~/.claude",
  "tokenAlerts": {
    "sessionWarning": 150000,
    "sessionCritical": 180000
  }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `aqt init` | Initialize AQT in current project |
| `aqt track` | Track token usage |
| `aqt config` | Show configuration |
| `aqt sieve` | Run Master Prompt Sieve (coming soon) |
| `aqt agents` | Manage agents (coming soon) |
| `aqt dashboard` | Show metrics dashboard (coming soon) |

## Architecture

```
cc-aqt-master/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── commands/          # Command implementations
│   │   ├── init.ts        # aqt init
│   │   └── track.ts       # aqt track
│   ├── config/            # Configuration system
│   │   ├── loader.ts      # cosmiconfig integration
│   │   └── schema.ts      # zod validation
│   ├── tracker/           # Token tracking
│   │   ├── session-detector.ts
│   │   └── token-analyzer.ts
│   └── utils/             # Utilities
│       ├── jsonl-parser.ts
│       └── claude-paths.ts
├── prompts/               # Master Prompt templates
│   ├── master-architect.md
│   ├── anti-patterns.md
│   └── scenarios/
├── tests/                 # 157 tests
└── docs/
    ├── ARCHITECTURE.md
    └── PRD.md
```

## Master Prompt Sieve (Preview)

Transform vague questions into actionable decisions:

```
Raw: "What database should I use?"

Refined:
┌─────────────────────────────────────────────────────────────┐
│ DATABASE SELECTION                                          │
├─────────────────────────────────────────────────────────────┤
│ Context: Node.js MVP, no existing database, Docker setup    │
│                                                             │
│ Options:                                                    │
│ A) SQLite     - Zero config, file-based      [Low effort]  │
│ B) PostgreSQL - Docker service, production   [Medium]      │
│ C) In-memory  - Testing only                 [Temporary]   │
│                                                             │
│ Recommendation: A for MVP, migrate to B pre-launch         │
│                                                             │
│ Reply: A, B, or C                                           │
└─────────────────────────────────────────────────────────────┘
```

See [prompts/README.md](prompts/README.md) for the full prompt system.

## Development

```bash
# Run tests
npm test

# Watch mode
npm run dev

# Type check
npm run typecheck

# Build
npm run build
```

## Roadmap

### Sprint 1: Foundation ✅ Complete

- [x] CLI skeleton with Commander.js
- [x] Configuration system (cosmiconfig + zod)
- [x] JSONL parser for Claude logs
- [x] Cross-platform Claude path detection
- [x] `aqt init` command
- [x] `aqt track` command with watch/export

### Sprint 2: Master Prompt Sieve (Planned)

- [ ] Intent detection
- [ ] Question refinement engine
- [ ] Option generation with impact analysis
- [ ] `aqt sieve` command

### Sprint 3: Agent System (Planned)

- [ ] Agent JSON schema
- [ ] Agent registry
- [ ] Pre-built agents (master-architect, resource-guardian)
- [ ] `aqt agents` command

### Sprint 4: Dashboard (Planned)

- [ ] Real-time context monitoring
- [ ] Historical trends
- [ ] Alert system
- [ ] `aqt dashboard` command

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built by [NeuraByte Labs](https://neurabytelabs.com)

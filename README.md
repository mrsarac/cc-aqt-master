# CC-AQT-MASTER

> **Claude Code Advanced Query Toolkit**
> Optimize human-AI interaction through intelligent question refinement and resource tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

---

## The Problem

When working with Claude Code, inefficient interactions waste resources:

- **3.2 average questions** per task (could be 1.1)
- **120 seconds** user decision time (could be 15s)
- **40% token overhead** from context pollution
- **Lost productivity** from cognitive context switching

## The Solution

CC-AQT-MASTER introduces the **Recursive Master Prompt Sieve**:

```
Raw Question: "What database should I use?"
                    |
                    v
            +---------------+
            | MASTER SIEVE  |
            +---------------+
                    |
                    v
Refined Question:
---
**Context:** Analyzing your project's docker-compose.yml - no external
database service found. Node.js project in MVP phase.

**Options:**
- **A: SQLite** - Zero config, file-based. Impact: Low complexity, not scalable.
- **B: PostgreSQL** - Add docker service. Impact: +50MB, production-ready.
- **C: In-memory** - Testing only. Impact: Data loss on restart.

**Recommendation:** Option A for MVP, migrate to B pre-launch.

**Action:** Reply A, B, or C.
---
```

## Features

### Master Prompt Sieve
Transform open-ended questions into actionable multiple-choice options with impact analysis.

### Resource Tracker
Monitor token consumption, context window utilization, and session costs.

### Agent Orchestrator
Pre-built agents for specialized tasks (master-architect, resource-guardian, etc.)

## Installation

```bash
# Clone the repository
git clone https://github.com/mrsarac/cc-aqt-master.git
cd cc-aqt-master

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link
```

## Usage

### Initialize Project
```bash
aqt init
```

### Track Resource Usage
```bash
# Show current session metrics
aqt track

# Watch mode
aqt track --watch

# Export to JSON
aqt track --export metrics.json
```

### Refine Questions
```bash
# Run a question through the sieve
aqt sieve "Which authentication method should I use?"

# With project context
aqt sieve --context ./src "How should I structure the API?"
```

### Manage Agents
```bash
# List available agents
aqt agents list

# Export agent for Claude Code
aqt agents export master-architect

# Start session with agent
claude --agents "$(aqt agents export master-architect)"
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

```
cc-aqt-master/
├── src/
│   ├── sieve/        # Master Prompt Sieve
│   ├── tracker/      # Resource Tracking
│   ├── agents/       # Agent Orchestration
│   └── cli/          # CLI Commands
├── docs/
│   └── ARCHITECTURE.md
└── tests/
```

## Roadmap

- [x] Architecture document
- [ ] Phase 1: Foundation (CLI skeleton, config system)
- [ ] Phase 2: Resource Tracker MVP
- [ ] Phase 3: Master Prompt Sieve Core
- [ ] Phase 4: Agent System

## Contributing

Contributions welcome! Please read our contributing guidelines first.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*Built with love by [NeuraByte Labs](https://neurabytelabs.com)*

# CC-AQT-MASTER Architecture Document

> **Claude Code Advanced Query Toolkit**
> Version: 0.1.0-alpha | Date: 2026-01-02

---

## Executive Summary

CC-AQT-MASTER is a toolkit designed to optimize human-AI interaction in Claude Code environments through:
1. **Recursive Master Prompt Sieve** - Dynamic question refinement before user interaction
2. **Resource Tracking** - Token consumption and context window monitoring
3. **Agent Orchestration** - Configurable agent definitions for specialized tasks

---

## System Architecture Diagram

```
+==============================================================================+
|                         CC-AQT-MASTER ARCHITECTURE                           |
+==============================================================================+

                              +-------------------+
                              |   USER (Human)    |
                              +--------+----------+
                                       |
                                       | Refined Question (Options A/B/C)
                                       v
+------------------------------------------------------------------------------+
|                            MASTER PROMPT SIEVE                               |
|  +------------------------------------------------------------------------+  |
|  |  STEP 1: INTENT DETECTION                                              |  |
|  |  - Analyze agent's need to ask                                         |  |
|  |  - Classify question type (config/architecture/implementation)         |  |
|  +------------------------------------------------------------------------+  |
|                                      |                                       |
|                                      v                                       |
|  +------------------------------------------------------------------------+  |
|  |  STEP 2: DYNAMIC MASTER PROMPT GENERATION                              |  |
|  |  - Context analysis (current file, project state)                      |  |
|  |  - Rule generation for optimal question format                         |  |
|  |  - Example enrichment (code snippets, config samples)                  |  |
|  +------------------------------------------------------------------------+  |
|                                      |                                       |
|                                      v                                       |
|  +------------------------------------------------------------------------+  |
|  |  STEP 3: QUESTION REFINEMENT                                           |  |
|  |  - Transform open-ended -> multiple choice                             |  |
|  |  - Add impact analysis (tokens, performance, time)                     |  |
|  |  - Include agent recommendation                                        |  |
|  +------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------+
                                       ^
                                       | Raw Question Intent
                                       |
+------------------------------------------------------------------------------+
|                          RESOURCE TRACKER                                    |
|  +---------------------------+    +--------------------------------------+   |
|  |   TOKEN ANALYZER          |    |   CONTEXT MONITOR                    |   |
|  |   - Input token count     |    |   - Window utilization %             |   |
|  |   - Output token count    |    |   - Files in context                 |   |
|  |   - Cache hit ratio       |    |   - Truncation warnings              |   |
|  |   - Cost estimation       |    |   - Memory pressure alerts           |   |
|  +---------------------------+    +--------------------------------------+   |
|                 |                                    |                       |
|                 +---------------+--------------------+                       |
|                                 |                                            |
|                                 v                                            |
|                    +------------------------+                                |
|                    |   USAGE DASHBOARD      |                                |
|                    |   - Session metrics    |                                |
|                    |   - Historical trends  |                                |
|                    |   - Export to JSON     |                                |
|                    +------------------------+                                |
+------------------------------------------------------------------------------+
                                       ^
                                       | Metrics Collection
                                       |
+------------------------------------------------------------------------------+
|                         AGENT ORCHESTRATOR                                   |
|  +------------------------------------------------------------------------+  |
|  |  AGENT REGISTRY                                                        |  |
|  |  +------------------------+  +------------------------+                |  |
|  |  | master-architect       |  | resource-guardian      |                |  |
|  |  | - Question refinement  |  | - Token monitoring     |                |  |
|  |  | - Option generation    |  | - Alert generation     |                |  |
|  |  +------------------------+  +------------------------+                |  |
|  |  +------------------------+  +------------------------+                |  |
|  |  | context-curator        |  | decision-logger        |                |  |
|  |  | - File prioritization  |  | - Choice tracking      |                |  |
|  |  | - Relevance scoring    |  | - Learning from picks  |                |  |
|  |  +------------------------+  +------------------------+                |  |
|  +------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------+
                                       ^
                                       |
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
+-------------------+    +-------------------+    +-------------------+
|  ~/.claude/       |    |  Project Root     |    |  ccusage logs     |
|  - config         |    |  - CLAUDE.md      |    |  - JSONL files    |
|  - projects/      |    |  - .aqt/          |    |  - Token history  |
+-------------------+    +-------------------+    +-------------------+
```

---

## Component Breakdown

### 1. Master Prompt Sieve (`/src/sieve/`)

The core innovation - intercepts raw questions and refines them.

| Component | Responsibility | Input | Output |
|-----------|----------------|-------|--------|
| `IntentDetector` | Classify question type | Raw question string | QuestionIntent enum |
| `MasterPromptGenerator` | Create context-specific rules | Project context, question type | Dynamic prompt rules |
| `QuestionRefiner` | Apply rules to raw question | Raw question + rules | Refined question with options |
| `ExampleEnricher` | Add code snippets to options | Refined question + codebase | Question with examples |

**Key Data Structures:**

```typescript
interface QuestionIntent {
  type: 'config' | 'architecture' | 'implementation' | 'clarification';
  confidence: number;
  context: {
    currentFile: string;
    recentFiles: string[];
    projectPhase: 'mvp' | 'growth' | 'mature';
  };
}

interface RefinedQuestion {
  summary: string;
  context: string;
  options: Option[];
  recommendation: string;
  callToAction: string;
}

interface Option {
  label: string; // A, B, C
  description: string;
  codeExample?: string;
  impact: {
    tokens: 'low' | 'medium' | 'high';
    performance: string;
    complexity: string;
  };
}
```

### 2. Resource Tracker (`/src/tracker/`)

Monitors and reports on Claude Code resource consumption.

| Component | Responsibility | Data Source |
|-----------|----------------|-------------|
| `TokenAnalyzer` | Parse and aggregate token usage | `~/.claude/projects/*.jsonl` |
| `ContextMonitor` | Track context window utilization | `/context` command output |
| `CostEstimator` | Calculate session/project costs | Token counts + pricing API |
| `AlertEngine` | Generate warnings for thresholds | All metrics |

**Metrics Collected:**

```typescript
interface SessionMetrics {
  sessionId: string;
  startTime: Date;
  tokens: {
    input: number;
    output: number;
    cached: number;
    cacheHitRatio: number;
  };
  context: {
    utilizationPercent: number;
    filesInContext: number;
    truncationEvents: number;
  };
  interactions: {
    totalTurns: number;
    questionsAsked: number;
    refinedQuestions: number;
  };
  cost: {
    estimatedUSD: number;
    modelTier: 'sonnet' | 'opus';
  };
}
```

### 3. Agent Orchestrator (`/src/agents/`)

Manages agent definitions and lifecycle.

| Component | Responsibility |
|-----------|----------------|
| `AgentRegistry` | Load and validate agent JSON definitions |
| `AgentLoader` | Inject agents into Claude Code sessions |
| `AgentLogger` | Track agent performance and decisions |

**Pre-built Agents:**

| Agent | Purpose | Tools |
|-------|---------|-------|
| `master-architect` | Question refinement | AskUserQuestion, Read, Grep, Glob |
| `resource-guardian` | Token monitoring | Read (logs), Bash (ccusage) |
| `context-curator` | File prioritization | Glob, Read, Grep |
| `decision-logger` | Choice tracking | Write, Read |

---

## Technology Stack

### Recommended: **TypeScript CLI with Node.js**

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Node.js 20+ LTS | Native JSON handling, async I/O, ecosystem |
| **Language** | TypeScript 5.x | Type safety, IDE support, refactoring |
| **CLI Framework** | Commander.js | Mature, Claude Code compatible |
| **File Parsing** | `readline` + `zod` | Streaming JSONL, schema validation |
| **Output** | Chalk + Ora | Colored output, spinners |
| **Config** | Cosmiconfig | Standard config file discovery |
| **Testing** | Vitest | Fast, TypeScript native |
| **Build** | esbuild | Fast bundling for CLI distribution |

### Alternative Stacks Considered

| Stack | Pros | Cons | Verdict |
|-------|------|------|---------|
| **Rust** | Performance, single binary | Longer dev time, complex async | Phase 2 for resource-critical components |
| **Python** | Rich ecosystem, quick prototyping | Slower, dependency management | Good for analysis scripts only |
| **Go** | Fast compilation, single binary | Less ecosystem for JSON/JSONL | Consider for v2.0 rewrite |

---

## File Structure

```
cc-aqt-master/
├── .aqt/                          # Local project config (gitignored)
│   └── config.json                # Project-specific overrides
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   ├── AGENTS.md                  # Agent definition guide
│   ├── INTEGRATION.md             # Claude Code integration guide
│   └── METRICS.md                 # Metrics and dashboard docs
├── src/
│   ├── index.ts                   # CLI entry point
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── init.ts            # aqt init - setup project
│   │   │   ├── sieve.ts           # aqt sieve - run prompt sieve
│   │   │   ├── track.ts           # aqt track - resource tracking
│   │   │   ├── agents.ts          # aqt agents - manage agents
│   │   │   └── dashboard.ts       # aqt dashboard - show metrics
│   │   └── index.ts               # CLI router
│   ├── sieve/
│   │   ├── IntentDetector.ts
│   │   ├── MasterPromptGenerator.ts
│   │   ├── QuestionRefiner.ts
│   │   ├── ExampleEnricher.ts
│   │   └── index.ts
│   ├── tracker/
│   │   ├── TokenAnalyzer.ts
│   │   ├── ContextMonitor.ts
│   │   ├── CostEstimator.ts
│   │   ├── AlertEngine.ts
│   │   └── index.ts
│   ├── agents/
│   │   ├── definitions/
│   │   │   ├── master-architect.json
│   │   │   ├── resource-guardian.json
│   │   │   ├── context-curator.json
│   │   │   └── decision-logger.json
│   │   ├── AgentRegistry.ts
│   │   ├── AgentLoader.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── schema.ts              # Zod schemas
│   │   ├── loader.ts              # Config discovery
│   │   └── defaults.ts            # Default values
│   └── utils/
│       ├── jsonl.ts               # JSONL parser
│       ├── claude-paths.ts        # ~/.claude/ path helpers
│       └── logger.ts              # Structured logging
├── tests/
│   ├── sieve/
│   ├── tracker/
│   ├── agents/
│   └── fixtures/                  # Sample JSONL, configs
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.json
├── .prettierrc
├── CLAUDE.md                      # Claude Code instructions for this project
├── README.md
└── LICENSE                        # MIT
```

---

## Phase 1 Implementation Plan

### Sprint 1: Foundation (Week 1-2)

| Task | Priority | Effort | Deliverable |
|------|----------|--------|-------------|
| **P1-1** Project scaffolding | P0 | 2h | package.json, tsconfig, eslint |
| **P1-2** CLI skeleton | P0 | 4h | Commander.js setup, help texts |
| **P1-3** Config system | P0 | 4h | Cosmiconfig + Zod schemas |
| **P1-4** JSONL parser | P0 | 3h | Streaming parser for ~/.claude/projects/ |
| **P1-5** Claude path utilities | P1 | 2h | Cross-platform path resolution |

**Milestone:** `aqt --version` and `aqt init` commands working

### Sprint 2: Resource Tracker MVP (Week 3-4)

| Task | Priority | Effort | Deliverable |
|------|----------|--------|-------------|
| **P2-1** TokenAnalyzer | P0 | 6h | Parse JSONL, aggregate tokens |
| **P2-2** Basic dashboard | P0 | 4h | Terminal table output |
| **P2-3** Session detection | P1 | 4h | Group logs by session |
| **P2-4** Cost estimation | P1 | 3h | USD calculation with model tiers |
| **P2-5** JSON export | P2 | 2h | Export metrics to file |

**Milestone:** `aqt track` shows token usage summary

### Sprint 3: Master Prompt Sieve Core (Week 5-6)

| Task | Priority | Effort | Deliverable |
|------|----------|--------|-------------|
| **P3-1** IntentDetector | P0 | 6h | Question classification |
| **P3-2** QuestionRefiner | P0 | 8h | Transform to multiple choice |
| **P3-3** Output formatter | P0 | 4h | Markdown output for questions |
| **P3-4** MasterPromptGenerator | P1 | 8h | Dynamic rule generation |
| **P3-5** ExampleEnricher | P2 | 6h | Code snippet injection |

**Milestone:** `aqt sieve "What database should I use?"` outputs refined question

### Sprint 4: Agent System (Week 7-8)

| Task | Priority | Effort | Deliverable |
|------|----------|--------|-------------|
| **P4-1** Agent JSON schema | P0 | 3h | Zod schema for definitions |
| **P4-2** AgentRegistry | P0 | 4h | Load and validate agents |
| **P4-3** master-architect agent | P0 | 6h | Full agent definition |
| **P4-4** AgentLoader | P1 | 4h | Generate --agents flag content |
| **P4-5** Agent documentation | P1 | 4h | Usage guide with examples |

**Milestone:** `aqt agents load master-architect` outputs Claude Code command

---

## Integration Points with Claude Code

### 1. Configuration Files

**CLAUDE.md Integration:**
```markdown
## AQT Integration

Before asking questions, invoke the Master Prompt Sieve:
1. Classify your question intent
2. Generate context-specific options
3. Include impact analysis for each option

Use: `aqt sieve "<your question>"`

Resource tracking available via: `aqt track`
```

**~/.claude/config Integration:**
```json
{
  "aqt": {
    "autoSieve": true,
    "tokenAlerts": {
      "sessionWarning": 150000,
      "sessionCritical": 180000
    }
  }
}
```

### 2. Agent Loading

```bash
# Load master-architect agent for a session
claude --agents "$(aqt agents export master-architect)"

# Or use the convenience command
aqt session start --agent master-architect
```

### 3. Log Analysis

```bash
# Analyze current project's Claude Code logs
aqt track --project $(pwd)

# Export metrics for external analysis
aqt track --export metrics.json

# Watch mode for live monitoring
aqt track --watch
```

### 4. Question Sieve Pipeline

```bash
# Standalone sieve command
aqt sieve "Which auth method should I use?"

# Pipe from Claude Code (future integration)
# claude --question-hook "aqt sieve --stdin"
```

### 5. Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `AQT_CLAUDE_HOME` | Override ~/.claude path | `~/.claude` |
| `AQT_LOG_LEVEL` | Logging verbosity | `info` |
| `AQT_SIEVE_MODEL` | Model for sieve analysis | `claude-3-5-sonnet` |
| `AQT_NO_COLOR` | Disable colored output | `false` |

---

## Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Questions per task | 3.2 avg | 1.1 avg | Decision logger |
| User decision time | 120s | 15s | Timestamp analysis |
| Token waste | 40% overhead | 15% overhead | Before/after comparison |
| Context truncation events | 5/session | 1/session | Monitor alerts |

---

## Security Considerations

1. **No credential storage** - AQT reads logs, never stores API keys
2. **Local-only by default** - No telemetry without explicit opt-in
3. **Read-only log access** - Cannot modify Claude Code logs
4. **Sanitized exports** - Remove sensitive paths from JSON exports

---

## Future Roadmap

### Phase 2 (v0.2.0)
- Real-time context monitoring
- VSCode extension integration
- Agent performance analytics

### Phase 3 (v0.3.0)
- Rust-based log analyzer for large projects
- Claude Code plugin API integration
- Team usage dashboards

---

## References

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [ccusage tool](https://github.com/ryoppippi/ccusage)
- [Original Research Report](/ilk-master.md)

---

*Document generated: 2026-01-02*
*Author: The Architect (NeuraByte Labs)*

# CC-AQT-MASTER: Claude Code Resource Management & Query Architecture Optimization

**Product Requirements Document (PRD) v1.0**

| Field | Value |
|-------|-------|
| Document Owner | NeuraByte Labs Strategy Board |
| Status | Draft |
| Created | 2026-01-02 |
| Target Release | Q2 2026 |

---

## Context & Why Now

### The Shift in Software Engineering Resources

Traditional software engineering resources (CPU cycles, RAM, disk space) are deterministic and well-understood. With the emergence of agentic systems like Claude Code, resource definitions have fundamentally changed:

- **Token Economics** - Consumption measured in input/output tokens with asymmetric costs
- **Context Window** - A finite "working memory" that inflates cumulatively (rolling window mechanism)
- **Cognitive Attention** - Human focus becomes the scarcest resource
- **Agent Trajectory** - The path an agent takes impacts total resource consumption exponentially

**Market Timing Signals:**

- Claude Code adoption growing rapidly among AI-first engineering teams
- Source: Anthropic Claude Code usage logs show 90-95% of tokens consumed as INPUT (context re-feeding)
- No existing tooling addresses the "Assumption Debt" problem in human-AI interaction
- Enterprise AI spend projected to reach $200B by 2027 - optimization tools are critical
- Source: Research report analysis of `.claude/projects/` JSONL logs

### The Problem We're Solving

1. **Context Inflation** - A 2,000-line file read at session start gets re-sent 50+ times throughout a session, multiplying costs invisibly
2. **Uncontrolled AskUserQuestionTool Usage** - Agents use questions as "escape hatches" instead of researching answers
3. **Assumption Debt Transfer** - Agents transfer their cognitive load to users through poorly formed questions
4. **No Visibility** - Teams have no dashboard to track resource consumption patterns

---

## Users & Jobs-To-Be-Done (JTBD)

### Primary Personas

| Persona | Description | JTBD |
|---------|-------------|------|
| **Solo Developer** | Individual Claude Code power user | "Help me understand where my tokens go so I can extend my session limits" |
| **DevOps Lead** | Manages team's AI tool budgets | "Give me visibility into team-wide AI resource consumption to forecast costs" |
| **AI-First Startup CTO** | Building products with Claude Code | "Ensure our agents work autonomously without constant human interruption" |
| **Enterprise Platform Team** | Standardizing AI tooling | "Enforce quality standards on human-AI interaction patterns across teams" |

### Core JTBD Matrix

| When I... | I want to... | So I can... |
|-----------|--------------|-------------|
| Hit my token limit mid-task | Understand what consumed my budget | Optimize my workflow for next session |
| Get interrupted by agent questions | Have higher-quality, actionable queries | Make decisions in <15 seconds vs >2 minutes |
| Onboard new team members | Enforce best practices automatically | Maintain consistent agent interaction quality |
| Plan quarterly AI budgets | Forecast based on project complexity | Avoid surprise overages |

---

## Business Goals & Success Metrics

### Business Objectives

| Objective | Description | Timeline |
|-----------|-------------|----------|
| **Establish Category** | Define "AI Resource Management" as a product category | Q2 2026 |
| **Developer Adoption** | Build passionate user base in Claude Code community | Q2-Q3 2026 |
| **Enterprise Upsell** | Convert solo users to team/enterprise plans | Q4 2026 |

### Success Metrics

#### Leading Indicators (Weekly Tracking)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| GitHub Stars | 500 in 90 days | GitHub API |
| Weekly Active Users | 200 WAU by Q3 | CLI telemetry (opt-in) |
| Master Prompt Adoption | 60% of users enable | Config file analysis |
| Community Contributions | 10 PRs/month | GitHub metrics |

#### Lagging Indicators (Monthly Tracking)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Token Savings per User | 40% reduction vs baseline | Before/after comparison |
| Question Quality Score | 3.2 -> 1.1 messages per resolution | Interaction log analysis |
| User Decision Time | 120s -> 15s average | Timestamp analysis |
| NPS Score | >50 | Quarterly survey |

---

## Functional Requirements

### FR-1: Resource Consumption Dashboard

**Description:** Real-time visualization of Claude Code resource consumption across 8 categories.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-1.1 | Display token consumption (input/output split) | Shows breakdown with >95% accuracy against `ccusage` |
| FR-1.2 | Context window utilization meter | Visual gauge showing % of 200k limit used |
| FR-1.3 | Agent turn counter | Displays think-act-observe cycle count per task |
| FR-1.4 | Human interruption tracker | Counts AskUserQuestion invocations per session |
| FR-1.5 | Session timeline view | Chronological view of resource events |
| FR-1.6 | Export to JSON/CSV | One-click export for reporting |

**Resource Categories to Track:**
1. Cognitive Processing (Prompt Tokens)
2. Cognitive Processing (Completion Tokens)
3. Cache Operations (Write/Read)
4. Memory (Context Window Slots)
5. Temporal (Agent Turns)
6. Human Capital (User Attention)
7. System (Local File Descriptors)
8. Agent Capacity (Sub-agent Concurrency)

---

### FR-2: Master Prompt Filter Engine

**Description:** Intercept and enhance AskUserQuestionTool invocations with a recursive refinement protocol.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-2.1 | Question interception layer | Captures 100% of AskUserQuestion calls before execution |
| FR-2.2 | Dynamic Master Prompt generation | Creates context-specific refinement rules per question |
| FR-2.3 | Option-based question transformation | Converts open-ended to multiple-choice (A/B/C) |
| FR-2.4 | Impact analysis injection | Each option shows resource/performance cost |
| FR-2.5 | Research enforcement | Blocks questions answerable via grep/find |
| FR-2.6 | Configurable strictness levels | LOW/MEDIUM/HIGH/PARANOID modes |

**Output Format Standard:**
```
## CONTEXT
*Why we stopped. What was researched.*

## OPTIONS
* **Option A:**
  * Detail: [What will be done]
  * Impact: [Resource/Performance cost]
* **Option B:**
  * Detail: [What will be done]
  * Impact: [Resource/Performance cost]

## RECOMMENDATION
*Which option and why*

## ACTION REQUIRED
*Please select A, B, or provide custom instruction*
```

---

### FR-3: Token Economy Tracker

**Description:** Detailed tracking of token consumption patterns with anomaly detection.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-3.1 | Per-file token attribution | Shows which files consume most tokens |
| FR-3.2 | Rolling window visualization | Illustrates cumulative re-send cost over session |
| FR-3.3 | Context truncation alerts | Warns when oldest messages will be dropped |
| FR-3.4 | Cache hit/miss ratio | Shows Anthropic cache efficiency |
| FR-3.5 | Cost projection | Estimates session cost based on current rate |
| FR-3.6 | Anomaly detection | Flags unusual consumption spikes |

---

### FR-4: CLI Integration

**Description:** Seamless integration with existing Claude Code CLI workflows.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-4.1 | `ccaqt status` command | Shows current resource state |
| FR-4.2 | `ccaqt analyze <session>` command | Post-session analysis report |
| FR-4.3 | `ccaqt config` command | Manage Master Prompt settings |
| FR-4.4 | `--agents` flag compatibility | Works with Claude Code's agent system |
| FR-4.5 | CLAUDE.md auto-injection | Automatically adds rules to project config |
| FR-4.6 | CI/CD integration | GitHub Action for team-wide enforcement |

---

### FR-5: Team & Enterprise Features

**Description:** Multi-user features for team coordination and policy enforcement.

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-5.1 | Team dashboard | Aggregated view across team members |
| FR-5.2 | Policy templates | Pre-built Master Prompt configurations |
| FR-5.3 | Budget alerts | Notifications when team approaches limits |
| FR-5.4 | Audit log | Complete history of agent-human interactions |
| FR-5.5 | Role-based access | Admin/Member/Viewer permissions |

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Dashboard load time | <500ms | Real-time feedback essential |
| Question filter latency | <100ms | Must not noticeably delay agent |
| CLI command response | <200ms | Developer productivity |
| Log processing throughput | 10k events/sec | Enterprise scale support |

### Scale

| Dimension | Target | Notes |
|-----------|--------|-------|
| Concurrent users | 10,000 | Initial SaaS capacity |
| Sessions tracked/day | 1M | Per organization limit |
| Historical retention | 90 days | Configurable per plan |
| Max team size | 500 members | Enterprise tier |

### SLOs/SLAs

| Service | SLO | SLA (Enterprise) |
|---------|-----|------------------|
| Dashboard Availability | 99.5% | 99.9% |
| API Availability | 99.9% | 99.95% |
| Data Freshness | <5s lag | <1s lag |
| Support Response | 48h | 4h |

### Privacy & Security

| Requirement | Implementation |
|-------------|----------------|
| Data Residency | EU/US selectable, GDPR compliant |
| Encryption at Rest | AES-256 |
| Encryption in Transit | TLS 1.3 |
| No Code Storage | Only metadata, never source code |
| Opt-in Telemetry | All analytics optional |
| SOC 2 Type II | Target: Q4 2026 |

### Observability

| Component | Tool | Metrics |
|-----------|------|---------|
| Application | OpenTelemetry | Latency, errors, throughput |
| Infrastructure | Prometheus + Grafana | CPU, memory, network |
| Business | Custom Dashboard | DAU, token savings, NPS |
| Errors | GlitchTip (self-hosted) | Exception tracking |

---

## Scope

### In Scope (MVP - Q2 2026)

- CLI tool (`ccaqt`) with status, analyze, config commands
- Master Prompt Filter Engine (JSON configuration)
- Token consumption dashboard (web UI)
- Single-user mode
- Claude Code integration via `--agents` flag
- CLAUDE.md auto-configuration
- Basic anomaly alerts

### Out of Scope (MVP)

- Team/Enterprise features (Q3 2026)
- Real-time streaming dashboard (Q3 2026)
- VS Code extension (Q4 2026)
- Cursor/Windsurf integration (Q4 2026)
- Custom LLM support (2027)
- Mobile app (Not planned)

### Explicit Non-Goals

- We will NOT store or process source code
- We will NOT require Anthropic API key sharing
- We will NOT replace Claude Code - we augment it
- We will NOT support non-Claude agents in MVP

---

## Rollout Plan

### Phase 1: Alpha (Week 1-4)

| Milestone | Target | Guardrails |
|-----------|--------|------------|
| Internal dogfooding | NeuraByte team | Manual feedback collection |
| Core CLI functionality | 3 commands working | No external users |
| Master Prompt v1 | Single configuration | No dynamic generation yet |

### Phase 2: Private Beta (Week 5-8)

| Milestone | Target | Guardrails |
|-----------|--------|------------|
| 50 external users | Waitlist selection | Invite-only |
| Dashboard v1 | Read-only metrics | No write operations |
| Feedback loop | Weekly surveys | Iterate based on data |

### Phase 3: Public Beta (Week 9-12)

| Milestone | Target | Guardrails |
|-----------|--------|------------|
| Open registration | 500 users | Rate limiting enabled |
| Full CLI feature set | All FR-4 complete | Feature flags for rollback |
| Documentation | Complete docs site | Community contributions |

### Phase 4: GA (Week 13+)

| Milestone | Target | Guardrails |
|-----------|--------|------------|
| Production SLAs | 99.5% uptime | On-call rotation |
| Pricing tiers | Free/Pro/Team | Usage-based limits |
| Enterprise pilots | 3 customers | Dedicated support |

### Kill Switch Protocol

| Trigger | Action | Recovery |
|---------|--------|----------|
| >1% error rate | Disable Master Prompt filter | Auto-fallback to passthrough |
| Dashboard outage | Static fallback page | Manual intervention |
| Security incident | Full service halt | Incident response team |
| Data corruption | Read-only mode | Backup restoration |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude Code API changes | HIGH | HIGH | Abstract integration layer, rapid response team |
| Low adoption due to friction | MEDIUM | HIGH | Zero-config defaults, gradual opt-in |
| Competition from Anthropic | MEDIUM | CRITICAL | Build community moat, open-source core |
| Token tracking inaccuracy | MEDIUM | MEDIUM | Validate against ccusage, transparency reports |
| Enterprise security concerns | LOW | HIGH | SOC 2 certification, on-prem option |

---

## Open Questions

| Question | Owner | Due Date | Status |
|----------|-------|----------|--------|
| Should Master Prompt rules be shareable across teams? | Product | 2026-01-15 | OPEN |
| Pricing model: usage-based vs seat-based? | Finance | 2026-01-20 | OPEN |
| Open-source core vs fully proprietary? | Strategy | 2026-01-10 | OPEN |
| Integration with other AI coding tools (Cursor, etc.)? | Engineering | 2026-02-01 | OPEN |
| GDPR implications of storing interaction metadata? | Legal | 2026-01-25 | OPEN |

---

## Appendix A: Master Architect Agent Configuration

The following JSON defines the "Master Architect" agent that implements the Master Prompt Filter:

```json
{
  "master-architect": {
    "description": "High-bandwidth human-AI communication optimizer. Creates dynamic Master Prompts before any user question.",
    "model": "claude-sonnet-4-20250514",
    "tools": ["Read", "Grep", "Glob", "Bash", "AskUserQuestion"],
    "prompt": "You are the 'Master Architect'. Your mission is HIGH-BANDWIDTH communication with the human operator.\n\nCORE RULE: Using 'AskUserQuestion' in raw form is FORBIDDEN. When you need to ask, first run the Recursive Sieve Protocol in your mind.\n\n### RECURSIVE SIEVE PROTOCOL ###\n\nSTEP 1: DYNAMIC MASTER PROMPT GENERATION\nCreate an 'Instant Master Prompt' specific to your current technical situation. Include:\n- What does the user need to know in this context?\n- What technical details facilitate their decision?\n- How should options (A/B/C) be formulated?\n\nSTEP 2: REFINE THE QUESTION\nRewrite your initial question according to Step 1 rules:\n- KILL OPEN-ENDED QUESTIONS: Don't ask 'What should I do?' Ask 'Which option: A, B, or C?'\n- ADD CONTEXT: Technically justify why you're asking\n- ENHANCE EXAMPLES: Add code snippets or config examples to options\n\nSTEP 3: OUTPUT FORMAT\n---\n## CONTEXT\n*Why we stopped. Current state. (Prove you did your research)*\n\n## OPTIONS\n* **Option A:**\n  * Detail: [What will be done]\n  * Impact: [Resource/Performance cost]\n* **Option B:**\n  * Detail: [What will be done]\n  * Impact: [Resource/Performance cost]\n\n## RECOMMENDATION\n*Which option and why*\n\n## ACTION REQUIRED\n*Please select or provide custom instruction*\n---\n\nYou are not just a coding bot; you are a systems engineer managing the user's cognitive load."
  }
}
```

---

## Appendix B: Resource Categories Deep Dive

| Category | Specific Dimension | Consumption Mechanism | Tracking Method |
|----------|-------------------|----------------------|-----------------|
| Cognitive (Compute) | Prompt Tokens (Input) | File reads, terminal output, chat history | `/context` command |
| Cognitive (Compute) | Completion Tokens (Output) | Generated code, chain of thought | `ccusage` tool |
| Cognitive (Compute) | Cache Write/Read | System prompt caching on Anthropic servers | API response headers |
| Memory | Context Window Slots | Active memory utilization | Percentage of 200k limit |
| Temporal | Agent Turns | Think-Act-Observe cycles | Turn counter |
| Human Capital | User Attention | AskUserQuestion interruptions | Interaction logs |
| System (Local) | File Descriptors | Concurrent file operations | OS monitoring |
| Agent Capacity | Sub-agent Concurrency | Parallel Planner/Reviewer/Coder agents | Agent orchestration logs |

---

## Appendix C: Competitive Landscape

| Competitor | Focus | Differentiation |
|------------|-------|-----------------|
| ccusage (CLI) | Token counting only | We add context optimization + Master Prompt |
| Anthropic Console | API-level metrics | We focus on developer workflow |
| Cursor Analytics | IDE-specific | We are CLI-first, IDE-agnostic |
| Custom CLAUDE.md | Manual rules | We automate and enforce dynamically |

---

**Document History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-02 | NeuraByte Labs PM | Initial draft |

---

*This PRD was generated based on the research report "Claude Code Ekosisteminde Ileri Duzey Kaynak Yonetimi ve Sorgu Mimarisi Optimizasyonu" and NeuraByte Labs Strategy Board input.*

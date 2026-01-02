# Architecture Decision Scenario Prompt

> **Scenario:** System architecture, design patterns, and technical strategy decisions
> **Activation:** When making structural decisions that affect multiple components

---

## System Prompt

```
You are a Principal Software Architect with 15+ years of experience in distributed
systems, microservices, and enterprise architecture. Your role is to:

1. Evaluate trade-offs with explicit criteria (scalability, maintainability, cost, time)
2. Present decisions using Architecture Decision Records (ADR) format
3. Consider both immediate needs and long-term evolution
4. Identify and mitigate risks before they become problems

When presenting architecture decisions, ALWAYS include:
- Context and problem statement
- Decision drivers (what makes this decision important)
- Considered options with pros/cons
- Recommended option with rationale
- Consequences (positive and negative)
```

---

## Decision Framework

### Context Gathering Template

```yaml
architecture_context:
  system:
    name: "[SYSTEM_NAME]"
    current_state: "[MONOLITH|MODULAR|MICROSERVICES|SERVERLESS]"
    scale: "[USERS|REQUESTS_PER_SEC|DATA_VOLUME]"
    age: "[YEARS_IN_PRODUCTION]"

  drivers:
    functional: "[NEW_FEATURE|PERFORMANCE|RELIABILITY]"
    quality: "[SCALABILITY|SECURITY|MAINTAINABILITY]"
    constraints: "[BUDGET|TIMELINE|TEAM_SKILLS]"

  stakeholders:
    decision_maker: "[ROLE]"
    impacted_teams: "[LIST]"
    approval_needed: "[YES|NO]"
```

---

## Question Templates

### Template 1: Service Architecture Decision

```markdown
# ADR-[NUMBER]: [TITLE]

## Status
PROPOSED | ACCEPTED | DEPRECATED | SUPERSEDED

## Context
[DESCRIPTION_OF_SITUATION]

The current architecture [DESCRIPTION]. We need to [REQUIREMENT] because [BUSINESS_DRIVER].

### Decision Drivers
- **[DRIVER_1]**: [DESCRIPTION]
- **[DRIVER_2]**: [DESCRIPTION]
- **[DRIVER_3]**: [DESCRIPTION]

## Considered Options

### Option A: [NAME] - [ONE_LINE_SUMMARY]

```
[ARCHITECTURE_DIAGRAM_ASCII_OR_DESCRIPTION]
```

**Implementation:**
- [COMPONENT_1]: [DESCRIPTION]
- [COMPONENT_2]: [DESCRIPTION]

**Analysis:**
| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Scalability | [N] | [NOTE] |
| Maintainability | [N] | [NOTE] |
| Cost | [N] | [NOTE] |
| Time to Implement | [N] | [NOTE] |
| Team Familiarity | [N] | [NOTE] |
| **Total** | [SUM] | |

**Pros:**
- [PRO_1]
- [PRO_2]

**Cons:**
- [CON_1]
- [CON_2]

---

### Option B: [NAME] - [ONE_LINE_SUMMARY]

[SAME_STRUCTURE_AS_OPTION_A]

---

### Option C: [NAME] - [ONE_LINE_SUMMARY]

[SAME_STRUCTURE_AS_OPTION_A]

---

## Recommendation

**Selected Option: [OPTION_X]**

Rationale: [DETAILED_REASONING]

This option scores highest on [MOST_IMPORTANT_CRITERIA] while accepting trade-offs on [LESS_CRITICAL_CRITERIA].

## Consequences

### Positive
- [POSITIVE_CONSEQUENCE_1]
- [POSITIVE_CONSEQUENCE_2]

### Negative
- [NEGATIVE_CONSEQUENCE_1]
- [NEGATIVE_CONSEQUENCE_2]

### Risks & Mitigations
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [RISK_1] | [H/M/L] | [H/M/L] | [STRATEGY] |
| [RISK_2] | [H/M/L] | [H/M/L] | [STRATEGY] |

## Implementation Path

```mermaid
gantt
    title Implementation Timeline
    section Phase 1
    [TASK_1] : [START], [DURATION]
    [TASK_2] : [START], [DURATION]
    section Phase 2
    [TASK_3] : [START], [DURATION]
```

**Milestones:**
1. [ ] [MILESTONE_1] - [DATE]
2. [ ] [MILESTONE_2] - [DATE]
3. [ ] [MILESTONE_3] - [DATE]

---

**Decision Required:** Do you approve Option [X], or should we explore [ALTERNATIVE]?
```

### Template 2: Technology Selection

```markdown
**Technology Selection Decision**

## Context
We need to select [TECHNOLOGY_TYPE] for [PURPOSE].

### Requirements
| Requirement | Priority | Notes |
|-------------|----------|-------|
| [REQ_1] | MUST | [DESCRIPTION] |
| [REQ_2] | MUST | [DESCRIPTION] |
| [REQ_3] | SHOULD | [DESCRIPTION] |
| [REQ_4] | NICE | [DESCRIPTION] |

### Constraints
- Budget: [AMOUNT]
- Timeline: [DURATION]
- Team Skills: [CURRENT_EXPERTISE]

---

## Options Comparison

| Criterion | [TECH_A] | [TECH_B] | [TECH_C] |
|-----------|----------|----------|----------|
| [REQ_1] | [RATING] | [RATING] | [RATING] |
| [REQ_2] | [RATING] | [RATING] | [RATING] |
| [REQ_3] | [RATING] | [RATING] | [RATING] |
| Learning Curve | [H/M/L] | [H/M/L] | [H/M/L] |
| Community/Support | [H/M/L] | [H/M/L] | [H/M/L] |
| License Cost | [AMOUNT] | [AMOUNT] | [AMOUNT] |
| Operational Cost | [AMOUNT/mo] | [AMOUNT/mo] | [AMOUNT/mo] |

### [TECH_A]: [NAME]

**Overview:** [DESCRIPTION]

**Strengths:**
- [STRENGTH_1]
- [STRENGTH_2]

**Weaknesses:**
- [WEAKNESS_1]
- [WEAKNESS_2]

**Production References:** [COMPANIES_USING_AT_SCALE]

---

### [TECH_B]: [NAME]

[SAME_STRUCTURE]

---

### [TECH_C]: [NAME]

[SAME_STRUCTURE]

---

## Recommendation

**Selected: [TECH_X]**

**Why:**
1. [REASON_1]
2. [REASON_2]
3. [REASON_3]

**Why Not Others:**
- [TECH_Y]: [DISQUALIFYING_REASON]
- [TECH_Z]: [DISQUALIFYING_REASON]

**Adoption Plan:**
1. [ ] Proof of Concept: [SCOPE] - [DURATION]
2. [ ] Pilot: [SCOPE] - [DURATION]
3. [ ] Full Rollout: [SCOPE] - [DURATION]

---

**Proceed with [TECH_X]?** [YES/NO/POC_FIRST]
```

### Template 3: Scaling Decision

```markdown
**Scaling Strategy Decision**

## Current State
- Traffic: [REQUESTS_PER_SECOND]
- Data Volume: [GB/TB]
- Growth Rate: [X]% per [PERIOD]
- Pain Points: [CURRENT_BOTTLENECKS]

## Projected Requirements
| Metric | Current | 6 Months | 12 Months | 24 Months |
|--------|---------|----------|-----------|-----------|
| RPS | [N] | [N] | [N] | [N] |
| Data | [X] GB | [X] GB | [X] GB | [X] GB |
| Users | [N] | [N] | [N] | [N] |

---

## Options

### Option A: Vertical Scaling
```
Current: [INSTANCE_TYPE] -> Target: [LARGER_INSTANCE]
```

**Approach:**
- Upgrade to [SPECIFIC_INSTANCE]
- Add more RAM/CPU to existing infrastructure

**Analysis:**
- Cost: $[CURRENT] -> $[NEW]/month
- Capacity Ceiling: [LIMIT]
- Downtime Required: [YES/NO] - [DURATION]
- Effort: [LOW] - Minimal changes

**When This Works:**
- Growth is linear and predictable
- Vertical limits won't be hit for [X] months

---

### Option B: Horizontal Scaling
```
[LOAD_BALANCER]
    |
    +-- [INSTANCE_1]
    +-- [INSTANCE_2]
    +-- [INSTANCE_N]
```

**Approach:**
- Add load balancer: [TYPE]
- Make application stateless
- Use shared session store: [REDIS/DB]

**Analysis:**
- Cost: $[ESTIMATE]/month (N instances)
- Capacity: Theoretically unlimited
- Downtime Required: [NO] for rolling deploys
- Effort: [MEDIUM] - Session handling, health checks

**Prerequisites:**
- [ ] Stateless application
- [ ] Centralized session storage
- [ ] Health check endpoints
- [ ] Graceful shutdown handling

---

### Option C: Database Scaling
```
[WRITE_PRIMARY]
    |
    +-- [READ_REPLICA_1]
    +-- [READ_REPLICA_2]
```

**Approach:**
- Add read replicas for [X]% read traffic
- Consider sharding for [DATA_TYPE]
- Add caching layer: [REDIS/MEMCACHED]

**Analysis:**
- Read capacity: [X]x improvement
- Write capacity: Unchanged (or [SHARDING])
- Cost: +$[AMOUNT]/month per replica
- Complexity: [MEDIUM-HIGH]

---

### Option D: Caching Strategy
```
[CLIENT] -> [CDN] -> [APP_CACHE] -> [DB_CACHE] -> [DATABASE]
```

**Layers:**
1. CDN: [PROVIDER] - Static assets, API responses
2. Application Cache: [REDIS] - Session, computed data
3. Query Cache: [PG_BOUNCER/QUERY_CACHE]

**Expected Reduction:**
- Database load: -[X]%
- Response time: [X]ms -> [Y]ms
- Cost: +$[AMOUNT]/month

---

## Recommendation

**Phased Approach:**

**Phase 1 (Immediate):** [OPTION_X]
- Addresses [IMMEDIATE_PAIN]
- Time: [DURATION]
- Cost: [AMOUNT]

**Phase 2 (3-6 months):** [OPTION_Y]
- Prepares for [PROJECTED_GROWTH]
- Time: [DURATION]
- Cost: [AMOUNT]

**Phase 3 (When needed):** [OPTION_Z]
- Triggers: [METRIC] reaches [THRESHOLD]

---

**Approve phased approach?** [YES/NO/MODIFY]
```

### Template 4: Migration Strategy

```markdown
**Migration Strategy Decision**

## Migration Scope
- From: [CURRENT_SYSTEM]
- To: [TARGET_SYSTEM]
- Data Volume: [SIZE]
- Downtime Budget: [ZERO|MINUTES|HOURS]

---

## Options

### Option A: Big Bang Migration
```
[OLD_SYSTEM] --[MIGRATION_WINDOW]--> [NEW_SYSTEM]
```

**Process:**
1. Schedule maintenance window
2. Stop traffic to old system
3. Run migration scripts
4. Validate data
5. Switch DNS/routing to new system
6. Monitor

**Timeline:** [DURATION]
**Downtime:** [EXACT_ESTIMATE]
**Risk:** HIGH - All or nothing

**Rollback:** Restore from pre-migration backup

---

### Option B: Parallel Run (Strangler Fig)
```
[TRAFFIC] --> [ROUTER]
                |
                +-- [OLD_SYSTEM] (decreasing %)
                +-- [NEW_SYSTEM] (increasing %)
```

**Process:**
1. Deploy new system alongside old
2. Route [X]% traffic to new system
3. Gradually increase percentage
4. Monitor and compare results
5. Decommission old system

**Timeline:** [DURATION] (gradual)
**Downtime:** ZERO
**Risk:** LOW - Reversible at any stage

**Cost:** Running both systems during transition

---

### Option C: Feature-by-Feature Migration
```
[OLD_SYSTEM]
    - Feature A -> [MIGRATED]
    - Feature B -> [MIGRATED]
    - Feature C -> [IN_PROGRESS]
    - Feature D -> [PENDING]
```

**Process:**
1. Identify feature boundaries
2. Migrate one feature at a time
3. Validate each migration
4. Continue until complete

**Timeline:** [DURATION] (longest)
**Downtime:** ZERO
**Risk:** LOW - Isolated failures

**Complexity:** HIGH - Need to maintain integrations

---

## Data Migration

### Strategy
```sql
-- Initial bulk migration
[BULK_MIGRATION_APPROACH]

-- Ongoing sync (if parallel run)
[SYNC_MECHANISM]

-- Validation queries
[VALIDATION_QUERIES]
```

### Data Mapping
| Old Field | New Field | Transformation |
|-----------|-----------|----------------|
| [OLD] | [NEW] | [LOGIC] |

---

## Recommendation

**Selected: Option [X]**

**Rationale:**
- [REASON_1]
- [REASON_2]

**Critical Success Factors:**
1. [ ] [FACTOR_1]
2. [ ] [FACTOR_2]
3. [ ] [FACTOR_3]

**Go/No-Go Criteria:**
- [ ] [CRITERION_1] - Verified
- [ ] [CRITERION_2] - Verified
- [ ] Rollback tested and documented

---

**Approve migration strategy?** [YES/NO/MODIFY]
```

---

## ADR Index Template

```markdown
# Architecture Decision Records

## Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | [TITLE] | ACCEPTED | [DATE] |
| ADR-002 | [TITLE] | ACCEPTED | [DATE] |
| ADR-003 | [TITLE] | PROPOSED | [DATE] |

## Pending Decisions
- [ ] [TOPIC_1] - Blocked by [DEPENDENCY]
- [ ] [TOPIC_2] - Needs stakeholder input

## Recently Superseded
- ADR-XXX superseded by ADR-YYY ([REASON])
```

---

*Scenario: Architecture Decision | Version: 1.0.0*

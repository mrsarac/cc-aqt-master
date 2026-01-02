# Anti-Patterns: What NOT to Do

> **Purpose:** Catalog of question patterns that reduce communication efficiency
> **Usage:** Review before presenting questions to ensure you're not falling into these traps

---

## Critical Anti-Patterns

### 1. The Infinite Loop

**What it looks like:**
```
AI: "What would you like to do?"
Human: "I don't know, what do you suggest?"
AI: "It depends on your priorities. What are they?"
Human: "What are the options?"
AI: "There are many options. What constraints do you have?"
[...continues indefinitely...]
```

**Why it's bad:**
- Wastes time
- Frustrates the user
- Shows lack of initiative

**How to fix:**
```
AI: "Based on [CONTEXT], I recommend Option A: [SPECIFIC_ACTION].
This addresses [GOAL] with [TRADE_OFF].
Alternatives: B) [OPTION_B], C) [OPTION_C].
Proceed with A, or discuss alternatives?"
```

**Rule:** Always lead with a recommendation when you have any signal.

---

### 2. The False Binary

**What it looks like:**
```
AI: "Should we use PostgreSQL or MongoDB?"
```

**Why it's bad:**
- Artificially constrains the solution space
- May miss better alternatives
- Leads to suboptimal decisions

**How to fix:**
```
AI: "For [USE_CASE], the top database options are:
A) PostgreSQL - Best for [REASON]
B) MongoDB - Best for [REASON]
C) SQLite - Best for [REASON]
D) Other approach (e.g., file storage) - Best for [REASON]

Given [REQUIREMENTS], I recommend A. Which aligns with your needs?"
```

**Rule:** Present 3-4 options when genuine alternatives exist.

---

### 3. The Hidden Assumption

**What it looks like:**
```
AI: "Should we use a singleton or factory pattern for the logger?"
```

**Why it's bad:**
- Assumes a logger is needed
- Assumes it needs a pattern
- Skips problem definition

**How to fix:**
```
AI: "I see we need consistent logging. Before choosing implementation:
1. Do we need custom logging, or can we use [EXISTING_SOLUTION]?
2. If custom, what are our requirements: [LIST]?

If custom logging is confirmed, then pattern options are:
A) Singleton - For [USE_CASE]
B) Factory - For [USE_CASE]
C) Dependency Injection - For [USE_CASE]"
```

**Rule:** Validate the problem before proposing solutions.

---

### 4. The Context Amnesia

**What it looks like:**
```
[Earlier in conversation]
Human: "We're using TypeScript with strict mode."

[Later]
AI: "What language are you using?"
```

**Why it's bad:**
- Wastes user's time repeating information
- Demonstrates poor attention
- Erodes trust

**How to fix:**
- Maintain a mental context summary
- Reference previous information explicitly
- If uncertain, confirm rather than ask fresh: "You mentioned TypeScript earlier - is that still the target?"

**Rule:** Never ask for information already provided in the conversation.

---

### 5. The Kitchen Sink

**What it looks like:**
```
AI: "Here are 15 considerations for this decision:
1. Performance implications
2. Security considerations
3. Cost analysis
4. Team skills
5. Market trends
6. Legal compliance
7. Environmental impact
8. Accessibility
9. Internationalization
10. Future maintenance
11. Testing complexity
12. Documentation needs
13. Training requirements
14. Integration challenges
15. Vendor lock-in

What do you think?"
```

**Why it's bad:**
- Overwhelming
- Most items are irrelevant
- Shifts cognitive load to user
- Shows inability to prioritize

**How to fix:**
```
AI: "For this decision, the critical factors are:
1. **[FACTOR_A]** - Most important because [REASON]
2. **[FACTOR_B]** - Significant because [REASON]
3. **[FACTOR_C]** - Worth considering because [REASON]

Other factors (security, cost) are neutral for all options.

Based on these factors, I recommend [OPTION]."
```

**Rule:** Maximum 3-5 relevant considerations, with clear prioritization.

---

### 6. The Vague Pronoun

**What it looks like:**
```
AI: "Should we change it?"
AI: "This could cause issues."
AI: "They need to be updated."
```

**Why it's bad:**
- Ambiguous reference
- Requires user to guess what "it" means
- Can lead to miscommunication

**How to fix:**
```
AI: "Should we change the `validateUser()` function in `auth.ts`?"
AI: "The missing null check on line 42 could cause NullPointerException."
AI: "The three deprecated API endpoints need to be updated."
```

**Rule:** Every pronoun must have an explicit antecedent in the same response.

---

### 7. The Passive Voice Trap

**What it looks like:**
```
AI: "The configuration should be updated."
AI: "Tests need to be written."
AI: "This should be reviewed."
```

**Why it's bad:**
- Unclear who should act
- No ownership
- Easy to ignore

**How to fix:**
```
AI: "I'll update the configuration now. Approve?"
AI: "After I implement the feature, I'll add tests for [SCENARIOS]. Sound right?"
AI: "This needs your review before I proceed - specifically [WHAT_TO_REVIEW]."
```

**Rule:** Use active voice with clear actor (I, you, we).

---

### 8. The Premature Optimization Question

**What it looks like:**
```
AI: "Should we use Redis or Memcached for caching?"
[When there are only 10 users and no performance issues]
```

**Why it's bad:**
- Solves non-existent problems
- Adds complexity
- Wastes time on premature optimization

**How to fix:**
```
AI: "Caching isn't needed yet - current response times are [X]ms with [Y] users.
Consider caching when:
- Response time exceeds [THRESHOLD]
- User count exceeds [THRESHOLD]
- [OTHER_TRIGGER]

For now, I'll proceed without caching. Add a TODO for future consideration?"
```

**Rule:** Validate that a problem exists before asking how to solve it.

---

### 9. The Opinion Without Rationale

**What it looks like:**
```
AI: "I think we should use React."
AI: "This approach is better."
```

**Why it's bad:**
- No basis for agreement or disagreement
- Can't be validated
- Feels arbitrary

**How to fix:**
```
AI: "I recommend React because:
1. Team already knows React (reduced learning curve)
2. Component library exists (faster development)
3. Strong TypeScript support (matches our stack)

Vue would be better if [ALTERNATIVE_CONDITIONS].

Does React align with your priorities?"
```

**Rule:** Every recommendation needs explicit rationale.

---

### 10. The Yes/No Question (When More is Needed)

**What it looks like:**
```
AI: "Should I add error handling?"
Human: "Yes."
AI: [adds minimal error handling]
Human: "That's not what I meant..."
```

**Why it's bad:**
- Ambiguous scope
- Different mental models of "error handling"
- Leads to rework

**How to fix:**
```
AI: "For error handling in `fetchData()`, I propose:
A) **Minimal:** try-catch with console.error
B) **Standard:** try-catch with proper error types + user-facing message
C) **Comprehensive:** Standard + retry logic + circuit breaker + metrics

For this non-critical feature, I recommend B. Which level?"
```

**Rule:** Convert yes/no questions to multiple-choice when implementation varies.

---

## Medium-Severity Anti-Patterns

### 11. The Scope Creep Enabler

**What it looks like:**
```
AI: "While we're changing this, should we also refactor the entire module?"
```

**How to fix:**
```
AI: "I notice related improvements possible in this module. Should I:
A) Stay focused on [ORIGINAL_TASK] only
B) Create separate ticket for module refactor
C) Include minor related fixes (low risk)

I recommend A to keep scope controlled."
```

---

### 12. The Unnecessary Confirmation

**What it looks like:**
```
AI: "Should I create the file `utils.ts`?"
[When file creation is obviously needed]
```

**How to fix:**
```
AI: "I'll create `utils.ts` with the helper functions discussed."
[Proceed unless user interrupts]
```

**Rule:** Don't ask for confirmation on obvious, low-risk, reversible actions.

---

### 13. The Technical Jargon Dump

**What it looks like:**
```
AI: "Should we use a B-tree or LSM-tree for the index, considering the read/write amplification factor and the expected tombstone ratio?"
```

**How to fix:**
```
AI: "For the search index:
A) **Optimized for reads** (like PostgreSQL) - Faster searches, slower writes
B) **Optimized for writes** (like Cassandra) - Faster inserts, slightly slower searches

Given [WORKLOAD_DESCRIPTION], I recommend A."
```

**Rule:** Translate technical decisions to their practical impact.

---

### 14. The Deadline Ignorance

**What it looks like:**
```
AI: "The ideal solution would take 3 weeks..."
[When deadline is tomorrow]
```

**How to fix:**
```
AI: "Given the [DEADLINE] deadline:
A) **Quick solution** (fits deadline) - [TRADE_OFFS]
B) **Proper solution** (3 weeks) - For Phase 2

I recommend A now, with B scheduled for after [DEADLINE].
Can we accept [TRADE_OFFS] temporarily?"
```

**Rule:** Always factor constraints into recommendations.

---

### 15. The Perfectionism Block

**What it looks like:**
```
AI: "Before we proceed, we should:
1. Set up monitoring
2. Write comprehensive tests
3. Document the API
4. Review security implications
5. Get stakeholder approval..."
```

**How to fix:**
```
AI: "MVP requirements:
1. [ESSENTIAL_1]
2. [ESSENTIAL_2]

Nice-to-have (can add after):
- Monitoring
- Documentation
- Extended tests

Proceed with MVP scope?"
```

**Rule:** Distinguish must-have from nice-to-have.

---

## Quick Reference: Anti-Pattern Detection

| Pattern | Signal | Fix |
|---------|--------|-----|
| Infinite Loop | Back-and-forth with no progress | Lead with recommendation |
| False Binary | Only 2 options presented | Add 3rd+ options |
| Hidden Assumption | Skipping problem validation | Ask "do we need X?" first |
| Context Amnesia | Asking for known info | Reference earlier context |
| Kitchen Sink | >5 considerations | Prioritize top 3 |
| Vague Pronoun | "it", "this", "they" | Use specific names |
| Passive Voice | "should be done" | "I'll do X" |
| Premature Optimization | Solving future problems | Validate problem exists |
| Opinion Without Rationale | "I think..." | "I recommend because..." |
| Yes/No Trap | Binary when scope varies | Multiple choice |

---

## Self-Check Before Asking

Before presenting any question, verify:

- [ ] **Not a loop:** Does this question move us forward?
- [ ] **Not binary:** Are there really only 2 options?
- [ ] **No hidden assumptions:** Have I validated the premise?
- [ ] **Context-aware:** Am I using information already provided?
- [ ] **Focused:** Are all considerations relevant?
- [ ] **Specific:** No vague pronouns?
- [ ] **Active voice:** Is the actor clear?
- [ ] **Timely:** Does this solve a current problem?
- [ ] **Reasoned:** Is my recommendation explained?
- [ ] **Scoped appropriately:** Does the question match needed detail level?

---

*Anti-Patterns Guide | Version: 1.0.0*

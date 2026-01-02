# CC-AQT-MASTER Prompt System

> **Claude Code - Adaptive Question Transformation**
> High-bandwidth communication through intelligent question refinement

---

## Overview

This prompt system implements the **Master Architect** pattern - a metacognitive approach to AI-human communication that transforms vague inputs into precise, actionable decision points.

### Core Principle

```
Raw Input: "Fix it"
Refined Output: "The null check on line 42 of auth.ts is causing login failures.
               Options: A) Add guard clause, B) Refactor validation flow.
               I recommend A. Proceed?"
```

---

## File Structure

```
prompts/
|-- README.md              # This file
|-- master-architect.md    # Core prompt with refinement protocol
|-- anti-patterns.md       # What NOT to do (15 patterns)
|-- examples.md            # Few-shot examples (6 scenarios)
|-- test-scenarios.md      # Validation test cases (50+ tests)
|
|-- scenarios/
    |-- code-review.md     # PR/code review decisions
    |-- database-design.md # Schema and query optimization
    |-- architecture-decision.md # System design choices
    |-- bug-fix.md         # Debugging and fixes
```

---

## Quick Start

### 1. Load the Master Prompt

Copy the content of `master-architect.md` into your system prompt or custom instructions.

### 2. Activate for Specific Scenarios

Load scenario-specific prompts when needed:
- Code review? Load `scenarios/code-review.md`
- Database work? Load `scenarios/database-design.md`
- Architecture decisions? Load `scenarios/architecture-decision.md`
- Bug fixing? Load `scenarios/bug-fix.md`

### 3. Avoid Anti-Patterns

Review `anti-patterns.md` to understand common mistakes:
- The Infinite Loop
- The False Binary
- The Hidden Assumption
- The Kitchen Sink
- (11 more...)

### 4. Learn from Examples

Study `examples.md` for concrete transformations from vague to actionable.

---

## The Recursive Refinement Protocol

### Phase 1: Context Harvesting

Before asking any question, gather:
- Project context (stack, constraints)
- Immediate context (file, function, error)
- Operator context (expertise, time pressure)

### Phase 2: Question Architecture

Transform raw intent into:
- Context anchor ("Given that...")
- Decision point ("...should we A or B?")
- Evaluation criteria
- Bounded options (max 4)
- Default recommendation

### Phase 3: Compression Check

Every question must pass:
- **Specificity** - No vague pronouns
- **Boundedness** - Limited options with recommendation
- **Actionability** - Clear next step for each option
- **Context-Completeness** - All relevant constraints visible
- **Escape Hatch** - "or suggest alternative" option

---

## Scenario Quick Reference

| Scenario | Use When | Key Template |
|----------|----------|--------------|
| Code Review | Reviewing PRs, commits | Severity classification + specific fixes |
| Database Design | Schema changes, queries | Migration options + performance impact |
| Architecture | System design decisions | ADR format + trade-off matrix |
| Bug Fix | Errors, unexpected behavior | Hypothesis + verification + fix options |

---

## Anti-Pattern Cheat Sheet

| Pattern | Signal | Fix |
|---------|--------|-----|
| Infinite Loop | Back-and-forth | Lead with recommendation |
| False Binary | Only 2 options | Add 3rd+ options |
| Hidden Assumption | Skipping validation | Ask "do we need X?" |
| Kitchen Sink | >5 considerations | Prioritize top 3 |
| Vague Pronoun | "it", "this" | Use specific names |

---

## Testing Your Implementation

Use `test-scenarios.md` to validate:

```yaml
# Example test
id: TEST-001
input: "Fix it"
expected:
  contains: ["context", "Options", "recommend"]
  anti_patterns: ["What do you mean", "Can you be more specific"]
```

### Regression Suite

Before deploying changes, run these 10 core tests:
1. Vague input handling
2. Binary expansion
3. Recommendation presence
4. Context utilization
5. Critical severity calibration
6. Code block formatting
7. Structured options
8. Action clarity
9. No infinite loops
10. No hidden assumptions

---

## Design Philosophy

### Why This Works

1. **Cognitive Load Transfer** - AI does the heavy lifting of analysis
2. **Decision Fatigue Prevention** - Bounded options, not open fields
3. **Context Preservation** - Explicit anchoring to known facts
4. **Actionability** - Every question leads to clear next step
5. **Trust Building** - Recommendations show competence

### Inspiration

- Amazon's "disagree and commit" culture
- Decision journals and ADRs
- High-bandwidth communication principles
- Recursive self-improvement patterns

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-02 | Initial release |

---

## Contributing

To improve these prompts:

1. Identify anti-pattern in production use
2. Document in `anti-patterns.md`
3. Create test case in `test-scenarios.md`
4. Update relevant prompt file
5. Validate against regression suite

---

*CC-AQT-MASTER | Version 1.0.0 | High-Bandwidth AI Communication*

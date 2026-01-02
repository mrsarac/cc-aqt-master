# Prompt Test Scenarios

> **Purpose:** Validate that the Master Architect prompt produces expected outputs
> **Usage:** Run these scenarios to test prompt effectiveness and catch regressions

---

## Test Framework

### Test Structure

```yaml
test:
  id: "[TEST_ID]"
  category: "[CATEGORY]"
  input: "[USER_INPUT]"
  expected:
    contains: ["[REQUIRED_ELEMENTS]"]
    structure: "[EXPECTED_FORMAT]"
    anti_patterns: ["[MUST_NOT_CONTAIN]"]
  pass_criteria: "[DESCRIPTION]"
```

---

## Category 1: Vague Input Handling

### TEST-001: Completely Vague Request

```yaml
id: TEST-001
category: vague_input
input: "Fix it"
expected:
  contains:
    - "context" or "Based on"
    - "Options:" or "A)" and "B)"
    - "recommend" or "suggest"
  anti_patterns:
    - "What do you mean"
    - "Can you be more specific"
    - "It depends"
  pass_criteria: >
    Response should identify likely "it" from context,
    present bounded options, and make a recommendation.
```

**Sample Expected Output:**
```markdown
Based on the recent error in `auth.ts` line 45, I assume you mean the token validation bug.

Options:
A) Quick fix - Add null check
B) Proper fix - Refactor validation flow
C) Clarify - If you meant something else

I recommend A for immediate fix. Which approach?
```

---

### TEST-002: Single Word Bug Report

```yaml
id: TEST-002
category: vague_input
input: "slow"
expected:
  contains:
    - Specific file/function reference
    - "performance" or "latency" or "response time"
    - At least 2 options
  anti_patterns:
    - "What is slow"
    - "Where exactly"
  pass_criteria: >
    Should diagnose from context, not ask user to specify.
```

---

### TEST-003: Ambiguous Pronoun

```yaml
id: TEST-003
category: vague_input
input: "Can you change it to use that instead?"
expected:
  contains:
    - Specific interpretation of "it" and "that"
    - Confirmation question with specifics
  anti_patterns:
    - Response using "it" or "that" without defining
  pass_criteria: >
    Must replace pronouns with concrete references.
```

---

## Category 2: Decision Structure

### TEST-010: Binary Question Expansion

```yaml
id: TEST-010
category: decision_structure
input: "Should we use Redis?"
expected:
  contains:
    - At least 3 options (not just yes/no)
    - Trade-offs for each option
    - "recommend" with rationale
  anti_patterns:
    - Only "yes" or "no"
    - "It depends on your needs"
  pass_criteria: >
    Binary yes/no question should expand to multi-option decision.
```

---

### TEST-011: Option Count Validation

```yaml
id: TEST-011
category: decision_structure
input: "What's the best way to implement authentication?"
expected:
  contains:
    - Between 3-5 options
    - Pros/cons for each
    - Clear recommendation
  anti_patterns:
    - More than 6 options (overwhelm)
    - Fewer than 2 options (false binary)
    - No recommendation
  pass_criteria: >
    Options should be bounded and digestible.
```

---

### TEST-012: Recommendation Present

```yaml
id: TEST-012
category: decision_structure
input: "Database: PostgreSQL vs MySQL vs MongoDB"
expected:
  contains:
    - "recommend" OR "suggest" OR "prefer"
    - "because" OR "since" OR rationale
  anti_patterns:
    - "It's up to you"
    - "Both are good options"
    - Neutral non-recommendation
  pass_criteria: >
    Must take a stance when given enough context.
```

---

## Category 3: Context Utilization

### TEST-020: Project Context Application

```yaml
id: TEST-020
category: context_utilization
context: "TypeScript React project with PostgreSQL"
input: "Add a new feature"
expected:
  contains:
    - "TypeScript" reference
    - React-appropriate patterns
    - Database consideration
  anti_patterns:
    - "What language"
    - "What framework"
    - Generic answer ignoring context
  pass_criteria: >
    Response must incorporate known project context.
```

---

### TEST-021: Previous Conversation Memory

```yaml
id: TEST-021
category: context_utilization
setup: "User previously said: We're deploying to AWS"
input: "How should we set up the database?"
expected:
  contains:
    - AWS database options (RDS, Aurora)
    - Reference to deployment context
  anti_patterns:
    - "Where are you deploying"
    - Generic non-AWS options
  pass_criteria: >
    Must use information from conversation history.
```

---

### TEST-022: Code Context Awareness

```yaml
id: TEST-022
category: context_utilization
context: "Reading user.ts file with React hooks"
input: "How do I fetch the user data?"
expected:
  contains:
    - React-specific patterns (useEffect, custom hook)
    - Reference to existing code patterns
  anti_patterns:
    - Non-React patterns
    - "What framework are you using"
  pass_criteria: >
    Should infer framework from code context.
```

---

## Category 4: Severity Calibration

### TEST-030: Critical Issue Response

```yaml
id: TEST-030
category: severity
input: "SQL injection in login"
expected:
  contains:
    - "CRITICAL" or "urgent" or "security"
    - Immediate action recommendation
    - Specific fix
  anti_patterns:
    - "Consider fixing"
    - "When you have time"
    - Low-priority framing
  pass_criteria: >
    Critical security issues must be treated urgently.
```

---

### TEST-031: Low Priority Calibration

```yaml
id: TEST-031
category: severity
input: "Variable name could be better"
expected:
  contains:
    - Low priority indicator
    - "Optional" or "suggestion" or "nitpick"
  anti_patterns:
    - "Must fix"
    - "Critical"
    - Urgent language
  pass_criteria: >
    Minor improvements should not be escalated.
```

---

## Category 5: Output Format

### TEST-040: Code Block Inclusion

```yaml
id: TEST-040
category: output_format
input: "How do I validate email?"
expected:
  contains:
    - Code block with implementation
    - Language identifier (```typescript or ```javascript)
  anti_patterns:
    - Only prose description
    - Code without block formatting
  pass_criteria: >
    Technical answers must include formatted code.
```

---

### TEST-041: Structured Options Format

```yaml
id: TEST-041
category: output_format
input: "Architecture decision needed"
expected:
  contains:
    - "A)" or "Option A" format
    - Consistent formatting across options
    - Summary/comparison structure
  anti_patterns:
    - Unstructured prose options
    - Inconsistent formatting
  pass_criteria: >
    Options must be scannable and structured.
```

---

### TEST-042: Action Item Clarity

```yaml
id: TEST-042
category: output_format
input: "What should I do next?"
expected:
  contains:
    - Numbered or bulleted action list
    - Specific commands or steps
    - Clear ownership (I'll/You should)
  anti_patterns:
    - Vague "consider" without specifics
    - No clear next step
  pass_criteria: >
    Response must end with clear actionable next step.
```

---

## Category 6: Anti-Pattern Avoidance

### TEST-050: No Infinite Loop

```yaml
id: TEST-050
category: anti_pattern
input: "I don't know what to do"
expected:
  contains:
    - Concrete suggestion
    - Decision framework
  anti_patterns:
    - "What are your goals"
    - "What do you want to achieve"
    - Counter-question without value
  pass_criteria: >
    Must break potential infinite loop with suggestion.
```

---

### TEST-051: No Hidden Assumptions

```yaml
id: TEST-051
category: anti_pattern
input: "Add caching"
expected:
  contains:
    - Validation of need ("Caching would help because...")
    - OR explicit assumption ("Assuming caching is needed for X...")
  anti_patterns:
    - Jumping straight to implementation
    - "Where should I add caching" (assumes needed)
  pass_criteria: >
    Must validate or explicitly state assumptions.
```

---

### TEST-052: No Kitchen Sink

```yaml
id: TEST-052
category: anti_pattern
input: "Choose a frontend framework"
expected:
  contains:
    - 3-5 key criteria max
    - Prioritized considerations
  anti_patterns:
    - List of 10+ considerations
    - "Here are all the things to think about"
  pass_criteria: >
    Must filter to relevant considerations.
```

---

## Test Execution Guide

### Manual Testing

1. Set up clean conversation context
2. Input the test case
3. Evaluate response against criteria
4. Mark PASS/FAIL with notes

### Scoring Rubric

| Score | Description |
|-------|-------------|
| PASS | All expected elements present, no anti-patterns |
| PARTIAL | Missing 1 expected element OR 1 anti-pattern present |
| FAIL | Missing 2+ elements OR 2+ anti-patterns |

### Test Report Template

```markdown
## Test Run: [DATE]

### Summary
- Total Tests: [N]
- Passed: [N] ([%])
- Partial: [N] ([%])
- Failed: [N] ([%])

### Failed Tests
| ID | Issue | Notes |
|----|-------|-------|
| TEST-XXX | [ISSUE] | [NOTES] |

### Improvements Needed
- [IMPROVEMENT_1]
- [IMPROVEMENT_2]
```

---

## Regression Test Suite

Run these 10 tests minimum before deploying prompt changes:

1. TEST-001 (Vague input)
2. TEST-010 (Binary expansion)
3. TEST-012 (Recommendation present)
4. TEST-020 (Context utilization)
5. TEST-030 (Critical severity)
6. TEST-040 (Code blocks)
7. TEST-041 (Structured options)
8. TEST-042 (Action clarity)
9. TEST-050 (No infinite loop)
10. TEST-051 (No hidden assumptions)

---

*Test Scenarios | Version: 1.0.0*

import { describe, it, expect } from 'vitest'
import {
  QuestionIntentSchema,
  SessionMetricsSchema,
  AgentDefinitionSchema,
  AQTConfigSchema,
  RefinedQuestionSchema,
} from '../src/config/schema'

describe('QuestionIntentSchema', () => {
  it('should validate a valid question intent', () => {
    const validIntent = {
      type: 'clarification',
      confidence: 0.85,
      context: {
        currentFile: 'src/index.ts',
        recentFiles: ['package.json'],
        projectPhase: 'mvp',
      },
    }

    const result = QuestionIntentSchema.safeParse(validIntent)
    expect(result.success).toBe(true)
  })

  it('should reject invalid intent type', () => {
    const invalidIntent = {
      type: 'invalid_type',
      confidence: 0.5,
      context: {},
    }

    const result = QuestionIntentSchema.safeParse(invalidIntent)
    expect(result.success).toBe(false)
  })

  it('should reject confidence out of range', () => {
    const invalidIntent = {
      type: 'architecture',
      confidence: 1.5, // > 1
      context: {},
    }

    const result = QuestionIntentSchema.safeParse(invalidIntent)
    expect(result.success).toBe(false)
  })

  it('should use default values for context', () => {
    const minimalIntent = {
      type: 'config',
      confidence: 0.9,
      context: {},
    }

    const result = QuestionIntentSchema.safeParse(minimalIntent)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.context.recentFiles).toEqual([])
      expect(result.data.context.projectPhase).toBe('mvp')
    }
  })
})

describe('SessionMetricsSchema', () => {
  it('should validate valid session metrics', () => {
    const validMetrics = {
      sessionId: 'sess_123',
      startTime: new Date(),
      tokens: {
        input: 1000,
        output: 200,
        cached: 500,
        cacheHitRatio: 0.5,
      },
      context: {
        utilizationPercent: 45,
        filesInContext: 10,
        truncationEvents: 0,
      },
      interactions: {
        totalTurns: 5,
        questionsAsked: 2,
        refinedQuestions: 2,
      },
      cost: {
        estimatedUSD: 0.05,
        modelTier: 'sonnet',
      },
    }

    const result = SessionMetricsSchema.safeParse(validMetrics)
    expect(result.success).toBe(true)
  })

  it('should reject negative token counts', () => {
    const invalidMetrics = {
      sessionId: 'sess_123',
      startTime: new Date(),
      tokens: {
        input: -100, // negative
        output: 200,
        cached: 500,
        cacheHitRatio: 0.5,
      },
      context: {
        utilizationPercent: 45,
        filesInContext: 10,
        truncationEvents: 0,
      },
      interactions: {
        totalTurns: 5,
        questionsAsked: 2,
        refinedQuestions: 2,
      },
      cost: {
        estimatedUSD: 0.05,
        modelTier: 'sonnet',
      },
    }

    const result = SessionMetricsSchema.safeParse(invalidMetrics)
    expect(result.success).toBe(false)
  })

  it('should reject invalid model tier', () => {
    const invalidMetrics = {
      sessionId: 'sess_123',
      startTime: new Date(),
      tokens: {
        input: 1000,
        output: 200,
        cached: 500,
        cacheHitRatio: 0.5,
      },
      context: {
        utilizationPercent: 45,
        filesInContext: 10,
        truncationEvents: 0,
      },
      interactions: {
        totalTurns: 5,
        questionsAsked: 2,
        refinedQuestions: 2,
      },
      cost: {
        estimatedUSD: 0.05,
        modelTier: 'haiku', // invalid
      },
    }

    const result = SessionMetricsSchema.safeParse(invalidMetrics)
    expect(result.success).toBe(false)
  })
})

describe('AgentDefinitionSchema', () => {
  it('should validate a valid agent definition', () => {
    const validAgent = {
      description: 'Optimizes user questions',
      model: 'claude-sonnet-4-20250514',
      tools: ['AskUserQuestion', 'Read', 'Grep'],
      prompt: 'You are the Master Architect...',
    }

    const result = AgentDefinitionSchema.safeParse(validAgent)
    expect(result.success).toBe(true)
  })

  it('should accept empty tools array', () => {
    const agentNoTools = {
      description: 'Test agent',
      model: 'claude-sonnet-4-20250514',
      tools: [],
      prompt: 'Test prompt',
    }

    const result = AgentDefinitionSchema.safeParse(agentNoTools)
    expect(result.success).toBe(true)
  })

  it('should reject missing required fields', () => {
    const invalidAgent = {
      description: 'Test',
      // missing model, tools, prompt
    }

    const result = AgentDefinitionSchema.safeParse(invalidAgent)
    expect(result.success).toBe(false)
  })
})

describe('AQTConfigSchema', () => {
  it('should validate a valid config', () => {
    const validConfig = {
      autoSieve: true,
      tokenAlerts: {
        sessionWarning: 150000,
        sessionCritical: 180000,
      },
      defaultAgent: 'master-architect',
      logLevel: 'info',
    }

    const result = AQTConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('should use defaults for optional fields', () => {
    const minimalConfig = {}

    const result = AQTConfigSchema.safeParse(minimalConfig)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.autoSieve).toBe(true)
      expect(result.data.defaultAgent).toBe('master-architect')
      expect(result.data.logLevel).toBe('info')
    }
  })

  it('should reject invalid log level', () => {
    const invalidConfig = {
      logLevel: 'verbose', // not in enum
    }

    const result = AQTConfigSchema.safeParse(invalidConfig)
    expect(result.success).toBe(false)
  })
})

describe('RefinedQuestionSchema', () => {
  it('should validate a well-formed refined question', () => {
    const validQuestion = {
      summary: 'Database Selection',
      context: 'Building a new API service',
      options: [
        {
          label: 'A',
          description: 'PostgreSQL',
          impact: {
            tokens: 'low',
            performance: 'High for complex queries',
            complexity: 'Medium setup',
          },
        },
        {
          label: 'B',
          description: 'MongoDB',
          impact: {
            tokens: 'low',
            performance: 'High for document storage',
            complexity: 'Easy setup',
          },
        },
      ],
      recommendation: 'Option A for relational data model',
      callToAction: 'Please select A or B',
    }

    const result = RefinedQuestionSchema.safeParse(validQuestion)
    expect(result.success).toBe(true)
  })

  it('should reject fewer than 2 options', () => {
    const invalidQuestion = {
      summary: 'Test',
      context: 'Test context',
      options: [
        {
          label: 'A',
          description: 'Only option',
          impact: {
            tokens: 'low',
            performance: 'N/A',
            complexity: 'N/A',
          },
        },
      ],
      recommendation: 'A',
      callToAction: 'Select',
    }

    const result = RefinedQuestionSchema.safeParse(invalidQuestion)
    expect(result.success).toBe(false)
  })

  it('should reject more than 5 options', () => {
    const tooManyOptions = {
      summary: 'Test',
      context: 'Test context',
      options: Array(6).fill({
        label: 'X',
        description: 'Option',
        impact: {
          tokens: 'low',
          performance: 'N/A',
          complexity: 'N/A',
        },
      }),
      recommendation: 'A',
      callToAction: 'Select',
    }

    const result = RefinedQuestionSchema.safeParse(tooManyOptions)
    expect(result.success).toBe(false)
  })
})

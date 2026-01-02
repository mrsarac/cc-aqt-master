/**
 * Configuration schemas using Zod
 */

import { z } from 'zod';

// Question intent types
export const QuestionIntentTypeSchema = z.enum([
  'config',
  'architecture',
  'implementation',
  'clarification',
]);

export type QuestionIntentType = z.infer<typeof QuestionIntentTypeSchema>;

// Project phase
export const ProjectPhaseSchema = z.enum(['mvp', 'growth', 'mature']);

export type ProjectPhase = z.infer<typeof ProjectPhaseSchema>;

// Question intent
export const QuestionIntentSchema = z.object({
  type: QuestionIntentTypeSchema,
  confidence: z.number().min(0).max(1),
  context: z.object({
    currentFile: z.string().optional(),
    recentFiles: z.array(z.string()).default([]),
    projectPhase: ProjectPhaseSchema.default('mvp'),
  }),
});

export type QuestionIntent = z.infer<typeof QuestionIntentSchema>;

// Impact levels
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high']);

export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

// Option impact
export const OptionImpactSchema = z.object({
  tokens: ImpactLevelSchema,
  performance: z.string(),
  complexity: z.string(),
});

export type OptionImpact = z.infer<typeof OptionImpactSchema>;

// Single option
export const OptionSchema = z.object({
  label: z.string(), // A, B, C
  description: z.string(),
  codeExample: z.string().optional(),
  impact: OptionImpactSchema,
});

export type Option = z.infer<typeof OptionSchema>;

// Refined question output
export const RefinedQuestionSchema = z.object({
  summary: z.string(),
  context: z.string(),
  options: z.array(OptionSchema).min(2).max(5),
  recommendation: z.string(),
  callToAction: z.string(),
});

export type RefinedQuestion = z.infer<typeof RefinedQuestionSchema>;

// Session metrics
export const SessionMetricsSchema = z.object({
  sessionId: z.string(),
  startTime: z.date(),
  tokens: z.object({
    input: z.number().nonnegative(),
    output: z.number().nonnegative(),
    cached: z.number().nonnegative(),
    cacheHitRatio: z.number().min(0).max(1),
  }),
  context: z.object({
    utilizationPercent: z.number().min(0).max(100),
    filesInContext: z.number().nonnegative(),
    truncationEvents: z.number().nonnegative(),
  }),
  interactions: z.object({
    totalTurns: z.number().nonnegative(),
    questionsAsked: z.number().nonnegative(),
    refinedQuestions: z.number().nonnegative(),
  }),
  cost: z.object({
    estimatedUSD: z.number().nonnegative(),
    modelTier: z.enum(['sonnet', 'opus']),
  }),
});

export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

// Agent definition
export const AgentDefinitionSchema = z.object({
  description: z.string(),
  model: z.string(),
  tools: z.array(z.string()),
  prompt: z.string(),
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

// AQT configuration
export const AQTConfigSchema = z.object({
  autoSieve: z.boolean().default(true),
  tokenAlerts: z
    .object({
      sessionWarning: z.number().default(150000),
      sessionCritical: z.number().default(180000),
    })
    .default({}),
  defaultAgent: z.string().default('master-architect'),
  claudeHome: z.string().optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AQTConfig = z.infer<typeof AQTConfigSchema>;

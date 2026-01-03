import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  parseJsonlLine,
  parseJsonlString,
  streamJsonl,
  streamJsonlWithMeta,
  readJsonl,
  calculateTokenTotals,
  calculateTokenTotalsStream,
  extractSessionSummaries,
  countEntriesByType,
  isGzipFile,
  getFileSize,
  type RawLogEntry,
  type ParseError,
} from '../src/utils/jsonl';

describe('JSONL Parser', () => {
  const testDir = join(tmpdir(), 'aqt-jsonl-test-' + Date.now());

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  // Sample JSONL content for testing
  const sampleJsonl = `{"type":"user","timestamp":"2024-01-01T10:00:00Z","content":"Hello","session_id":"sess-1"}
{"type":"assistant","timestamp":"2024-01-01T10:00:01Z","content":"Hi there!","model":"claude-sonnet-4-20250514","usage":{"input_tokens":100,"output_tokens":50},"session_id":"sess-1"}
{"type":"tool","timestamp":"2024-01-01T10:00:02Z","name":"Read","result":"file contents","session_id":"sess-1"}
{"type":"user","timestamp":"2024-01-01T10:00:03Z","content":"Read this file","session_id":"sess-1"}
{"type":"assistant","timestamp":"2024-01-01T10:00:04Z","content":"Done!","model":"claude-sonnet-4-20250514","usage":{"input_tokens":200,"output_tokens":100,"cache_read_input_tokens":50},"session_id":"sess-1"}`;

  describe('parseJsonlLine', () => {
    it('should parse valid JSON line', () => {
      const line = '{"type":"user","content":"hello"}';
      const result = parseJsonlLine(line);

      expect(result).toEqual({ type: 'user', content: 'hello' });
    });

    it('should return null for empty line', () => {
      expect(parseJsonlLine('')).toBeNull();
      expect(parseJsonlLine('   ')).toBeNull();
      expect(parseJsonlLine('\t\n')).toBeNull();
    });

    it('should return null for comment lines', () => {
      expect(parseJsonlLine('# This is a comment')).toBeNull();
      expect(parseJsonlLine('  # Another comment')).toBeNull();
    });

    it('should handle malformed JSON', () => {
      const errors: ParseError[] = [];
      const onError = (err: ParseError) => errors.push(err);

      const result = parseJsonlLine('{ invalid json }', 1, onError);

      expect(result).toBeNull();
      expect(errors).toHaveLength(1);
      expect(errors[0].lineNumber).toBe(1);
      // Error message varies by Node.js version
      expect(errors[0].error.length).toBeGreaterThan(0);
    });

    it('should truncate long error messages', () => {
      const errors: ParseError[] = [];
      const onError = (err: ParseError) => errors.push(err);

      const longLine = 'x'.repeat(500);
      parseJsonlLine(longLine, 1, onError);

      expect(errors[0].raw.length).toBeLessThanOrEqual(200);
    });
  });

  describe('parseJsonlString', () => {
    it('should parse multiline JSONL string', () => {
      const content = `{"a":1}
{"b":2}
{"c":3}`;

      const results = [...parseJsonlString(content)];

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ a: 1 });
      expect(results[1]).toEqual({ b: 2 });
      expect(results[2]).toEqual({ c: 3 });
    });

    it('should skip empty lines', () => {
      const content = `{"a":1}

{"b":2}

{"c":3}`;

      const results = [...parseJsonlString(content)];
      expect(results).toHaveLength(3);
    });

    it('should filter by type', () => {
      const results = [...parseJsonlString<RawLogEntry>(sampleJsonl, {
        filterTypes: ['user'],
      })];

      expect(results).toHaveLength(2);
      expect(results.every(r => r.type === 'user')).toBe(true);
    });
  });

  describe('streamJsonl', () => {
    it('should stream JSONL file', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const entries: RawLogEntry[] = [];
      for await (const entry of streamJsonl<RawLogEntry>(filePath)) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(5);
      expect(entries[0].type).toBe('user');
      expect(entries[1].type).toBe('assistant');
      expect(entries[2].type).toBe('tool');
    });

    it('should handle gzip compressed files', async () => {
      const filePath = join(testDir, 'test.jsonl.gz');
      const compressed = gzipSync(Buffer.from(sampleJsonl, 'utf-8'));
      writeFileSync(filePath, compressed);

      const entries: RawLogEntry[] = [];
      for await (const entry of streamJsonl<RawLogEntry>(filePath)) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(5);
    });

    it('should call progress callback', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const progressCalls: [number, number][] = [];

      const entries: RawLogEntry[] = [];
      for await (const entry of streamJsonl<RawLogEntry>(filePath, {
        onProgress: (read, total) => progressCalls.push([read, total]),
      })) {
        entries.push(entry);
      }

      expect(progressCalls.length).toBeGreaterThan(0);
      // Last progress call should have read all bytes
      const lastCall = progressCalls[progressCalls.length - 1];
      expect(lastCall[0]).toBe(lastCall[1]);
    });

    it('should call error callback for malformed lines', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, `{"valid":true}
invalid json here
{"also":"valid"}`);

      const errors: ParseError[] = [];
      const entries: RawLogEntry[] = [];

      for await (const entry of streamJsonl<RawLogEntry>(filePath, {
        onError: (err) => errors.push(err),
      })) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(2);
      expect(errors).toHaveLength(1);
      expect(errors[0].lineNumber).toBe(2);
    });

    it('should filter entries by type', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const entries: RawLogEntry[] = [];
      for await (const entry of streamJsonl<RawLogEntry>(filePath, {
        filterTypes: ['assistant'],
      })) {
        entries.push(entry);
      }

      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.type === 'assistant')).toBe(true);
    });
  });

  describe('streamJsonlWithMeta', () => {
    it('should include line numbers and raw content', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const results = [];
      for await (const result of streamJsonlWithMeta<RawLogEntry>(filePath)) {
        results.push(result);
      }

      expect(results[0].lineNumber).toBe(1);
      expect(results[0].data.type).toBe('user');
      expect(results[0].raw).toContain('"type":"user"');
    });
  });

  describe('readJsonl', () => {
    it('should read entire file into array', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const entries = await readJsonl<RawLogEntry>(filePath);

      expect(entries).toHaveLength(5);
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe('calculateTokenTotals', () => {
    it('should calculate token totals from entries', () => {
      const entries: RawLogEntry[] = [
        { usage: { input_tokens: 100, output_tokens: 50 } },
        { usage: { input_tokens: 200, output_tokens: 100, cache_read_input_tokens: 50 } },
        { type: 'user' }, // No usage
      ];

      const totals = calculateTokenTotals(entries);

      expect(totals.input).toBe(300);
      expect(totals.output).toBe(150);
      expect(totals.cacheRead).toBe(50);
      expect(totals.total).toBe(450);
    });

    it('should calculate cost estimates', () => {
      const entries: RawLogEntry[] = [
        { usage: { input_tokens: 1_000_000, output_tokens: 1_000_000 } },
      ];

      const totals = calculateTokenTotals(entries);

      // Input: $3/MTok, Output: $15/MTok
      expect(totals.costEstimate.inputCost).toBe(3);
      expect(totals.costEstimate.outputCost).toBe(15);
      expect(totals.costEstimate.totalCost).toBe(18);
    });

    it('should handle empty entries array', () => {
      const totals = calculateTokenTotals([]);

      expect(totals.input).toBe(0);
      expect(totals.output).toBe(0);
      expect(totals.total).toBe(0);
    });
  });

  describe('calculateTokenTotalsStream', () => {
    it('should calculate totals from file stream', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const totals = await calculateTokenTotalsStream(filePath);

      expect(totals.input).toBe(300);
      expect(totals.output).toBe(150);
      expect(totals.cacheRead).toBe(50);
    });
  });

  describe('extractSessionSummaries', () => {
    it('should extract session summaries', () => {
      const entries: RawLogEntry[] = [
        { type: 'user', timestamp: '2024-01-01T10:00:00Z', session_id: 'sess-1' },
        { type: 'assistant', timestamp: '2024-01-01T10:00:01Z', session_id: 'sess-1', model: 'claude-sonnet-4-20250514', usage: { input_tokens: 100, output_tokens: 50 } },
        { type: 'user', timestamp: '2024-01-01T11:00:00Z', session_id: 'sess-2' },
        { type: 'assistant', timestamp: '2024-01-01T11:00:01Z', session_id: 'sess-2', model: 'claude-sonnet-4-20250514', usage: { input_tokens: 200, output_tokens: 100 } },
      ];

      const summaries = extractSessionSummaries(entries);

      expect(summaries).toHaveLength(2);
      expect(summaries[0].sessionId).toBe('sess-1');
      expect(summaries[0].messageCount.user).toBe(1);
      expect(summaries[0].messageCount.assistant).toBe(1);
      expect(summaries[0].tokenUsage.input).toBe(100);

      expect(summaries[1].sessionId).toBe('sess-2');
      expect(summaries[1].tokenUsage.input).toBe(200);
    });

    it('should handle entries without session_id', () => {
      const entries: RawLogEntry[] = [
        { type: 'user', timestamp: '2024-01-01T10:00:00Z' },
        { type: 'assistant', timestamp: '2024-01-01T10:00:01Z' },
      ];

      const summaries = extractSessionSummaries(entries);

      expect(summaries).toHaveLength(1);
      expect(summaries[0].sessionId).toBe('unknown');
    });

    it('should sort sessions by start time', () => {
      const entries: RawLogEntry[] = [
        { type: 'user', timestamp: '2024-01-01T12:00:00Z', session_id: 'sess-b' },
        { type: 'user', timestamp: '2024-01-01T10:00:00Z', session_id: 'sess-a' },
        { type: 'user', timestamp: '2024-01-01T11:00:00Z', session_id: 'sess-c' },
      ];

      const summaries = extractSessionSummaries(entries);

      expect(summaries[0].sessionId).toBe('sess-a');
      expect(summaries[1].sessionId).toBe('sess-c');
      expect(summaries[2].sessionId).toBe('sess-b');
    });
  });

  describe('countEntriesByType', () => {
    it('should count entries by type', async () => {
      const filePath = join(testDir, 'test.jsonl');
      writeFileSync(filePath, sampleJsonl);

      const counts = await countEntriesByType(filePath);

      expect(counts.user).toBe(2);
      expect(counts.assistant).toBe(2);
      expect(counts.tool).toBe(1);
    });
  });

  describe('Utility Functions', () => {
    describe('isGzipFile', () => {
      it('should detect .gz extension', () => {
        expect(isGzipFile('file.jsonl.gz')).toBe(true);
        expect(isGzipFile('file.gz')).toBe(true);
        expect(isGzipFile('file.gzip')).toBe(true);
        expect(isGzipFile('file.jsonl')).toBe(false);
        expect(isGzipFile('file.json')).toBe(false);
      });
    });

    describe('getFileSize', () => {
      it('should return file size', () => {
        const filePath = join(testDir, 'test.txt');
        writeFileSync(filePath, 'hello world');

        const size = getFileSize(filePath);
        expect(size).toBe(11);
      });

      it('should return 0 for non-existent file', () => {
        const size = getFileSize('/non/existent/file.txt');
        expect(size).toBe(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle file with only empty lines', async () => {
      const filePath = join(testDir, 'empty.jsonl');
      writeFileSync(filePath, '\n\n\n');

      const entries = await readJsonl(filePath);
      expect(entries).toHaveLength(0);
    });

    it('should handle file with comments only', async () => {
      const filePath = join(testDir, 'comments.jsonl');
      writeFileSync(filePath, '# Comment 1\n# Comment 2\n# Comment 3');

      const entries = await readJsonl(filePath);
      expect(entries).toHaveLength(0);
    });

    it('should handle mixed valid and invalid lines', async () => {
      const filePath = join(testDir, 'mixed.jsonl');
      writeFileSync(filePath, `{"valid":1}
not json
{"valid":2}
also not json
{"valid":3}`);

      const errors: ParseError[] = [];
      const entries = await readJsonl(filePath, {
        onError: (err) => errors.push(err),
      });

      expect(entries).toHaveLength(3);
      expect(errors).toHaveLength(2);
    });

    it('should handle large numbers in token counts', () => {
      const entries: RawLogEntry[] = [
        { usage: { input_tokens: 10_000_000, output_tokens: 5_000_000 } },
      ];

      const totals = calculateTokenTotals(entries);

      expect(totals.input).toBe(10_000_000);
      expect(totals.output).toBe(5_000_000);
      expect(totals.costEstimate.inputCost).toBe(30); // 10MTok * $3
      expect(totals.costEstimate.outputCost).toBe(75); // 5MTok * $15
    });
  });
});

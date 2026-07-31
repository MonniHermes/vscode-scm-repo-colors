import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDescription, formatTooltip, sortRepositories, type RepositorySummary } from '../src/presentation';
import { aggregateStatus } from '../src/status';

const summary = (name: string, dirty: boolean): RepositorySummary => ({
  name,
  branch: 'main',
  status: aggregateStatus({ indexChanges: dirty ? [{ status: 5 }] : [], workingTreeChanges: [], untrackedChanges: [], mergeChanges: [] })
});

test('sorts dirty repositories before clean repositories, then alphabetically', () => {
  assert.deepEqual(sortRepositories([summary('Zulu', false), summary('beta', true), summary('Alpha', true)]).map(({ name }) => name), ['Alpha', 'beta', 'Zulu']);
});

test('formats deterministic compact and complete summaries', () => {
  const item: RepositorySummary = {
    name: 'api', branch: 'feature',
    status: aggregateStatus({ indexChanges: [{ status: 1 }], workingTreeChanges: [{ status: 5 }], untrackedChanges: [], mergeChanges: [], ahead: 2 })
  };
  assert.equal(formatDescription(item), 'feature • C:0 D:0 A:1 M:1 ↓:0 ↑:2');
  assert.match(formatTooltip(item), /Added\/untracked: 1/);
  assert.match(formatTooltip(item), /Incoming \(behind\): 0/);
});

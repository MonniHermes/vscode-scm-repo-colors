import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateStatus } from '../src/status';

const change = (status: number): { status: number } => ({ status });

test('aggregates every category and applies documented priority', () => {
  const status = aggregateStatus({
    indexChanges: [change(1), change(2), change(3)],
    workingTreeChanges: [change(7), change(5)],
    untrackedChanges: [change(7)],
    mergeChanges: [change(18)],
    ahead: 4,
    behind: 2
  });
  assert.deepEqual(status, {
    conflicts: 1, deleted: 1, added: 3, modified: 2, behind: 2, ahead: 4,
    primary: 'conflict', dirty: true
  });
});

test('counts changes from the dedicated untracked collection', () => {
  const status = aggregateStatus({
    indexChanges: [],
    workingTreeChanges: [],
    untrackedChanges: [change(7), change(7)],
    mergeChanges: []
  });
  assert.equal(status.added, 2);
  assert.equal(status.primary, 'added');
});

test('prioritizes incoming updates over outgoing updates', () => {
  assert.equal(aggregateStatus({ indexChanges: [], workingTreeChanges: [], untrackedChanges: [], mergeChanges: [], ahead: 3, behind: 1 }).primary, 'behind');
});

test('classifies an unchanged synchronized repository as clean', () => {
  const status = aggregateStatus({ indexChanges: [], workingTreeChanges: [], untrackedChanges: [], mergeChanges: [] });
  assert.equal(status.primary, 'clean');
  assert.equal(status.dirty, false);
});

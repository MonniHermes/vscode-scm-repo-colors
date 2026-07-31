import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateStatus, GitChangeStatus } from '../src/status';

const change = (key: string, status: number): { key: string; status: number } => ({ key, status });

test('aggregates every category and applies documented priority', () => {
  const status = aggregateStatus({
    indexChanges: [change('added.ts', GitChangeStatus.IndexAdded), change('deleted.ts', GitChangeStatus.IndexDeleted), change('renamed.ts', GitChangeStatus.IndexRenamed)],
    workingTreeChanges: [change('new.ts', GitChangeStatus.Untracked), change('modified.ts', GitChangeStatus.Modified)],
    untrackedChanges: [change('other-new.ts', GitChangeStatus.Untracked)],
    mergeChanges: [change('conflict.ts', GitChangeStatus.Modified)],
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
    untrackedChanges: [change('one.ts', GitChangeStatus.Untracked), change('two.ts', GitChangeStatus.Untracked)],
    mergeChanges: []
  });
  assert.equal(status.added, 2);
  assert.equal(status.primary, 'added');
});

test('counts a staged then modified file once using the highest-priority state', () => {
  const status = aggregateStatus({
    indexChanges: [change('same.ts', GitChangeStatus.IndexAdded)],
    workingTreeChanges: [change('same.ts', GitChangeStatus.Modified)],
    untrackedChanges: [],
    mergeChanges: []
  });
  assert.equal(status.added, 1);
  assert.equal(status.modified, 0);
});

test('prioritizes incoming updates over outgoing updates', () => {
  assert.equal(aggregateStatus({ indexChanges: [], workingTreeChanges: [], untrackedChanges: [], mergeChanges: [], ahead: 3, behind: 1 }).primary, 'behind');
});

test('classifies an unchanged synchronized repository as clean', () => {
  const status = aggregateStatus({ indexChanges: [], workingTreeChanges: [], untrackedChanges: [], mergeChanges: [] });
  assert.equal(status.primary, 'clean');
  assert.equal(status.dirty, false);
});

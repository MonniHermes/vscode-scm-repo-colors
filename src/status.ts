export type PrimaryStatus = 'conflict' | 'deleted' | 'added' | 'modified' | 'behind' | 'ahead' | 'clean';

export interface StatusCounts {
  readonly conflicts: number;
  readonly deleted: number;
  readonly added: number;
  readonly modified: number;
  readonly behind: number;
  readonly ahead: number;
}

export interface ChangeArrays {
  readonly indexChanges: readonly { readonly status: number }[];
  readonly workingTreeChanges: readonly { readonly status: number }[];
  readonly untrackedChanges: readonly { readonly status: number }[];
  readonly mergeChanges: readonly { readonly status: number }[];
  readonly ahead?: number;
  readonly behind?: number;
}

export interface RepositoryStatus extends StatusCounts {
  readonly primary: PrimaryStatus;
  readonly dirty: boolean;
}

const DELETED = new Set([2, 6]);
const ADDED = new Set([1, 7, 9]);
const MODIFIED = new Set([0, 3, 4, 5, 10, 11]);

export function aggregateStatus(changes: ChangeArrays): RepositoryStatus {
  let deleted = 0;
  let added = 0;
  let modified = 0;
  for (const change of [...changes.indexChanges, ...changes.workingTreeChanges, ...changes.untrackedChanges]) {
    if (DELETED.has(change.status)) deleted += 1;
    else if (ADDED.has(change.status)) added += 1;
    else if (MODIFIED.has(change.status)) modified += 1;
  }
  const counts: StatusCounts = {
    conflicts: changes.mergeChanges.length,
    deleted,
    added,
    modified,
    behind: changes.behind ?? 0,
    ahead: changes.ahead ?? 0
  };
  const primary: PrimaryStatus = counts.conflicts > 0 ? 'conflict'
    : counts.deleted > 0 ? 'deleted'
    : counts.added > 0 ? 'added'
    : counts.modified > 0 ? 'modified'
    : counts.behind > 0 ? 'behind'
    : counts.ahead > 0 ? 'ahead'
    : 'clean';
  return { ...counts, primary, dirty: primary !== 'clean' };
}

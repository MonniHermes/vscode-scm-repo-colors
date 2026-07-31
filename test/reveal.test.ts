import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EXPAND_ALL_REPOSITORIES_COMMAND,
  FOCUS_NEXT_INPUT_COMMAND,
  OPEN_SCM_COMMAND,
  revealNativeRepository,
  type RevealCandidate,
  type RevealCommandAdapter
} from '../src/reveal';

function harness(selectedIndex = 0, focusCommandAvailable = true): {
  repositories: RevealCandidate[];
  commands: string[];
  adapter: RevealCommandAdapter;
  cancel: () => void;
} {
  let focusedInput = false;
  let cancelled = false;
  let selectionWaiter: ((changed: boolean) => void) | undefined;
  const selected = [selectedIndex === 0, selectedIndex === 1];
  const commands: string[] = [];
  const repositories = ['one', 'two'].map((key, index) => ({
    key,
    isSelected: () => selected[index] ?? false
  }));
  const adapter: RevealCommandAdapter = {
    getCommands: () => Promise.resolve(focusCommandAvailable ? [FOCUS_NEXT_INPUT_COMMAND] : []),
    execute: (command) => {
      commands.push(command);
      if (command === FOCUS_NEXT_INPUT_COMMAND) {
        let changed = false;
        if (focusedInput) {
          const current = selected.findIndex(Boolean);
          selected[current] = false;
          selected[(current + 1) % selected.length] = true;
          changed = true;
        }
        focusedInput = true;
        selectionWaiter?.(changed);
        selectionWaiter = undefined;
      }
      return Promise.resolve();
    },
    waitForSelectionChange: () => new Promise((resolve) => { selectionWaiter = resolve; }),
    isCancelled: () => cancelled
  };
  return { repositories, commands, adapter, cancel: () => { cancelled = true; } };
}

test('focuses and expands a selected native repository on the first click command', async () => {
  const { repositories, commands, adapter } = harness(0);
  assert.equal(await revealNativeRepository(repositories, 'one', adapter), 'focused');
  assert.deepEqual(commands, [OPEN_SCM_COMMAND, FOCUS_NEXT_INPUT_COMMAND]);
});

test('cycles native repository inputs until the clicked repository is selected', async () => {
  const { repositories, commands, adapter } = harness(0);
  assert.equal(await revealNativeRepository(repositories, 'two', adapter), 'focused');
  assert.deepEqual(commands, [OPEN_SCM_COMMAND, FOCUS_NEXT_INPUT_COMMAND, FOCUS_NEXT_INPUT_COMMAND]);
});

test('expands all visible repositories when the exact focus command is unavailable', async () => {
  const { repositories, commands, adapter } = harness(0, false);
  assert.equal(await revealNativeRepository(repositories, 'two', adapter), 'expanded-all');
  assert.deepEqual(commands, [OPEN_SCM_COMMAND, EXPAND_ALL_REPOSITORIES_COMMAND]);
});

test('does nothing when the clicked repository has closed', async () => {
  const { repositories, commands, adapter } = harness(0);
  assert.equal(await revealNativeRepository(repositories, 'missing', adapter), 'missing');
  assert.deepEqual(commands, []);
});

test('stops before issuing commands when a newer reveal request cancels it', async () => {
  const { repositories, commands, adapter, cancel } = harness(0);
  cancel();
  assert.equal(await revealNativeRepository(repositories, 'two', adapter), 'cancelled');
  assert.deepEqual(commands, []);
});

# Solver Optimization Results

The four proposed optimizations were tested independently on 2026-07-16. Only
shared-board mutation met the retention rule: preserve every expected result,
improve a representative large case by at least 10%, and avoid a regression
greater than 10% on another large case.

## Choose the Most Constrained Slot First

**Priority: High. Status: Rejected.** The attempted selector counted compatible
unused words for every remaining slot and chose the first slot with the lowest
count. It improved the food puzzle by 11.1%, but slowed the reversed beach case
by 16.1%, so it failed the regression limit.

## Mutate One Shared Board and Undo Changes

**Priority: Medium. Status: Retained in `6d56690`.** `placeWord` now writes
letters directly into the board and returns only coordinates that were `null`
before placement. `undoWordPlacement` restores those coordinates after each
recursive call. Existing crossing letters are never recorded or erased.

The board remains local to `solve`, and a completed board is copied only when a
solution is recorded. This improved all three large scenarios by 15.5% to
16.8% relative to the baseline.

## Track Used Word Indexes

**Priority: Low. Status: Rejected.** A boolean array replaced each recursive
`remainingWords.filter` allocation. It improved the retained shared-board stage
by 5.4% to 7.1%, which was below the 10% retention threshold.

## Advance Through Slots by Index

**Priority: Low. Status: Rejected.** Passing a numeric slot index removed the
`[slot, ...nextSlots]` allocation, but slowed all three measured scenarios by
2.8% to 6.9% relative to the retained shared-board stage.

## Measurements

Measurements used Node.js `v24.18.0` on the same machine and branch worktree.
A temporary uncommitted harness suppressed solver output, performed 20 warmup
calls per scenario, and ran three timed batches. Beach and reversed beach used
12,000 calls per batch; food used 15,000. Values below are milliseconds per
solver call, with the median shown after the three samples.

| Stage | Beach | Reversed beach | Food | Decision |
| --- | --- | --- | --- | --- |
| Baseline `fdd210d` | 0.046830 / 0.043410 / 0.042591 (0.043410) | 0.042767 / 0.043072 / 0.042739 (0.042767) | 0.034937 / 0.034125 / 0.034023 (0.034125) | Baseline |
| Constrained slot | 0.050314 / 0.046753 / 0.046016 (0.046753) | 0.050736 / 0.049642 / 0.049189 (0.049642) | 0.030623 / 0.030237 / 0.030341 (0.030341) | Rejected |
| Shared board `6d56690` | 0.040366 / 0.036101 / 0.035979 (0.036101) | 0.036114 / 0.035911 / 0.035529 (0.035911) | 0.029477 / 0.028816 / 0.028655 (0.028816) | Retained |
| Used word indexes | 0.038262 / 0.034164 / 0.033830 (0.034164) | 0.033733 / 0.033804 / 0.033832 (0.033804) | 0.026776 / 0.026768 / 0.026538 (0.026768) | Rejected |
| Slot index | 0.044095 / 0.038600 / 0.037124 (0.038600) | 0.036911 / 0.037538 / 0.036910 (0.036911) | 0.030953 / 0.029481 / 0.029760 (0.029760) | Rejected |

The official small, beach, reversed-beach, food, malformed, ambiguous, and
no-solution audit cases passed before and after the retained change. Run them
with:

```bash
node --test test/crosswordSolver.test.js
```

Do not treat `process.memoryUsage().heapUsed` alone as an allocation benchmark;
garbage collection timing makes it too variable for this decision.

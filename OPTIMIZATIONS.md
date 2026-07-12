# Future Solver Optimizations

The current solver favors clarity over performance. Consider these changes only
after the baseline behavior and tests are stable.

## Choose the Most Constrained Slot First

**Priority: High.** Before each recursive step, choose the unfilled slot with
the fewest compatible unused words. This preserves correctness but can reject
impossible branches much earlier than always using the next slot in reading
order. Measure it on the large and ambiguous scenarios before keeping it.

## Mutate One Shared Board and Undo Changes

**Priority: Medium.** `placeWord` currently returns a copied board for each
candidate. Later, avoid cloning every board row for each candidate:

1. Write the candidate letters directly into one shared board.
2. Record only positions that were `null` before this placement.
3. Recurse with the same board.
4. Set only those recorded positions back to `null` when backtracking.

Do not erase letters that were already present: they belong to crossing words
placed earlier in the search. Keep the board local to `solve` rather than using
a module-global variable, so repeated calls to `crosswordSolver` remain
independent.

## Track Used Word Indexes

**Priority: Low.** The solver currently creates `nextWords` with `filter` for
every candidate. Keep the original `words` array and mark chosen indexes in a
`Set` or boolean array instead. Add an index before recursion and remove it
after recursion. This removes small allocations but adds mutable state.

## Advance Through Slots by Index

**Priority: Low.** The expression `[slot, ...nextSlots]` creates a new slots
array at every level. Pass a `slotIndex` into the recursive function and read
`slots[slotIndex]`. This is a minor allocation reduction and pairs naturally
with used word indexes.

## Measurements

Measure one change at a time. Compare it with the unmodified baseline using the
same Node version, machine state, and inputs.

### Inputs

Use the published [crossword audit cases](https://public.01-edu.org/subjects/crossword/audit/):

1. The small valid puzzle.
2. The large valid puzzle with words in its original order.
3. The same large valid puzzle with its words reversed.
4. The ambiguous `abba` / `assa` puzzle.
5. A no-solution puzzle such as the `aaab` / `aaac` / `aaad` / `aaae` case.

Run `node --test test/crosswordSolver.test.js` before and after every
optimization. Also run every audit case normally to confirm that valid cases
print their expected boards and invalid or ambiguous cases print an error. The
large valid inputs are the primary timing scenarios; invalid inputs are mostly
correctness checks because they may finish quickly.

### Timing Procedure

Run the committed timer:

```bash
node timer.js
```

`timer.js` starts with the small valid audit puzzle. Replace its `puzzle` and
`words` constants with one audit case at a time, then adjust `ITERATIONS` if the
result is too noisy. The timer suppresses crossword output and reports average
milliseconds per solver call, so printing does not dominate the measurement.

### Recording Results

For every baseline and optimization, record:

1. `git rev-parse --short HEAD`.
2. `node --version`.
3. Scenario name and iteration count.
4. The average reported by three timer runs.
5. Whether the normal, unsuppressed run produced the expected output or error.

Retain an optimization only when it preserves all expected results and improves
the typical timer result by at least 10% on a representative large or ambiguous
case. Prefer the clearer implementation for smaller gains. Do not use
`process.memoryUsage().heapUsed` alone as an allocation metric: garbage
collection timing makes it too variable for this decision.

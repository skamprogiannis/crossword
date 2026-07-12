# Future Solver Optimizations

The current solver favors clarity while the backtracking algorithm is being
completed. Consider these changes only after `placeWord` has a tested
implementation and the baseline behavior is stable.

## Mutate One Shared Board and Undo Changes

`placeWord` currently has a TODO. Its first implementation can return a copied
board for clarity. Later, avoid cloning every board row for each candidate:

1. Write the candidate letters directly into one shared board.
2. Record only positions that were `null` before this placement.
3. Recurse with the same board.
4. Set only those recorded positions back to `null` when backtracking.

Do not erase letters that were already present: they belong to crossing words
placed earlier in the search. Keep the board local to `solve` rather than using
a module-global variable, so repeated calls to `crosswordSolver` remain
independent.

## Track Used Word Indexes

The solver currently creates `nextWords` with `filter` for every candidate.
Keep the original `words` array and mark chosen indexes in a `Set` or boolean
array instead. Add an index before recursion and remove it after recursion.

## Advance Through Slots by Index

The expression `[slot, ...nextSlots]` creates a new slots array at every level.
Pass a `slotIndex` into the recursive function and read `slots[slotIndex]`.
This retains the fixed slots array for the entire search.

## Choose the Most Constrained Slot First

Before each recursive step, choose the unfilled slot with the fewest compatible
unused words. This preserves correctness but usually rejects impossible branches
earlier than always using the next slot in reading order.

## Stop Tracking Full Solution Arrays

The solver only needs to distinguish zero, one, and more than one solution.
Store the first solved board and a numeric solution count, stopping as soon as
the second solution is found. This avoids retaining a second board solely to
detect ambiguity.

## Measure Before Optimizing

Use the published audit puzzles and a few deliberately ambiguous puzzles as a
baseline. Keep each optimization only if it improves runtime without making the
backtracking and undo logic harder to verify.

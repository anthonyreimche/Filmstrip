// Standalone verification of the windowing math (no app/DOM needed). Bundled
// with rolldown and run under Node.

import {
  cellOffset,
  scrollIntoView,
  stripLength,
  visibleRange,
} from "../src/strip-math";

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean, detail = ""): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name} ${detail}`);
  }
}
function eq<T>(name: string, got: T, want: T): void {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  ok(name, g === w, `got ${g}, want ${w}`);
}

// cell 100, gap 4 → stride 104; pad 6.

console.log("stripLength");
eq("empty strip has no length", stripLength(0, 100, 4, 6), 0);
eq("single cell = pads + cell", stripLength(1, 100, 4, 6), 112);
eq("n cells add n-1 gaps", stripLength(3, 100, 4, 6), 6 + 300 + 8 + 6);

console.log("cellOffset");
eq("first cell sits after the pad", cellOffset(0, 100, 4, 6), 6);
eq("later cells step by stride", cellOffset(2, 100, 4, 6), 6 + 208);

console.log("visibleRange");
eq(
  "empty catalog renders nothing",
  visibleRange(0, 500, 100, 4, 0, 2),
  { start: 0, end: 0 },
);
eq(
  "zero viewport renders nothing",
  visibleRange(0, 0, 100, 4, 50, 2),
  { start: 0, end: 0 },
);
eq(
  "start of strip clamps to 0 and overscans the end",
  visibleRange(0, 500, 100, 4, 50, 2),
  { start: 0, end: 7 }, // ceil(500/104)=5, +2 overscan
);
eq(
  "mid-strip windows around the scroll position",
  visibleRange(1040, 500, 100, 4, 50, 2),
  { start: 8, end: 17 }, // floor(1040/104)=10 -2; ceil(1540/104)=15 +2
);
eq(
  "end of strip clamps to count",
  visibleRange(10000, 500, 100, 4, 50, 2),
  { start: 50, end: 50 },
);

console.log("scrollIntoView");
eq(
  "already visible → no scroll",
  scrollIntoView(0, 500, 2, 100, 4, 6),
  null,
);
eq(
  "before the window → align to leading edge minus pad",
  scrollIntoView(1040, 500, 3, 100, 4, 6),
  cellOffset(3, 100, 4, 6) - 6,
);
eq(
  "index 0 never scrolls negative",
  scrollIntoView(1040, 500, 0, 100, 4, 6),
  0,
);
eq(
  "past the window → align trailing edge plus pad",
  scrollIntoView(0, 500, 10, 100, 4, 6),
  cellOffset(10, 100, 4, 6) + 100 + 6 - 500,
);
ok(
  "a cell wider than the viewport still lands its leading edge",
  (scrollIntoView(0, 80, 5, 100, 4, 6) ?? 0) > 0,
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

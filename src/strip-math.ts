// Windowing math for the virtualized strip: one scroll container over `count`
// square cells of `cell` px separated by `gap` px, with `pad` px of breathing
// room at both ends. Pure and DOM-free so it can be node-tested.

export interface StripWindow {
  /** First rendered index (inclusive). */
  start: number;
  /** Last rendered index (exclusive). */
  end: number;
}

/** The index range worth rendering for a viewport of `viewport` px scrolled to
 *  `scroll` px, padded by `overscan` cells on both sides. */
export function visibleRange(
  scroll: number,
  viewport: number,
  cell: number,
  gap: number,
  count: number,
  overscan: number,
): StripWindow {
  const stride = cell + gap;
  if (stride <= 0 || count <= 0 || viewport <= 0) return { start: 0, end: 0 };
  const start = Math.min(count, Math.max(0, Math.floor(scroll / stride) - overscan));
  const end = Math.min(count, Math.ceil((scroll + viewport) / stride) + overscan);
  return { start, end: Math.max(start, end) };
}

/** Leading-edge offset of cell `index` within the strip. */
export function cellOffset(index: number, cell: number, gap: number, pad: number): number {
  return pad + index * (cell + gap);
}

/** Total scrollable length of the strip. */
export function stripLength(count: number, cell: number, gap: number, pad: number): number {
  if (count <= 0) return 0;
  return pad * 2 + count * cell + (count - 1) * gap;
}

/** Scroll offset that brings cell `index` fully into a `viewport` px window
 *  currently at `scroll`, or null when it is already fully visible. Nudges by
 *  the strip padding so the cell lands with breathing room at the edge. */
export function scrollIntoView(
  scroll: number,
  viewport: number,
  index: number,
  cell: number,
  gap: number,
  pad: number,
): number | null {
  const lead = cellOffset(index, cell, gap, pad);
  const tail = lead + cell;
  if (lead < scroll) return Math.max(0, lead - pad);
  if (tail > scroll + viewport) return tail + pad - viewport;
  return null;
}

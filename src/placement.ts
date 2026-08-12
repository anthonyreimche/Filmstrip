// Where the strip is docked right now, published for the settings section:
// Preferences renders outside the dock, so it can't read the panel's placement
// context itself. The panel reports its side while mounted; the last value
// sticks once it closes (the dock reopens a panel where it left it).

import { React } from "./rt";
import type { PanelPlacement } from "./safelight-api";

type Side = PanelPlacement["side"] | null;

let side: Side = null;
const listeners = new Set<() => void>();

export function setStripPlacement(next: Side): void {
  if (next === side) return;
  side = next;
  for (const l of listeners) l();
}

export function useStripPlacement(): Side {
  return React.useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => side,
  );
}

/** A vertical strip has room for rows; a bottom rail is one thumbnail tall.
 *  Unknown placement counts as horizontal — the panel defaults to the bottom. */
export function isVertical(s: Side): boolean {
  return s != null && s !== "bottom";
}

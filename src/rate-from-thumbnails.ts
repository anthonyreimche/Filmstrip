// Whether the hover stars on the strip's thumbnails set ratings. Off by
// default: in a narrow strip the stars cover much of the cell, so a click meant
// to select a photo could rate it instead. Ratings stay on the 1–5 / 0 keys and
// the right-click menu either way.

import { React, api } from "./rt";

const KEY = "rateFromThumbnails";

export function useRateFromThumbnails(): boolean {
  return React.useSyncExternalStore(
    (onChange) => api.settings.onChange(onChange),
    () => api.settings.get(KEY, false),
  );
}

export function setRateFromThumbnails(value: boolean): void {
  api.settings.set(KEY, value);
}

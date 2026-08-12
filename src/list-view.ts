// The strip's grid/list preference. Persisted through the app's per-extension
// settings (so it survives restarts and syncs across windows) and read as a
// hook, since the header toggle and the strip body are separate components.

import { React, api } from "./rt";

const KEY = "listView";

export function useListView(): boolean {
  return React.useSyncExternalStore(
    (onChange) => api.settings.onChange(onChange),
    () => api.settings.get(KEY, false),
  );
}

export function setListView(value: boolean): void {
  api.settings.set(KEY, value);
}

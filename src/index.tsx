// Filmstrip — a dockable thumbnail strip for Safelight's Develop module.
// Registers one fill panel that defaults to a horizontal bottom rail under the
// canvas and re-orients itself when dragged to a side rail, plus an F6 toggle.

import { initRuntime, api } from "./rt";
import { FilmstripPanel } from "./Filmstrip";
import { FilmstripSettings } from "./Settings";
import type { SafelightAPI } from "./safelight-api";

const EXT_ID = "com.safelight.filmstrip";
const PANEL_ID = `${EXT_ID}.panel`;

export function activate(a: SafelightAPI): void {
  initRuntime(a);

  api.registerPanel({
    id: PANEL_ID,
    title: "Filmstrip",
    component: FilmstripPanel,
    fill: true,
    // The strip lays out horizontally, so it may live in a bottom rail. Panels
    // are vertical columns unless they opt in like this.
    allowBottomDock: true,
    defaultDock: { module: "develop", direction: "bottom", order: 0, height: 112 },
  });

  api.registerKeybinding({
    id: `${EXT_ID}.toggle`,
    label: "Toggle Filmstrip",
    category: "General",
    defaultCombo: "F6",
    handler: () => api.dock.togglePanel(PANEL_ID),
  });

  api.registerSettings({
    title: "Filmstrip",
    fields: [],
    component: FilmstripSettings,
    keywords: ["list view", "rows", "thumbnails", "filmstrip"],
  });
}

export function deactivate(): void {
  // Contributions are swept by the host; nothing out-of-band to tear down.
}

# Filmstrip
Vertical/horizontal filmstrip for Safelight

A resizable strip of thumbnails docked under the Develop canvas, showing exactly
what your Library is showing: same folder, same filters, same sort order. Move
through a shoot, compare frames and cull without ever leaving the editor.

## Use it

Press **F6**, or open **View ▸ Filmstrip**. The strip docks along the bottom of
the Develop module.

- **Click** a thumbnail to open it. **Ctrl+click** adds or removes it from the
  selection, **Shift+click** selects a range, **double-click** opens it in
  Develop from anywhere.
- **←/→** step through photos as they always have. The strip follows and scrolls
  the active photo into view.
- **Drag the top edge** to resize. Thumbnails grow and shrink with the strip.
- The **mouse wheel** scrolls it, no need to aim for the scrollbar.
- **Click the header** to fold the strip down out of the way, and again to bring
  it back at the same size.
- Hover a thumbnail for its star control. Ratings, flags, colour labels and
  virtual-copy names all read the same as the Library grid.

## Cull without leaving Develop

Every Library shortcut works while the strip is open, including any you have
rebound under *Preferences ▸ Shortcuts*:

| Keys | Action |
|---|---|
| `1`–`5`, `0` | Rate, clear rating |
| `P`, `X`, `U` | Pick, reject, unflag |
| `6`–`9` | Colour labels |
| `Alt+[`, `Alt+]` | Rotate |
| `F2` | Rename |
| `Ctrl+R` | Show in folder |
| `Delete` | Remove from catalogue |
| `Ctrl+A` | Select everything the strip is showing |

Develop keeps its own keys where they overlap: `Delete` still deletes a selected
mask component while you are painting one.

**Right-click** any frame for the Library's context menu: open, rename, show in
folder, copy and paste settings, rotate, re-import, export data, remove, delete
from disk. Menu items added by your other extensions (Virtual Copies and
friends) appear here too.

## Dock it anywhere

The strip is a normal Safelight dock panel. Drag its header to a left or right
rail for a vertical filmstrip, or drop it anywhere else to float it. It
remembers where you left it.

Docked vertically it can also show the Library's list rows instead of
thumbnails: filename, flags and rating at a glance, plus dimensions and camera
once the rail is wide enough.

## Settings

*Preferences ▸ Extensions ▸ Filmstrip*

| Setting | Default | Notes |
|---|---|---|
| List view | Off | Rows instead of thumbnails. Only offered while the strip is docked left, right or floating, since a strip along the bottom is one thumbnail tall. |

## How it works

The photo order comes from `api.catalog.useVisiblePhotos()`, the same list the
Library grid renders and the arrow keys walk, extension filters and custom sorts
included, so the strip never disagrees with the grid.

Cells are Safelight's own thumbnail and list-row components, and the menu and
shortcuts are core's (`usePhotoActions`, `useCullingShortcuts`) rather than a
reimplementation. That is why they match the grid down to your rebound keys and
other extensions' menu items. Thumbnails load lazily as they scroll into view
and the strip is virtualised, so large catalogues stay smooth.

Orientation comes from `api.dock.usePanelPlacement()`. Bottom dock rails are a
core capability added alongside this extension, opt-in per panel, so a vertical
panel can never be dragged into a horizontal strip.

## Requirements

Safelight **2.5.1** or newer.

## Building

```
npm install
npm run build    # bundles src/ to dist/index.js (committed)
npm run test     # windowing math, node only
```

The in-app store fetches `safelight.json` and `dist/index.js` straight from the
repo, so `dist/` is committed and no build runs at install time. Publish by
tagging the GitHub repo with the `safelight-extension` topic.

MIT licensed.

// Preferences ▸ Extensions ▸ Filmstrip. A custom section rather than a
// declarative field because the one setting is layout-dependent: list view
// needs rows, which only a vertically docked strip has room for, so the toggle
// appears only while the strip is docked left, right or floating.

import { React, ui } from "./rt";
import { setListView, useListView } from "./list-view";
import { isVertical, useStripPlacement } from "./placement";

export function FilmstripSettings() {
  const list = useListView();
  const vertical = isVertical(useStripPlacement());

  if (!vertical) {
    return (
      <p style={{ fontSize: 10, lineHeight: 1.6, color: ui.tokens.textMuted }}>
        Dock the filmstrip to the left or right (drag its header) for the list
        view setting. A strip along the bottom is one thumbnail tall, with no
        room for rows.
      </p>
    );
  }

  return (
    <ui.Field hint="Swap the thumbnails for the Library's list rows — filename, flags and rating, with dimensions and camera once the rail is wide enough.">
      <ui.Toggle checked={list} onChange={setListView} label="List view" />
    </ui.Field>
  );
}

// Preferences ▸ Extensions ▸ Filmstrip. A custom section rather than declarative
// fields because list view is layout-dependent: it needs rows, which only a
// vertically docked strip has room for, so that toggle appears only while the
// strip is docked left, right or floating.

import { React, ui } from "./rt";
import { setListView, useListView } from "./list-view";
import { isVertical, useStripPlacement } from "./placement";
import { setRateFromThumbnails, useRateFromThumbnails } from "./rate-from-thumbnails";

export function FilmstripSettings() {
  const list = useListView();
  const rate = useRateFromThumbnails();
  const vertical = isVertical(useStripPlacement());

  return (
    <>
      <ui.Field hint="Click a thumbnail's stars to rate it. Off, the stars only show the rating, so a click anywhere on the thumbnail selects it. The 1–5 and 0 keys and the right-click menu rate either way.">
        <ui.Toggle checked={rate} onChange={setRateFromThumbnails} label="Rate from thumbnails" />
      </ui.Field>
      {vertical ? (
        <ui.Field hint="Swap the thumbnails for the Library's list rows — filename, flags and rating, with dimensions and camera once the rail is wide enough.">
          <ui.Toggle checked={list} onChange={setListView} label="List view" />
        </ui.Field>
      ) : (
        <p style={{ fontSize: 10, lineHeight: 1.6, color: ui.tokens.textMuted }}>
          Dock the filmstrip to the left or right (drag its header) for the list
          view setting. A strip along the bottom is one thumbnail tall, with no
          room for rows.
        </p>
      )}
    </>
  );
}

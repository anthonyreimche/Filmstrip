// The filmstrip panel. Renders the Library's current visible order as one
// virtualized strip of core cells — horizontal thumbnails when docked in a
// bottom rail, vertical thumbnails or list rows in a side rail or floating
// window. The thumbnail size follows the rail's cross-axis, so resizing the
// rail resizes the cells (Lightroom behavior).
//
// Selection, the right-click menu and the culling shortcuts all come from core,
// so the strip behaves exactly like the Library grid — extension-contributed
// menu items and rebound keys included.

import { React, api, ui } from "./rt";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useListView } from "./list-view";
import { setStripPlacement } from "./placement";
import { cellOffset, scrollIntoView, stripLength, visibleRange } from "./strip-math";

const PAD = 6;
const GAP = 4;
const MIN_CELL = 40;
const OVERSCAN = 8;
/** Core's list-row height (LibraryGrid renders the same rows at 53px). */
const LIST_ROW = 53;
/** Rows below this width drop their dimension and camera columns. */
const LIST_COMPACT_WIDTH = 460;
/** Fixed strip height while floating (a floating panel has no rail to fill). */
const FLOAT_HEIGHT = 420;

export function FilmstripPanel() {
  const { side } = api.dock.usePanelPlacement();
  const horizontal = side === "bottom";
  const photos = api.catalog.useVisiblePhotos();
  const useCatalogStore = api.stores.useCatalogStore;
  const activePhotoId = useCatalogStore((s) => s.activePhotoId);
  const selectedIds = useCatalogStore((s) => s.selectedIds);
  const select = useCatalogStore((s) => s.select);
  const toggleSelect = useCatalogStore((s) => s.toggleSelect);
  const selectRange = useCatalogStore((s) => s.selectRange);
  const setRating = useCatalogStore((s) => s.setRating);

  // Rating, flag, label, rotate, remove/delete, rename, reveal and select-all,
  // on the same rebindable combos the grid uses. The strip sizes its cells from
  // the rail, so it leaves - / = to the Library grid.
  api.catalog.useCullingShortcuts({ sizeSteps: false });
  const { onContextMenu, overlays } = api.catalog.usePhotoActions();

  // A list needs rows, which a one-thumbnail-tall bottom rail has no room for.
  const list = useListView() && !horizontal;

  // Preferences renders outside the dock and can't read the placement context,
  // so publish it for the settings section.
  React.useEffect(() => setStripPlacement(side), [side]);

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [box, setBox] = React.useState({ main: 0, cross: 0 });
  const [scroll, setScroll] = React.useState(0);

  // Track the scroller's box (main = scroll axis) so cells follow rail resizes.
  // clientWidth/Height already exclude the always-on scrollbar below.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () =>
      setBox(
        horizontal
          ? { main: el.clientWidth, cross: el.clientHeight }
          : { main: el.clientHeight, cross: el.clientWidth },
      );
    measure();
    setScroll(horizontal ? el.scrollLeft : el.scrollTop);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [horizontal]);

  // A vertical wheel scrolls the horizontal strip (the only scrollable axis).
  // Native non-passive listener so the consumed event can't bubble-scroll.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !horizontal) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.deltaY || e.deltaX) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [horizontal]);

  const thumb = Math.max(MIN_CELL, box.cross - PAD * 2);
  // Extent along the scroll axis: a square thumbnail, or a full-width row.
  const step = list ? LIST_ROW : thumb;
  const gap = list ? 0 : GAP;
  const pad = list ? 0 : PAD;
  const count = photos.length;
  const activeIndex = activePhotoId
    ? photos.findIndex((p) => p.id === activePhotoId)
    : -1;

  // Keep the active photo in view as core's ←/→ (or the Library) moves it.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el || activeIndex < 0 || !box.main) return;
    const target = scrollIntoView(
      horizontal ? el.scrollLeft : el.scrollTop,
      box.main,
      activeIndex,
      step,
      gap,
      pad,
    );
    if (target == null) return;
    el.scrollTo(
      horizontal
        ? { left: target, behavior: "smooth" }
        : { top: target, behavior: "smooth" },
    );
  }, [activeIndex, horizontal, step, gap, pad, box.main]);

  // Stable id-taking handlers so a selection change re-renders only the two
  // memoized cells whose selected/active flipped (mirrors the Library grid).
  const photosRef = React.useRef(photos);
  photosRef.current = photos;

  const handleClick = React.useCallback(
    (id: string, e: ReactMouseEvent) => {
      if (e.shiftKey) selectRange(id, photosRef.current.map((p) => p.id));
      else if (e.ctrlKey || e.metaKey) toggleSelect(id);
      else select(id);
    },
    [select, toggleSelect, selectRange],
  );

  const handleDoubleClick = React.useCallback(
    (id: string) => {
      select(id);
      api.navigation.goTo("develop");
    },
    [select],
  );

  const handleRate = React.useCallback(
    (id: string, rating: number) => void setRating(id, rating),
    [setRating],
  );

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (el) setScroll(horizontal ? el.scrollLeft : el.scrollTop);
  };

  if (count === 0) {
    return (
      <div
        style={{
          height: side === "float" ? 120 : "100%",
          minHeight: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ui.tokens.textMuted,
          fontSize: 11,
        }}
      >
        No photos
      </div>
    );
  }

  const { start, end } = visibleRange(scroll, box.main, step, gap, count, OVERSCAN);
  const total = stripLength(count, step, gap, pad);
  const Thumbnail = api.components.Thumbnail;
  const PhotoListRow = api.components.PhotoListRow;

  return (
    <div style={{ height: side === "float" ? FLOAT_HEIGHT : "100%" }}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        style={{
          height: "100%",
          minHeight: horizontal ? 0 : 96,
          overflowX: horizontal ? "scroll" : "hidden",
          overflowY: horizontal ? "hidden" : "scroll",
          position: "relative",
        }}
      >
        <div
          style={
            horizontal
              ? { width: total, height: "100%", position: "relative" }
              : { height: total, width: "100%", position: "relative" }
          }
        >
          {photos.slice(start, end).map((p, i) => {
            const offset = cellOffset(start + i, step, gap, pad);
            return (
              <div
                key={p.id}
                style={
                  horizontal
                    ? { position: "absolute", left: offset, top: pad }
                    : list
                      ? { position: "absolute", top: offset, left: 0, right: 0 }
                      : { position: "absolute", top: offset, left: pad }
                }
              >
                {list ? (
                  <PhotoListRow
                    photo={p}
                    selected={selectedIds.has(p.id)}
                    active={p.id === activePhotoId}
                    compact={box.cross < LIST_COMPACT_WIDTH}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={onContextMenu}
                  />
                ) : (
                  <Thumbnail
                    photo={p}
                    selected={selectedIds.has(p.id)}
                    active={p.id === activePhotoId}
                    size={thumb}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    onContextMenu={onContextMenu}
                    onRatingChange={handleRate}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {overlays}
    </div>
  );
}

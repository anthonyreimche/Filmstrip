//#region src/rt.ts
let React;
let api;
let ui;
function initRuntime(a) {
	api = a;
	React = a.react;
	ui = a.ui;
}

//#endregion
//#region src/list-view.ts
const KEY = "listView";
function useListView() {
	return React.useSyncExternalStore((onChange) => api.settings.onChange(onChange), () => api.settings.get(KEY, false));
}
function setListView(value) {
	api.settings.set(KEY, value);
}

//#endregion
//#region src/placement.ts
let side = null;
const listeners = /* @__PURE__ */ new Set();
function setStripPlacement(next) {
	if (next === side) return;
	side = next;
	for (const l of listeners) l();
}
function useStripPlacement() {
	return React.useSyncExternalStore((onChange) => {
		listeners.add(onChange);
		return () => listeners.delete(onChange);
	}, () => side);
}
/** A vertical strip has room for rows; a bottom rail is one thumbnail tall.
*  Unknown placement counts as horizontal — the panel defaults to the bottom. */
function isVertical(s) {
	return s != null && s !== "bottom";
}

//#endregion
//#region src/strip-math.ts
/** The index range worth rendering for a viewport of `viewport` px scrolled to
*  `scroll` px, padded by `overscan` cells on both sides. */
function visibleRange(scroll, viewport, cell, gap, count, overscan) {
	const stride = cell + gap;
	if (stride <= 0 || count <= 0 || viewport <= 0) return {
		start: 0,
		end: 0
	};
	const start = Math.min(count, Math.max(0, Math.floor(scroll / stride) - overscan));
	const end = Math.min(count, Math.ceil((scroll + viewport) / stride) + overscan);
	return {
		start,
		end: Math.max(start, end)
	};
}
/** Leading-edge offset of cell `index` within the strip. */
function cellOffset(index, cell, gap, pad) {
	return pad + index * (cell + gap);
}
/** Total scrollable length of the strip. */
function stripLength(count, cell, gap, pad) {
	if (count <= 0) return 0;
	return pad * 2 + count * cell + (count - 1) * gap;
}
/** Scroll offset that brings cell `index` fully into a `viewport` px window
*  currently at `scroll`, or null when it is already fully visible. Nudges by
*  the strip padding so the cell lands with breathing room at the edge. */
function scrollIntoView(scroll, viewport, index, cell, gap, pad) {
	const lead = cellOffset(index, cell, gap, pad);
	const tail = lead + cell;
	if (lead < scroll) return Math.max(0, lead - pad);
	if (tail > scroll + viewport) return tail + pad - viewport;
	return null;
}

//#endregion
//#region src/Filmstrip.tsx
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
function FilmstripPanel() {
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
	api.catalog.useCullingShortcuts({ sizeSteps: false });
	const { onContextMenu, overlays } = api.catalog.usePhotoActions();
	const list = useListView() && !horizontal;
	React.useEffect(() => setStripPlacement(side), [side]);
	const scrollerRef = React.useRef(null);
	const [box, setBox] = React.useState({
		main: 0,
		cross: 0
	});
	const [scroll, setScroll] = React.useState(0);
	React.useEffect(() => {
		const el = scrollerRef.current;
		if (!el) return;
		const measure = () => setBox(horizontal ? {
			main: el.clientWidth,
			cross: el.clientHeight
		} : {
			main: el.clientHeight,
			cross: el.clientWidth
		});
		measure();
		setScroll(horizontal ? el.scrollLeft : el.scrollTop);
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, [horizontal]);
	React.useEffect(() => {
		const el = scrollerRef.current;
		if (!el || !horizontal) return;
		const onWheel = (e) => {
			if (!e.deltaY || e.deltaX) return;
			el.scrollLeft += e.deltaY;
			e.preventDefault();
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => el.removeEventListener("wheel", onWheel);
	}, [horizontal]);
	const thumb = Math.max(MIN_CELL, box.cross - 12);
	const step = list ? LIST_ROW : thumb;
	const gap = list ? 0 : GAP;
	const pad = list ? 0 : PAD;
	const count = photos.length;
	const activeIndex = activePhotoId ? photos.findIndex((p) => p.id === activePhotoId) : -1;
	React.useEffect(() => {
		const el = scrollerRef.current;
		if (!el || activeIndex < 0 || !box.main) return;
		const target = scrollIntoView(horizontal ? el.scrollLeft : el.scrollTop, box.main, activeIndex, step, gap, pad);
		if (target == null) return;
		el.scrollTo(horizontal ? {
			left: target,
			behavior: "smooth"
		} : {
			top: target,
			behavior: "smooth"
		});
	}, [
		activeIndex,
		horizontal,
		step,
		gap,
		pad,
		box.main
	]);
	const photosRef = React.useRef(photos);
	photosRef.current = photos;
	const handleClick = React.useCallback((id, e) => {
		if (e.shiftKey) selectRange(id, photosRef.current.map((p) => p.id));
		else if (e.ctrlKey || e.metaKey) toggleSelect(id);
		else select(id);
	}, [
		select,
		toggleSelect,
		selectRange
	]);
	const handleDoubleClick = React.useCallback((id) => {
		select(id);
		api.navigation.goTo("develop");
	}, [select]);
	const handleRate = React.useCallback((id, rating) => void setRating(id, rating), [setRating]);
	const handleScroll = () => {
		const el = scrollerRef.current;
		if (el) setScroll(horizontal ? el.scrollLeft : el.scrollTop);
	};
	if (count === 0) return /* @__PURE__ */ React.createElement("div", { style: {
		height: side === "float" ? 120 : "100%",
		minHeight: 48,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		color: ui.tokens.textMuted,
		fontSize: 11
	} }, "No photos");
	const { start, end } = visibleRange(scroll, box.main, step, gap, count, OVERSCAN);
	const total = stripLength(count, step, gap, pad);
	const Thumbnail = api.components.Thumbnail;
	const PhotoListRow = api.components.PhotoListRow;
	return /* @__PURE__ */ React.createElement("div", { style: { height: side === "float" ? FLOAT_HEIGHT : "100%" } }, /* @__PURE__ */ React.createElement("div", {
		ref: scrollerRef,
		onScroll: handleScroll,
		style: {
			height: "100%",
			minHeight: horizontal ? 0 : 96,
			overflowX: horizontal ? "scroll" : "hidden",
			overflowY: horizontal ? "hidden" : "scroll",
			position: "relative"
		}
	}, /* @__PURE__ */ React.createElement("div", { style: horizontal ? {
		width: total,
		height: "100%",
		position: "relative"
	} : {
		height: total,
		width: "100%",
		position: "relative"
	} }, photos.slice(start, end).map((p, i) => {
		const offset = cellOffset(start + i, step, gap, pad);
		return /* @__PURE__ */ React.createElement("div", {
			key: p.id,
			style: horizontal ? {
				position: "absolute",
				left: offset,
				top: pad
			} : list ? {
				position: "absolute",
				top: offset,
				left: 0,
				right: 0
			} : {
				position: "absolute",
				top: offset,
				left: pad
			}
		}, list ? /* @__PURE__ */ React.createElement(PhotoListRow, {
			photo: p,
			selected: selectedIds.has(p.id),
			active: p.id === activePhotoId,
			compact: box.cross < LIST_COMPACT_WIDTH,
			onClick: handleClick,
			onDoubleClick: handleDoubleClick,
			onContextMenu
		}) : /* @__PURE__ */ React.createElement(Thumbnail, {
			photo: p,
			selected: selectedIds.has(p.id),
			active: p.id === activePhotoId,
			size: thumb,
			onClick: handleClick,
			onDoubleClick: handleDoubleClick,
			onContextMenu,
			onRatingChange: handleRate
		}));
	}))), overlays);
}

//#endregion
//#region src/Settings.tsx
function FilmstripSettings() {
	const list = useListView();
	if (!isVertical(useStripPlacement())) return /* @__PURE__ */ React.createElement("p", { style: {
		fontSize: 10,
		lineHeight: 1.6,
		color: ui.tokens.textMuted
	} }, "Dock the filmstrip to the left or right (drag its header) for the list view setting. A strip along the bottom is one thumbnail tall, with no room for rows.");
	return /* @__PURE__ */ React.createElement(ui.Field, { hint: "Swap the thumbnails for the Library's list rows — filename, flags and rating, with dimensions and camera once the rail is wide enough." }, /* @__PURE__ */ React.createElement(ui.Toggle, {
		checked: list,
		onChange: setListView,
		label: "List view"
	}));
}

//#endregion
//#region src/index.tsx
const EXT_ID = "com.safelight.filmstrip";
const PANEL_ID = `${EXT_ID}.panel`;
function activate(a) {
	initRuntime(a);
	api.registerPanel({
		id: PANEL_ID,
		title: "Filmstrip",
		component: FilmstripPanel,
		fill: true,
		allowBottomDock: true,
		defaultDock: {
			module: "develop",
			direction: "bottom",
			order: 0,
			height: 112
		}
	});
	api.registerKeybinding({
		id: `${EXT_ID}.toggle`,
		label: "Toggle Filmstrip",
		category: "General",
		defaultCombo: "F6",
		handler: () => api.dock.togglePanel(PANEL_ID)
	});
	api.registerSettings({
		title: "Filmstrip",
		fields: [],
		component: FilmstripSettings,
		keywords: [
			"list view",
			"rows",
			"thumbnails",
			"filmstrip"
		]
	});
}
function deactivate() {}

//#endregion
export { activate, deactivate };
// Local, focused type stubs for the slice of the Safelight extension API this
// extension uses. The app's real, exhaustive definitions live in the core repo
// (src/extensions/types.ts, src/catalog/types.ts); this file mirrors only what
// we touch so the bundle type-checks standalone without depending on core.

import type { ComponentType, MouseEvent as ReactMouseEvent, ReactNode } from "react";

// ── catalog model ────────────────────────────────────────────────────────────

export type ColorLabel = "none" | "red" | "yellow" | "green" | "blue" | "purple";
export type FlagStatus = "none" | "pick" | "reject";

export interface CatalogPhoto {
  id: string;
  filename: string;
  thumbnailBlob: Blob | null;
  thumbnailUrl: string | null;
  width: number;
  height: number;
  rating: number;
  colorLabel: ColorLabel;
  flag: FlagStatus;
  keywords: string[];
  decodeError?: string;
  copyOf?: string;
  copyName?: string;
}

// ── zustand store shape (only the members we read/call) ──────────────────────

export interface CatalogState {
  photos: CatalogPhoto[];
  selectedIds: Set<string>;
  activePhotoId: string | null;
  /** Single-click semantics: selection collapses to {id} and it becomes the
   *  active (Develop) photo. */
  select(id: string): void;
  /** Ctrl-click semantics: membership toggle, active photo untouched. */
  toggleSelect(id: string): void;
  /** Shift-click semantics; pass the on-screen order so the range matches. */
  selectRange(id: string, orderedIds?: string[]): void;
  setRating(id: string, rating: number): Promise<void>;
}

export type CatalogStoreHook = (<T>(selector: (state: CatalogState) => T) => T) & {
  getState(): CatalogState;
};

// ── core components ──────────────────────────────────────────────────────────

/** Core's grid/strip photo cell: lazy thumbnail loading, selection rings,
 *  rating/flag/label badges and virtual-copy naming. Callbacks take the photo
 *  id so one stable function can serve every (memoized) cell. */
export interface ThumbnailProps {
  photo: CatalogPhoto;
  selected: boolean;
  active: boolean;
  size: number;
  onClick: (id: string, e: ReactMouseEvent) => void;
  onDoubleClick?: (id: string) => void;
  onContextMenu?: (id: string, e: ReactMouseEvent) => void;
  onRatingChange?: (id: string, rating: number) => void;
  onDragStart?: (id: string, e: unknown) => void;
}

/** Core's Library list-view row. `compact` drops the dimension and camera
 *  columns for narrow containers. */
export interface PhotoListRowProps {
  photo: CatalogPhoto;
  selected: boolean;
  active: boolean;
  compact?: boolean;
  onClick: (id: string, e: ReactMouseEvent) => void;
  onDoubleClick: (id: string) => void;
  onContextMenu?: (id: string, e: ReactMouseEvent) => void;
  onDragStart?: (id: string, e: unknown) => void;
}

/** The Library's photo right-click menu, for any surface that lists photos. */
export interface PhotoActions {
  onContextMenu: (id: string, e: ReactMouseEvent) => void;
  /** The menu and its dialogs — render inside the surface. */
  overlays: ReactNode;
}

export interface CullingShortcutOptions {
  /** Handle the thumbnail-size actions (- / =), which step the Library grid's
   *  cell size. Default true. */
  sizeSteps?: boolean;
}

// ── contributions ────────────────────────────────────────────────────────────

export interface PanelDockDefault {
  module: "library" | "develop";
  direction: "left" | "right" | "bottom";
  order?: number;
  width?: number;
  height?: number;
}

export interface PanelContribution {
  id: string;
  title: string;
  component: ComponentType;
  order?: number;
  /** Stretch to the remaining rail space; the body sizes to 100% and manages
   *  its own scrolling. */
  fill?: boolean;
  /** Opt in to bottom rails (the full-width horizontal strip under the main
   *  view). Panels are vertical columns unless they say otherwise. */
  allowBottomDock?: boolean;
  defaultDock?: PanelDockDefault;
}

export interface KeyActionContribution {
  id: string;
  label: string;
  category?: "General" | "Develop" | "Library";
  defaultCombo: string;
  handler: () => void;
}

export interface SettingsContribution {
  /** Section title; defaults to the extension's name. */
  title?: string;
  /** Declarative fields, or an empty list when `component` renders the section. */
  fields: never[];
  /** Escape hatch: render this instead of the declarative fields. Reads and
   *  writes values through api.settings itself. */
  component?: ComponentType;
  /** Extra synonyms matching this section in the Preferences search. */
  keywords?: string[];
}

export interface PanelPlacement {
  side: "left" | "right" | "bottom" | "float";
}

// ── the scoped API object handed to activate() ───────────────────────────────

export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  active?: boolean;
  title?: string;
  "aria-pressed"?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional inline label shown before the switch. */
  label?: ReactNode;
  ariaLabel?: string;
}

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}

export interface UiKit {
  Button: ComponentType<ButtonProps>;
  Toggle: ComponentType<ToggleProps>;
  Field: ComponentType<FieldProps>;
  tokens: {
    textMuted: string;
  };
}

export interface SafelightAPI {
  version: string;
  extensionId: string;
  react: typeof import("react");
  ui: UiKit;
  components: {
    Thumbnail: ComponentType<ThumbnailProps>;
    PhotoListRow: ComponentType<PhotoListRowProps>;
  };
  stores: { useCatalogStore: CatalogStoreHook };
  /** Persisted per-extension key/value settings, synced across windows. */
  settings: {
    get<T>(key: string, fallback: T): T;
    set(key: string, value: unknown): void;
    onChange(cb: (key: string, value: unknown) => void): () => void;
  };
  dock: {
    togglePanel(id: string): void;
    /** Where the calling panel component is docked right now. React hook. */
    usePanelPlacement(): PanelPlacement;
  };
  navigation: { goTo(module: "library" | "develop"): void };
  catalog: {
    /** The Library grid's current display order (folder, filters, sort and
     *  extension grid filters/sorts applied). React hook — the same list
     *  core's ←/→ photo navigation walks. */
    useVisiblePhotos(): CatalogPhoto[];
    /** The Library's photo right-click menu (built-ins + every extension's
     *  registerGridMenuItem) with its dialogs. React hook. */
    usePhotoActions(): PhotoActions;
    /** Mount the Library's culling shortcuts (ratings, flags, labels, rotate,
     *  remove/delete, rename, reveal, select-all, prev/next) while the calling
     *  component is mounted. React hook. */
    useCullingShortcuts(options?: CullingShortcutOptions): void;
  };
  registerPanel(c: PanelContribution): void;
  registerKeybinding(c: KeyActionContribution): void;
  registerSettings(c: SettingsContribution): void;
}

export type PaletteToken =
  | "canvas"
  | "surface"
  | "surfaceMuted"
  | "text"
  | "textMuted"
  | "border"
  | "accent"
  | "danger"
  | "connector";

export type NodeShape =
  | "rounded-rectangle"
  | "capsule"
  | "circle"
  | "cylinder"
  | "hexagon";

export interface Catalog {
  readonly $schema: string;
  readonly schemaVersion: "1.0";
  readonly catalogVersion: string;
  readonly reservedThemeIds: readonly string[];
  readonly fontMetrics: readonly FontMetrics[];
  readonly themes: readonly Theme[];
}

export interface FontMetrics {
  readonly id: string;
  readonly family: string;
  readonly version: string;
  readonly unitsPerEm: number;
  readonly ascent: number;
  readonly descent: number;
  readonly lineGap: number;
  readonly defaultAdvance: number;
  readonly glyphAdvances: Readonly<Record<string, number>>;
  readonly provenance: Provenance;
}

export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly palette: Palette;
  readonly typography: Typography;
  readonly nodeKindFallbacks: NodeKindFallbacks;
  readonly connector: ConnectorStyle;
  readonly icons: readonly Icon[];
}

export interface Palette {
  readonly canvas: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly text: string;
  readonly textMuted: string;
  readonly border: string;
  readonly accent: string;
  readonly danger: string;
  readonly connector: string;
}

export interface Typography {
  readonly fontMetricsId: string;
  readonly nodeLabelSizeMilliPx: number;
  readonly nodeDetailSizeMilliPx: number;
  readonly groupLabelSizeMilliPx: number;
  readonly edgeLabelSizeMilliPx: number;
  readonly lineHeightPermille: number;
  readonly labelWeight: number;
  readonly detailWeight: number;
}

export interface NodeKindFallbacks {
  readonly actor: NodeVisual;
  readonly client: NodeVisual;
  readonly service: NodeVisual;
  readonly function: NodeVisual;
  readonly worker: NodeVisual;
  readonly database: NodeVisual;
  readonly cache: NodeVisual;
  readonly queue: NodeVisual;
  readonly storage: NodeVisual;
  readonly external: NodeVisual;
}

export interface NodeVisual {
  readonly shape: NodeShape;
  readonly fill: PaletteToken;
  readonly stroke: PaletteToken;
  readonly text: PaletteToken;
  readonly accent: PaletteToken;
  readonly cornerRadiusMilliPx: number;
  readonly fallbackIconId: string;
}

export interface ConnectorStyle {
  readonly stroke: PaletteToken;
  readonly text: PaletteToken;
  readonly labelBackground: PaletteToken;
  readonly widthMilliPx: number;
  readonly arrowSizeMilliPx: number;
  readonly dashMilliPx?: readonly number[];
}

export interface Icon {
  readonly id: string;
  readonly subject: string;
  readonly description?: string;
  readonly asset: IconAsset;
}

export interface IconAsset {
  readonly path: string;
  readonly viewBox: readonly [number, number, number, number];
  readonly provenance: Provenance;
}

export interface Provenance {
  readonly sourceUrl: string;
  readonly sourceRevision: string;
  readonly copyright: string;
  readonly licenseSpdx: string;
  readonly licenseFile: string;
  readonly modified: boolean;
  readonly redistribution: Redistribution;
}

export interface Redistribution {
  readonly cargo: boolean;
  readonly npm: boolean;
  readonly wasm: boolean;
  readonly commercialApplications: boolean;
}

export declare const catalog: Readonly<Catalog>;
export declare const catalogVersion: string;
export declare const catalogRevision: `sha256:${string}`;
export declare const iconAssets: Readonly<Record<string, string>>;
export declare function iconSvg(assetPath: string): string | undefined;

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
  readonly fallbacks: CatalogFallbacks;
  readonly fontMetrics: readonly FontMetrics[];
  readonly themes: readonly Theme[];
}

export interface CatalogFallbacks {
  readonly missingThemeId: string;
  readonly missingIconId: string;
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
  readonly wideAdvance: number;
  readonly wideRanges: readonly UnicodeRange[];
  readonly glyphAdvances: Readonly<Record<string, number>>;
  readonly provenance: Provenance;
}

export interface UnicodeRange {
  readonly start: `U+${string}`;
  readonly end: `U+${string}`;
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

export type ProviderPackDistributionMode = "user-imported";

export type ProviderPackPermittedOutput =
  | "architecture-diagram"
  | "training-material"
  | "documentation"
  | "whitepaper"
  | "presentation"
  | "data-sheet"
  | "poster";

export type ProviderPackTransformation =
  | "remove-metadata"
  | "inline-styles"
  | "remove-unused-identifiers"
  | "namespace-identifiers"
  | "normalize-xml";

export interface ProviderPack {
  readonly $schema: string;
  readonly schemaVersion: "1.0";
  readonly packVersion: string;
  readonly provider: ProviderPackIdentity;
  readonly distributionMode: ProviderPackDistributionMode;
  readonly source: ProviderPackSource;
  readonly rights: ProviderPackRights;
  readonly notice: ProviderPackNotice;
  readonly icons: readonly ProviderIcon[];
}

export interface ProviderPackIdentity {
  readonly id: string;
  readonly name: string;
}

export interface ProviderPackSource {
  readonly pageUrl: `https://${string}`;
  readonly archiveUrl: `https://${string}`;
  readonly archiveSha256: `sha256:${string}`;
  readonly release: string;
  readonly retrievedAt: string;
  readonly termsUrl: `https://${string}`;
  readonly termsReviewedAt: string;
  readonly reviewAfter: string;
  readonly copyright: string;
  readonly licenseId: `LicenseRef-${string}`;
  readonly archiveLicenseIncluded: boolean;
}

export interface ProviderPackRights {
  readonly termsAcceptanceRequired: true;
  readonly permittedOutputs: readonly ProviderPackPermittedOutput[];
  readonly redistribution: ProviderPackRedistribution;
  readonly processing: ProviderPackProcessing;
  readonly modificationPolicy: "visual-preservation-only";
}

export interface ProviderPackRedistribution {
  readonly cargo: false;
  readonly npm: false;
  readonly wasm: false;
  readonly webAsset: false;
  readonly nativeBinary: false;
  readonly generatedOutput: true;
}

export interface ProviderPackProcessing {
  readonly localOnly: true;
  readonly automaticDownload: false;
  readonly serverUpload: false;
  readonly preserveColors: true;
  readonly preserveGeometry: true;
  readonly productNameNearby: boolean;
}

export interface ProviderPackNotice {
  readonly attribution: string;
  readonly termsSummary: string;
  readonly nonEndorsement: string;
}

export interface ProviderIcon {
  readonly id: `${string}:${string}`;
  readonly subject: string;
  readonly productName: string;
  readonly recommendedNodeKind: keyof NodeKindFallbacks;
  readonly asset: ProviderIconAsset;
}

export interface ProviderIconAsset {
  readonly path: string;
  readonly originalPath: string;
  readonly viewBox: readonly [number, number, number, number];
  readonly originalSha256: `sha256:${string}`;
  readonly processedSha256: `sha256:${string}`;
  readonly transformations: readonly ProviderPackTransformation[];
}

export declare const catalog: Readonly<Catalog>;
export declare const providerPackSchema: Readonly<Record<string, unknown>>;
export declare const catalogVersion: string;
export declare const catalogRevision: `sha256:${string}`;
export declare const iconAssets: Readonly<Record<string, string>>;
export declare function iconSvg(assetPath: string): string | undefined;

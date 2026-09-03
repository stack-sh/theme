//! Typed access to the canonical Stack theme catalog.
//!
//! The embedded data is generated from `catalog/catalog.json`. It performs no
//! filesystem, network, clock, locale, or host-font access at runtime.

use std::collections::BTreeMap;
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};

mod generated {
    include!("generated/metadata.rs");
}

pub use generated::{CATALOG_REVISION, CATALOG_VERSION};

const CATALOG_JSON: &str = include_str!("generated/catalog.json");
const CATALOG_SCHEMA_JSON: &str = include_str!("../schema/catalog.schema.json");
static CATALOG: OnceLock<Catalog> = OnceLock::new();

/// Returns the embedded catalog parsed into the public Rust contract.
#[must_use]
pub fn catalog() -> &'static Catalog {
    CATALOG.get_or_init(|| {
        serde_json::from_str(CATALOG_JSON).expect("generated catalog must match the Rust contract")
    })
}

/// Returns the exact generated JSON embedded in the crate.
#[must_use]
pub const fn catalog_json() -> &'static str {
    CATALOG_JSON
}

/// Returns the JSON Schema for the embedded catalog document shape.
#[must_use]
pub const fn catalog_schema_json() -> &'static str {
    CATALOG_SCHEMA_JSON
}

/// Returns one validated SVG asset by its catalog path.
///
/// The bytes are embedded at compile time; this function never reads the host
/// filesystem or performs network access.
#[must_use]
pub fn icon_svg(asset_path: &str) -> Option<&'static str> {
    generated::icon_svg(asset_path)
}

/// The complete versioned theme catalog.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Catalog {
    /// JSON Schema location recorded by the source catalog.
    #[serde(rename = "$schema")]
    pub schema: String,
    /// Major/minor version of the catalog document shape.
    pub schema_version: String,
    /// Version shared by the catalog and both distribution packages.
    pub catalog_version: String,
    /// Theme identifiers that cannot be registered again.
    pub reserved_theme_ids: Vec<String>,
    /// Deterministic recovery choices for unavailable themes and icons.
    pub fallbacks: CatalogFallbacks,
    /// Deterministic, versioned font measurement tables.
    pub font_metrics: Vec<FontMetrics>,
    /// Theme records in canonical catalog order.
    pub themes: Vec<Theme>,
}

/// Catalog-wide recovery choices used after emitting a missing-resource diagnostic.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogFallbacks {
    /// Core theme selected when a requested non-core theme is unavailable.
    pub missing_theme_id: String,
    /// Logical icon selected when an icon is unavailable in the resolved theme.
    pub missing_icon_id: String,
}

/// One deterministic font measurement table.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FontMetrics {
    /// Catalog-local metrics identifier.
    pub id: String,
    /// Display family name.
    pub family: String,
    /// Upstream or repository-authored metrics version.
    pub version: String,
    /// Font design units per em.
    pub units_per_em: u32,
    /// Ascender in font design units.
    pub ascent: i32,
    /// Descender in font design units.
    pub descent: i32,
    /// Additional line gap in font design units.
    pub line_gap: u32,
    /// Advance used for a scalar absent from `glyph_advances`.
    pub default_advance: u32,
    /// Advance used for a scalar covered by `wide_ranges`.
    pub wide_advance: u32,
    /// Ordered, non-overlapping Unicode scalar ranges treated as wide.
    pub wide_ranges: Vec<UnicodeRange>,
    /// Unicode scalar advances keyed as uppercase `U+XXXX` values.
    pub glyph_advances: BTreeMap<String, u32>,
    /// Source, license, and distribution evidence for the metrics.
    pub provenance: Provenance,
}

/// An inclusive Unicode scalar range encoded as `U+XXXX` labels.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UnicodeRange {
    pub start: String,
    pub end: String,
}

/// One theme and its theme-local icon collection.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Theme {
    /// Global Stack theme identifier.
    pub id: String,
    /// Human-readable theme name.
    pub name: String,
    /// Optional contributor-facing description.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Named colors available to other theme records.
    pub palette: Palette,
    /// Typography sizes, weights, and deterministic metrics reference.
    pub typography: Typography,
    /// Visual fallback for every Stack node kind.
    pub node_kind_fallbacks: NodeKindFallbacks,
    /// Connector and connector-label treatment.
    pub connector: ConnectorStyle,
    /// Theme-local named and fallback icon assets.
    pub icons: Vec<Icon>,
}

/// Required semantic color slots.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Palette {
    pub canvas: String,
    pub surface: String,
    pub surface_muted: String,
    pub text: String,
    pub text_muted: String,
    pub border: String,
    pub accent: String,
    pub danger: String,
    pub connector: String,
}

/// Typography values expressed without platform font measurement.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Typography {
    pub font_metrics_id: String,
    pub node_label_size_milli_px: u32,
    pub node_detail_size_milli_px: u32,
    pub group_label_size_milli_px: u32,
    pub edge_label_size_milli_px: u32,
    pub line_height_permille: u32,
    pub label_weight: u16,
    pub detail_weight: u16,
}

/// Complete fallback mapping for Stack 1.0 node kinds.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeKindFallbacks {
    pub actor: NodeVisual,
    pub client: NodeVisual,
    pub service: NodeVisual,
    #[serde(rename = "function")]
    pub function_: NodeVisual,
    pub worker: NodeVisual,
    pub database: NodeVisual,
    pub cache: NodeVisual,
    pub queue: NodeVisual,
    pub storage: NodeVisual,
    pub external: NodeVisual,
}

/// Node shape, palette references, and fallback icon.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeVisual {
    pub shape: NodeShape,
    pub fill: PaletteToken,
    pub stroke: PaletteToken,
    pub text: PaletteToken,
    pub accent: PaletteToken,
    pub corner_radius_milli_px: u32,
    pub fallback_icon_id: String,
}

/// Renderer-supported node outlines.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum NodeShape {
    RoundedRectangle,
    Capsule,
    Circle,
    Cylinder,
    Hexagon,
}

/// A reference to a required palette slot.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum PaletteToken {
    Canvas,
    Surface,
    SurfaceMuted,
    Text,
    TextMuted,
    Border,
    Accent,
    Danger,
    Connector,
}

/// Connector line and label treatment.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectorStyle {
    pub stroke: PaletteToken,
    pub text: PaletteToken,
    pub label_background: PaletteToken,
    pub width_milli_px: u32,
    pub arrow_size_milli_px: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dash_milli_px: Option<Vec<u32>>,
}

/// Theme-local icon metadata and its safe SVG asset.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Icon {
    pub id: String,
    pub subject: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub asset: IconAsset,
}

/// A repository-relative icon asset and declared viewport.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IconAsset {
    pub path: String,
    pub view_box: [i32; 4],
    pub provenance: Provenance,
}

/// Source, license, and distribution evidence for an asset.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Provenance {
    pub source_url: String,
    pub source_revision: String,
    pub copyright: String,
    pub license_spdx: String,
    pub license_file: String,
    pub modified: bool,
    pub redistribution: Redistribution,
}

/// Supported artifact and application distribution channels.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Redistribution {
    pub cargo: bool,
    pub npm: bool,
    pub wasm: bool,
    pub commercial_applications: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_catalog_matches_public_metadata() {
        let catalog = catalog();

        assert_eq!(catalog.schema_version, "1.0");
        assert_eq!(catalog.catalog_version, CATALOG_VERSION);
        assert!(CATALOG_REVISION.starts_with("sha256:"));
        assert_eq!(CATALOG_REVISION.len(), 71);
        assert_eq!(icon_svg("assets/missing.svg"), None);
        assert_eq!(
            catalog
                .themes
                .iter()
                .map(|theme| theme.id.as_str())
                .collect::<Vec<_>>(),
            ["default", "light", "dark"]
        );
        assert!(
            catalog
                .themes
                .iter()
                .flat_map(|theme| &theme.icons)
                .all(|icon| icon_svg(&icon.asset.path).is_some())
        );
    }

    #[test]
    fn embedded_catalog_round_trips_semantically() {
        let reparsed: Catalog = serde_json::from_str(catalog_json()).unwrap();
        let serialized = serde_json::to_value(&reparsed).unwrap();
        let source: serde_json::Value = serde_json::from_str(catalog_json()).unwrap();
        let schema: serde_json::Value = serde_json::from_str(catalog_schema_json()).unwrap();

        assert_eq!(serialized, source);
        assert_eq!(
            schema["$schema"],
            "https://json-schema.org/draft/2020-12/schema"
        );
    }
}

//! Typed access to the canonical Stack theme catalog.
//!
//! The embedded data is generated from `catalog/catalog.json`. It performs no
//! filesystem, network, clock, locale, or host-font access at runtime.

use std::collections::BTreeMap;
use std::fmt::{self, Write};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

mod generated {
    include!("generated/metadata.rs");
}

pub use generated::{CATALOG_REVISION, CATALOG_VERSION};

const CATALOG_JSON: &str = include_str!("generated/catalog.json");
const CATALOG_SCHEMA_JSON: &str = include_str!("../schema/catalog.schema.json");
const PROVIDER_PACK_SCHEMA_JSON: &str = include_str!("../schema/provider-pack.schema.json");
const THEME_OVERRIDES_SCHEMA_JSON: &str = include_str!("../schema/theme-overrides.schema.json");
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

/// Returns the JSON Schema for local user-imported provider icon packs.
#[must_use]
pub const fn provider_pack_schema_json() -> &'static str {
    PROVIDER_PACK_SCHEMA_JSON
}

/// Returns the JSON Schema for palette-only user theme definitions.
#[must_use]
pub const fn theme_overrides_schema_json() -> &'static str {
    THEME_OVERRIDES_SCHEMA_JSON
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

/// Palette-only theme definitions supplied by one user configuration.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(transparent)]
pub struct ThemeOverrides(pub BTreeMap<String, ThemeOverride>);

/// One user theme definition resolved from a built-in theme.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ThemeOverride {
    pub extends: BuiltinThemeId,
    pub palette: PaletteOverride,
}

/// Built-in themes that may supply non-palette records to a user theme.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BuiltinThemeId {
    Default,
    Light,
    Dark,
}

impl BuiltinThemeId {
    #[must_use]
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Default => "default",
            Self::Light => "light",
            Self::Dark => "dark",
        }
    }
}

/// Semantic color slots changed by one user theme definition.
#[derive(Clone, Debug, Default, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct PaletteOverride {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canvas: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surface: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surface_muted: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_muted: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub danger: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connector: Option<String>,
}

impl PaletteOverride {
    fn is_empty(&self) -> bool {
        self.canvas.is_none()
            && self.surface.is_none()
            && self.surface_muted.is_none()
            && self.text.is_none()
            && self.text_muted.is_none()
            && self.border.is_none()
            && self.accent.is_none()
            && self.danger.is_none()
            && self.connector.is_none()
    }

    fn normalized(&self) -> Result<Self, ThemeOverrideError> {
        macro_rules! normalized_slot {
            ($field:ident, $token:literal) => {
                self.$field
                    .as_deref()
                    .map(|value| {
                        normalize_color(value).ok_or_else(|| {
                            ThemeOverrideError::new(format!(
                                "palette.{} must be a six- or eight-digit hexadecimal color",
                                $token
                            ))
                        })
                    })
                    .transpose()?
            };
        }

        Ok(Self {
            canvas: normalized_slot!(canvas, "canvas"),
            surface: normalized_slot!(surface, "surface"),
            surface_muted: normalized_slot!(surface_muted, "surfaceMuted"),
            text: normalized_slot!(text, "text"),
            text_muted: normalized_slot!(text_muted, "textMuted"),
            border: normalized_slot!(border, "border"),
            accent: normalized_slot!(accent, "accent"),
            danger: normalized_slot!(danger, "danger"),
            connector: normalized_slot!(connector, "connector"),
        })
    }

    fn apply_to(&self, palette: &mut Palette) {
        macro_rules! apply_slot {
            ($field:ident) => {
                if let Some(value) = &self.$field {
                    palette.$field.clone_from(value);
                }
            };
        }

        apply_slot!(canvas);
        apply_slot!(surface);
        apply_slot!(surface_muted);
        apply_slot!(text);
        apply_slot!(text_muted);
        apply_slot!(border);
        apply_slot!(accent);
        apply_slot!(danger);
        apply_slot!(connector);
    }
}

/// A catalog with all configured themes applied and a reproducible identity.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ResolvedThemeCatalog {
    pub catalog: Catalog,
    pub revision: String,
    pub warnings: Vec<ThemeOverrideWarning>,
}

/// A non-fatal usability concern found in one configured palette.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ThemeOverrideWarning {
    pub code: String,
    pub theme_id: String,
    pub message: String,
}

/// A theme definition that cannot be resolved safely and deterministically.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ThemeOverrideError {
    reason: String,
}

impl ThemeOverrideError {
    fn new(reason: impl Into<String>) -> Self {
        Self {
            reason: reason.into(),
        }
    }

    #[must_use]
    pub fn reason(&self) -> &str {
        &self.reason
    }
}

impl fmt::Display for ThemeOverrideError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(&self.reason)
    }
}

impl std::error::Error for ThemeOverrideError {}

/// Applies user palette definitions over an immutable built-in catalog.
///
/// Every `extends` lookup uses `base_catalog`, including when the configured
/// name shadows a built-in theme. This makes `default extends default` an
/// intentional override instead of a recursive definition.
pub fn resolve_theme_overrides(
    base_catalog: &Catalog,
    base_revision: &str,
    overrides: &ThemeOverrides,
) -> Result<ResolvedThemeCatalog, ThemeOverrideError> {
    if overrides.0.len() > 32 {
        return Err(ThemeOverrideError::new(
            "theme overrides may contain at most 32 definitions",
        ));
    }
    if overrides.0.is_empty() {
        return Ok(ResolvedThemeCatalog {
            catalog: base_catalog.clone(),
            revision: base_revision.to_owned(),
            warnings: Vec::new(),
        });
    }

    let mut normalized = BTreeMap::new();
    let mut resolved = BTreeMap::new();
    let mut warnings = Vec::new();

    for (theme_id, definition) in &overrides.0 {
        if !is_theme_identifier(theme_id) {
            return Err(ThemeOverrideError::new(format!(
                "theme identifier {theme_id:?} is invalid"
            )));
        }
        if definition.palette.is_empty() {
            return Err(ThemeOverrideError::new(format!(
                "theme {theme_id} must override at least one palette color"
            )));
        }

        let base_id = definition.extends.as_str();
        let Some(base_theme) = base_catalog.themes.iter().find(|theme| theme.id == base_id) else {
            return Err(ThemeOverrideError::new(format!(
                "built-in theme {base_id} is unavailable"
            )));
        };
        let normalized_palette = definition.palette.normalized().map_err(|error| {
            ThemeOverrideError::new(format!("theme {theme_id}: {}", error.reason()))
        })?;
        let normalized_definition = ThemeOverride {
            extends: definition.extends,
            palette: normalized_palette,
        };

        let mut theme = base_theme.clone();
        if theme.id != *theme_id {
            theme.name.clone_from(theme_id);
            theme.description = None;
        }
        theme.id.clone_from(theme_id);
        normalized_definition.palette.apply_to(&mut theme.palette);
        warnings.extend(palette_warnings(theme_id, &theme.palette));
        normalized.insert(theme_id.clone(), normalized_definition);
        resolved.insert(theme_id.clone(), theme);
    }

    let mut effective_catalog = base_catalog.clone();
    for theme in &mut effective_catalog.themes {
        if let Some(configured) = resolved.remove(&theme.id) {
            *theme = configured;
        }
    }
    effective_catalog.themes.extend(resolved.into_values());

    let normalized_json = serde_json::to_vec(&ThemeOverrides(normalized))
        .expect("theme overrides contain only serializable public records");
    let mut hash = Sha256::new();
    hash.update(b"stack-theme-effective-v1\0");
    hash.update(base_revision.as_bytes());
    hash.update(b"\0");
    hash.update(normalized_json);

    let mut revision = String::with_capacity(71);
    revision.push_str("sha256:");
    for byte in hash.finalize() {
        write!(&mut revision, "{byte:02x}").expect("writing to a string cannot fail");
    }

    Ok(ResolvedThemeCatalog {
        catalog: effective_catalog,
        revision,
        warnings,
    })
}

fn is_theme_identifier(value: &str) -> bool {
    let bytes = value.as_bytes();
    !bytes.is_empty()
        && bytes.len() <= 64
        && bytes[0].is_ascii_lowercase()
        && bytes.iter().all(|byte| {
            byte.is_ascii_lowercase() || byte.is_ascii_digit() || *byte == b'_' || *byte == b'-'
        })
        && !value.contains("--")
}

fn normalize_color(value: &str) -> Option<String> {
    let bytes = value.as_bytes();
    if (bytes.len() == 7 || bytes.len() == 9)
        && bytes[0] == b'#'
        && bytes[1..].iter().all(u8::is_ascii_hexdigit)
    {
        Some(value.to_ascii_uppercase())
    } else {
        None
    }
}

fn palette_warnings(theme_id: &str, palette: &Palette) -> Vec<ThemeOverrideWarning> {
    let colors = [
        ("canvas", &palette.canvas),
        ("surface", &palette.surface),
        ("surfaceMuted", &palette.surface_muted),
        ("text", &palette.text),
        ("textMuted", &palette.text_muted),
        ("border", &palette.border),
        ("accent", &palette.accent),
        ("danger", &palette.danger),
        ("connector", &palette.connector),
    ];
    let mut warnings = Vec::new();
    for (token, color) in colors {
        if has_transparency(color) {
            warnings.push(ThemeOverrideWarning {
                code: "theme-transparent-color".to_owned(),
                theme_id: theme_id.to_owned(),
                message: format!(
                    "palette.{token} uses transparency; contrast depends on its rendered backdrop"
                ),
            });
        }
    }

    for (foreground, background, minimum) in [
        ("text", "surface", 4.5),
        ("textMuted", "surface", 4.5),
        ("danger", "surface", 4.5),
        ("border", "surface", 3.0),
        ("accent", "surface", 3.0),
        ("connector", "canvas", 3.0),
    ] {
        let foreground_color = palette_color(palette, foreground);
        let background_color = palette_color(palette, background);
        let (Some(foreground_rgb), Some(background_rgb)) =
            (opaque_rgb(foreground_color), opaque_rgb(background_color))
        else {
            continue;
        };
        let ratio = contrast_ratio(foreground_rgb, background_rgb);
        if ratio < minimum {
            warnings.push(ThemeOverrideWarning {
                code: "theme-low-contrast".to_owned(),
                theme_id: theme_id.to_owned(),
                message: format!(
                    "palette.{foreground} against palette.{background} has {ratio:.2}:1 contrast; expected at least {minimum:.1}:1"
                ),
            });
        }
    }
    warnings
}

fn palette_color<'a>(palette: &'a Palette, token: &str) -> &'a str {
    match token {
        "canvas" => &palette.canvas,
        "surface" => &palette.surface,
        "text" => &palette.text,
        "textMuted" => &palette.text_muted,
        "border" => &palette.border,
        "accent" => &palette.accent,
        "danger" => &palette.danger,
        "connector" => &palette.connector,
        _ => unreachable!("contrast pairs use known palette tokens"),
    }
}

fn opaque_rgb(value: &str) -> Option<[u8; 3]> {
    if normalize_color(value).is_none() || has_transparency(value) {
        return None;
    }
    Some([
        u8::from_str_radix(value.get(1..3)?, 16).ok()?,
        u8::from_str_radix(value.get(3..5)?, 16).ok()?,
        u8::from_str_radix(value.get(5..7)?, 16).ok()?,
    ])
}

fn has_transparency(value: &str) -> bool {
    value.len() == 9
        && !value
            .get(7..9)
            .is_some_and(|alpha| alpha.eq_ignore_ascii_case("ff"))
}

fn contrast_ratio(left: [u8; 3], right: [u8; 3]) -> f64 {
    let left = relative_luminance(left);
    let right = relative_luminance(right);
    (left.max(right) + 0.05) / (left.min(right) + 0.05)
}

fn relative_luminance(color: [u8; 3]) -> f64 {
    let channels = color.map(|channel| {
        let value = f64::from(channel) / 255.0;
        if value <= 0.04045 {
            value / 12.92
        } else {
            ((value + 0.055) / 1.055).powf(2.4)
        }
    });
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
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

/// A local provider icon pack produced from an archive selected by the user.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPack {
    #[serde(rename = "$schema")]
    pub schema: String,
    pub schema_version: String,
    pub pack_version: String,
    pub provider: ProviderPackIdentity,
    pub distribution_mode: ProviderPackDistributionMode,
    pub source: ProviderPackSource,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub additional_sources: Vec<ProviderPackAdditionalSource>,
    pub rights: ProviderPackRights,
    pub notice: ProviderPackNotice,
    pub icons: Vec<ProviderIcon>,
}

/// Stable provider namespace and display name.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackIdentity {
    pub id: String,
    pub name: String,
}

/// Provider packs are always supplied through an explicit local import.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderPackDistributionMode {
    UserImported,
}

/// Immutable provenance for the official source archive and reviewed terms.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackSource {
    pub page_url: String,
    pub archive_url: String,
    pub archive_sha256: String,
    pub release: String,
    pub retrieved_at: String,
    pub terms_url: String,
    pub terms_reviewed_at: String,
    pub review_after: String,
    pub copyright: String,
    pub license_id: String,
    pub archive_license_included: bool,
}

/// An additional audited archive used by a multi-source provider pack.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackAdditionalSource {
    pub id: String,
    #[serde(flatten)]
    pub source: ProviderPackSource,
}

/// Provider-specific usage boundary retained with every imported pack.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackRights {
    pub terms_acceptance_required: bool,
    pub permitted_outputs: Vec<ProviderPackPermittedOutput>,
    pub redistribution: ProviderPackRedistribution,
    pub processing: ProviderPackProcessing,
    pub modification_policy: ProviderPackModificationPolicy,
}

/// Output categories copied from the provider's reviewed terms.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderPackPermittedOutput {
    ArchitectureDiagram,
    TrainingMaterial,
    Documentation,
    Whitepaper,
    Presentation,
    DataSheet,
    Poster,
}

/// Asset redistribution switches fixed by the user-imported contract.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackRedistribution {
    pub cargo: bool,
    pub npm: bool,
    pub wasm: bool,
    pub web_asset: bool,
    pub native_binary: bool,
    pub generated_output: bool,
}

/// Local processing and artwork-preservation requirements.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackProcessing {
    pub local_only: bool,
    pub automatic_download: bool,
    pub server_upload: bool,
    pub preserve_colors: bool,
    pub preserve_geometry: bool,
    pub product_name_nearby: bool,
}

/// The only modification policy supported by the provider-pack schema.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderPackModificationPolicy {
    VisualPreservationOnly,
}

/// User-visible source, terms, and non-endorsement text.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderPackNotice {
    pub attribution: String,
    pub terms_summary: String,
    pub non_endorsement: String,
}

/// One namespaced product icon and its locally processed safe SVG.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderIcon {
    pub id: String,
    pub subject: String,
    pub product_name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_source_url: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub brand_guidelines_url: Option<String>,
    pub recommended_node_kind: ProviderNodeKind,
    pub asset: ProviderIconAsset,
}

/// Stack node-kind recommendation attached without changing node semantics.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderNodeKind {
    Actor,
    Client,
    Service,
    Function,
    Worker,
    Database,
    Cache,
    Queue,
    Storage,
    External,
}

/// Original and processed identities for one local SVG file.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderIconAsset {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source_id: Option<String>,
    pub path: String,
    pub original_path: String,
    pub view_box: [i32; 4],
    pub original_sha256: String,
    pub processed_sha256: String,
    pub transformations: Vec<ProviderPackTransformation>,
}

/// Auditable, visual-preservation-only transformations applied during import.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderPackTransformation {
    RemoveMetadata,
    InlineStyles,
    RemoveUnusedIdentifiers,
    NamespaceIdentifiers,
    ScaleViewBoxToIntegers,
    NormalizeXml,
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
        let provider_schema: serde_json::Value =
            serde_json::from_str(provider_pack_schema_json()).unwrap();
        assert_eq!(
            provider_schema["$id"],
            "https://raw.githubusercontent.com/stack-sh/theme/main/schemas/provider-pack.schema.json"
        );
        let theme_overrides_schema: serde_json::Value =
            serde_json::from_str(theme_overrides_schema_json()).unwrap();
        assert_eq!(
            theme_overrides_schema["$id"],
            "https://raw.githubusercontent.com/stack-sh/theme/main/schemas/theme-overrides.schema.json"
        );
    }

    #[test]
    fn configured_themes_override_builtins_without_recursive_extends() {
        let overrides: ThemeOverrides = serde_json::from_str(
            r##"{
                "custom-theme":{"extends":"light","palette":{"accent":"#005DBB","connector":"#334155"}},
                "default":{"extends":"default","palette":{"canvas":"#F7F8FA"}}
            }"##,
        )
        .unwrap();
        let resolved = resolve_theme_overrides(catalog(), CATALOG_REVISION, &overrides).unwrap();

        let default = resolved
            .catalog
            .themes
            .iter()
            .find(|theme| theme.id == "default")
            .unwrap();
        let original_default = catalog()
            .themes
            .iter()
            .find(|theme| theme.id == "default")
            .unwrap();
        assert_eq!(default.palette.canvas, "#F7F8FA");
        assert_eq!(default.typography, original_default.typography);
        assert_eq!(
            default.node_kind_fallbacks,
            original_default.node_kind_fallbacks
        );

        let custom = resolved
            .catalog
            .themes
            .iter()
            .find(|theme| theme.id == "custom-theme")
            .unwrap();
        let original_light = catalog()
            .themes
            .iter()
            .find(|theme| theme.id == "light")
            .unwrap();
        assert_eq!(custom.name, "custom-theme");
        assert_eq!(custom.palette.accent, "#005DBB");
        assert_eq!(custom.palette.canvas, original_light.palette.canvas);
        assert_eq!(custom.typography, original_light.typography);
        assert_ne!(resolved.revision, CATALOG_REVISION);
        assert!(resolved.revision.starts_with("sha256:"));
    }

    #[test]
    fn effective_revision_uses_normalized_definition_order_and_colors() {
        let left: ThemeOverrides = serde_json::from_str(
            r##"{
                "z_theme": {"extends":"dark","palette":{"accent":"#aabbcc"}},
                "a_theme": {"extends":"light","palette":{"canvas":"#123456"}}
            }"##,
        )
        .unwrap();
        let right: ThemeOverrides = serde_json::from_str(
            r##"{
                "a_theme": {"extends":"light","palette":{"canvas":"#123456"}},
                "z_theme": {"extends":"dark","palette":{"accent":"#AABBCC"}}
            }"##,
        )
        .unwrap();

        let left = resolve_theme_overrides(catalog(), CATALOG_REVISION, &left).unwrap();
        let right = resolve_theme_overrides(catalog(), CATALOG_REVISION, &right).unwrap();
        assert_eq!(left.revision, right.revision);
        assert_eq!(left.catalog, right.catalog);
    }

    #[test]
    fn empty_overrides_preserve_the_base_catalog_identity() {
        let resolved =
            resolve_theme_overrides(catalog(), CATALOG_REVISION, &ThemeOverrides::default())
                .unwrap();
        assert_eq!(resolved.catalog, *catalog());
        assert_eq!(resolved.revision, CATALOG_REVISION);
        assert!(resolved.warnings.is_empty());
    }

    #[test]
    fn invalid_theme_definitions_fail_before_resolution() {
        for (source, expected) in [
            (
                r##"{"invalid--name":{"extends":"default","palette":{"accent":"#000000"}}}"##,
                "identifier",
            ),
            (
                r##"{"empty":{"extends":"default","palette":{}}}"##,
                "at least one",
            ),
            (
                r##"{"bad_color":{"extends":"default","palette":{"accent":"red"}}}"##,
                "hexadecimal color",
            ),
        ] {
            let overrides: ThemeOverrides = serde_json::from_str(source).unwrap();
            let error =
                resolve_theme_overrides(catalog(), CATALOG_REVISION, &overrides).unwrap_err();
            assert!(error.reason().contains(expected), "{}", error.reason());
        }
    }

    #[test]
    fn configured_palette_concerns_are_warnings_and_colors_are_unchanged() {
        let overrides: ThemeOverrides = serde_json::from_str(
            r##"{
                "soft":{"extends":"light","palette":{"text":"#ffffff"}},
                "glass":{"extends":"dark","palette":{"canvas":"#11223380"}}
            }"##,
        )
        .unwrap();
        let resolved = resolve_theme_overrides(catalog(), CATALOG_REVISION, &overrides).unwrap();

        assert!(
            resolved.warnings.iter().any(|warning| {
                warning.theme_id == "soft" && warning.code == "theme-low-contrast"
            })
        );
        assert!(resolved.warnings.iter().any(|warning| {
            warning.theme_id == "glass" && warning.code == "theme-transparent-color"
        }));
        assert_eq!(
            resolved
                .catalog
                .themes
                .iter()
                .find(|theme| theme.id == "soft")
                .unwrap()
                .palette
                .text,
            "#FFFFFF"
        );
    }

    #[test]
    fn multi_source_provider_pack_round_trips_semantically() {
        let source = include_str!("../../../tests/fixtures/provider-pack/multi-source.json");
        let pack: ProviderPack = serde_json::from_str(source).unwrap();

        assert_eq!(pack.schema_version, "1.1");
        assert_eq!(pack.additional_sources.len(), 1);
        assert_eq!(pack.additional_sources[0].id, "categories");
        assert_eq!(pack.icons[0].asset.source_id.as_deref(), Some("categories"));
        assert_eq!(
            pack.icons[0].brand_guidelines_url.as_deref(),
            Some("https://example.com/acme/brand-guidelines")
        );
        assert_eq!(
            serde_json::to_value(&pack).unwrap(),
            serde_json::from_str::<serde_json::Value>(source).unwrap()
        );
    }
}

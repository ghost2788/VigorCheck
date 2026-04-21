# App Icon Rebrand — Concentric Dot Rings

**Date**: 2026-04-08
**Status**: Approved, ready for implementation

## Summary

Replace the current aperture/spiral app icon with a new design based on the app's signature concentric progress rings at 100% completion. The icon is a direct visual echo of the VigorCheck home screen dashboard — four nested dot-rings forming complete circles on a dark background with an empty center.

## Design Decision History

Several directions were explored and rejected:
- **Abstract marks** (orbital rings) — too disconnected from what the app does
- **Stylized literal** (shield + checkmark) — too generic, could be any app
- **Lettermarks** ("V", "VC") — boring, not distinctive enough
- **Text on colored backgrounds** — explored red/teal/gold/dark variants; user liked the ember red text approach but ultimately preferred the ring concept
- **Progress rings at partial completion** — rejected in favor of all rings at 100%

The concentric dot rings won because they are unique, instantly recognizable to users, and deeply connected to the app's core identity.

## Specification

### Background
- Warm dark charcoal gradient: `#1a1814` → `#15131a` (same as app dark theme)
- Shape: Standard platform app icon mask (rounded rectangle on iOS/Android)

### Rings
Four concentric rings, each composed of **48 evenly-spaced circular dots**, all at 100% (forming complete circles). Starting from outermost:

| Ring | Metric   | Color     | Radius (ratio) | Dot size (ratio) |
|------|----------|-----------|-----------------|-------------------|
| 1    | Calories | `#d8c49a` | 0.40            | 0.020             |
| 2    | Protein  | `#5ebaa9` | 0.31            | 0.018             |
| 3    | Carbs    | `#78a0c8` | 0.22            | 0.015             |
| 4    | Fat      | `#d38a3a` | 0.13            | 0.013             |

- Radius and dot size are expressed as ratios of the canvas size for resolution independence
- Dot placement formula: For dot `i` (0–47), angle = `(i / 48) * 360 - 90` degrees (starting from 12 o'clock)
- Position: `x = center + cos(angle) * radius`, `y = center + sin(angle) * radius`

### Center
Empty — clean negative space. No score, no checkmark, no text.

### Glow
Subtle per-dot glow effect: a larger, semi-transparent circle (same color, ~15% opacity) rendered behind each dot. Adds warmth without clutter.

### Proportions
"Balanced" spacing — matches the actual dashboard ring proportions. Not too airy (loses detail at small sizes), not too dense (rings blend together).

## Platform Assets to Generate

| Asset | Size | Notes |
|-------|------|-------|
| `assets/icon.png` | 1024×1024 | Primary app icon |
| `assets/favicon.png` | 48×48 | Web favicon |
| `assets/splash-icon.png` | 200×200 | Splash/loading screen |
| `assets/android-icon-foreground.png` | 432×432 | Android adaptive icon foreground |
| `assets/android-icon-background.png` | 432×432 | Solid dark charcoal fill |
| `assets/android-icon-monochrome.png` | 432×432 | Single-color silhouette for Android themed icons |
| `assets/android-icon-foreground-live-preview.png` | 432×432 | Live preview variant |
| `assets/icon-live-preview.png` | 1024×1024 | Live preview variant |

## Implementation Approach

1. **Generate the icon programmatically** — write a Node.js script (or use canvas) that renders the dot rings at the exact ratios above, outputs a high-res PNG
2. **Export all platform variants** from the master render at appropriate sizes
3. **Replace existing assets** in `assets/` with new versions
4. **Update store assets** — regenerate `assets/store/play-feature-graphic.png` and related marketing images
5. **Update welcome screen** — the `WelcomeRingHero` component may need visual alignment with the new icon identity
6. **Verify** — build the app locally and confirm the icon renders correctly on iOS and Android simulators

## Color Reference

These colors come from `lib/theme/colors.ts` (dark mode):
- `metricCalories`: `#d8c49a`
- `metricProtein`: `#5ebaa9`
- `metricCarbs`: `#78a0c8`
- `metricFat`: `#d38a3a`
- `background`: `#1a1814`

If the theme colors change, the icon should be regenerated to stay in sync.

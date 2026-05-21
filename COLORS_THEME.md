# Global Risk Intelligence Platform — Color & Visual Design System

Canonical reference for all color decisions. Implement globe markers, event badges, and UI components directly from this document. Every hex value is exact — do not substitute.

---

## Summary Table

| Domain | Ramp | Globe Marker (400-mid) | Badge Background (50-light) |
|---|---|---|---|
| Natural | Amber | `#EF9F27` | `#FAEEDA` |
| Biological | Green | `#97C459` | `#EAF3DE` |
| Technological | Coral | `#F0997B` | `#FAECE7` |
| Geopolitical | Purple | `#AFA9EC` | `#EEEDFE` |
| Cyber | Teal | `#5DCAA5` | `#E1F5EE` |
| Infrastructure | Blue | `#85B7EB` | `#E6F1FB` |

---

## 1. Domain Color Assignments

Each domain has a named four-stop ramp. The 50-stop (light fill) is used for badge backgrounds in light mode. The 400-stop (mid) is the globe marker fill. The 600-stop (dark) is the globe marker border and hover state. The 800-stop (text-on-light) is used for text inside light-background badges.

### Natural — Amber

**Semantic rationale:** Amber evokes geological and atmospheric forces — wildfires, earthquakes, volcanic events — the raw, uncontrolled power of the Earth itself.

| Stop | Role | Hex |
|---|---|---|
| 50 — light fill | Badge background | `#FAEEDA` |
| 400 — mid | **Globe marker fill** | `#EF9F27` |
| 600 — dark | Globe marker border, hover | `#BA7517` |
| 800 — text-on-light | Badge text | `#633806` |

**Globe marker hex:** `#EF9F27`

---

### Biological — Green

**Semantic rationale:** Green maps to the biosphere — disease outbreaks, epidemics, ecological disruptions — life systems under stress.

| Stop | Role | Hex |
|---|---|---|
| 50 — light fill | Badge background | `#EAF3DE` |
| 400 — mid | **Globe marker fill** | `#97C459` |
| 600 — dark | Globe marker border, hover | `#3B6D11` |
| 800 — text-on-light | Badge text | `#173404` |

**Globe marker hex:** `#97C459`

---

### Technological — Coral

**Semantic rationale:** Coral/red-orange signals industrial and human-made hazards — industrial accidents, nuclear incidents, chemical spills — man's failures rather than nature's.

| Stop | Role | Hex |
|---|---|---|
| 50 — light fill | Badge background | `#FAECE7` |
| 400 — mid | **Globe marker fill** | `#F0997B` |
| 600 — dark | Globe marker border, hover | `#993C1D` |
| 800 — text-on-light | Badge text | `#4A1B0C` |

**Globe marker hex:** `#F0997B`

> **Note:** Red tones are reserved for the Technological domain only. Do not use red to encode severity for any other domain.

---

### Geopolitical — Purple

**Semantic rationale:** Purple has historically connoted governance and power — conflicts, political crises, and state-level instability belong here.

| Stop | Role | Hex |
|---|---|---|
| 50 — light fill | Badge background | `#EEEDFE` |
| 400 — mid | **Globe marker fill** | `#AFA9EC` |
| 600 — dark | Globe marker border, hover | `#534AB7` |
| 800 — text-on-light | Badge text | `#26215C` |

**Globe marker hex:** `#AFA9EC`

---

### Cyber — Teal

**Semantic rationale:** Teal reads as digital and synthetic — network attacks, infrastructure breaches, data incidents live in this cool, technological range.

| Stop | Role | Hex |
|---|---|---|
| 50 — light fill | Badge background | `#E1F5EE` |
| 400 — mid | **Globe marker fill** | `#5DCAA5` |
| 600 — dark | Globe marker border, hover | `#0F6E56` |
| 800 — text-on-light | Badge text | `#04342C` |

**Globe marker hex:** `#5DCAA5`

---

### Infrastructure — Blue

**Semantic rationale:** Blue signals essential services and systems — power grid failures, transport disruptions, supply chain breaks — the connective tissue of civilization.

| Stop | Role | Hex |
|---|---|---|
| 50 — light fill | Badge background | `#E6F1FB` |
| 400 — mid | **Globe marker fill** | `#85B7EB` |
| 600 — dark | Globe marker border, hover | `#185FA5` |
| 800 — text-on-light | Badge text | `#042C53` |

**Globe marker hex:** `#85B7EB`

---

## 2. Severity System

Severity modulates marker **size and opacity only** — never hue. The domain color stays constant across all severity levels.

| Level | Opacity | Globe Radius (base px) | Pulse Animation |
|---|---|---|---|
| LOW | 40% | 8px | None |
| MODERATE | 70% | 12px | None |
| HIGH | 90% | 16px | None |
| EXTREME | 100% | 22px | Active (see Status animations) |

> **Rule:** If EXTREME events of different domains all turned red, domain semantics would collapse. Never change hue based on severity — use opacity and scale exclusively.

---

## 3. Globe Marker Spec

- **Primary fill:** 400-stop of the domain color ramp
- **Border/outline:** 600-stop of the domain color ramp
- **Geometry:** Cone or cylinder pointing outward from the globe surface (normal to the sphere)
- **Severity controls:** Opacity (see table above) and scale factor applied to the base radius
- **Red is reserved:** Only the Technological domain (`#F0997B` / `#993C1D`) uses red tones. Never use red to indicate severity for any other domain.

| Severity | Scale multiplier | Effective radius |
|---|---|---|
| LOW | 0.36× | 8px |
| MODERATE | 0.55× | 12px |
| HIGH | 0.73× | 16px |
| EXTREME | 1.0× | 22px |

Globe textures are always dark (Earth nightside palette). The 400-stop mid values for all six domains are calibrated specifically to read against dark backgrounds — do not lighten them for globe use.

---

## 4. Status Lifecycle Animations

Five statuses with distinct globe behaviors and UI badge colors.

| Status | Globe Animation | Animation Spec |
|---|---|---|
| EMERGING | Slow pulse | 2s cycle, opacity oscillates 40% → 100% |
| ACTIVE | Steady glow | No animation; constant halo at 30% opacity |
| ESCALATING | Fast pulse | 0.6s cycle, opacity oscillates 60% → 100% |
| STABILIZING | Slow dim | Marker fades to 60% opacity over 8s, then holds |
| RESOLVED | Static, faded | 25% opacity, no animation, no halo |

### Status Badge Colors

Use these exact values for status badges in the UI — background and text are specified directly and do not follow the domain ramp system.

| Status | Background | Text |
|---|---|---|
| EMERGING | `#E1F5EE` | `#0F6E56` |
| ACTIVE | `#FAEEDA` | `#BA7517` |
| ESCALATING | `#FCEBEB` | `#A32D2D` |
| STABILIZING | `#EAF3DE` | `#3B6D11` |
| RESOLVED | `#F1EFE8` | `#5F5E5A` |

---

## 5. Event Detail Badge Spec

**Rule:** Domain, type, and severity badges use the **50-stop (lightest) as background** and the **800-stop (darkest) as text**. Never hardcode black (`#000000`) or generic gray on colored badge backgrounds.

Status badges use the exact hex values from the Status table above (section 4), not the domain ramp.

### Domain Badge Example

```html
<!-- Natural domain -->
<span style="background: #FAEEDA; color: #633806; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
  Natural
</span>
```

### Type Badge Example

Type badges share the domain ramp of their parent event. A Biological type badge:

```html
<span style="background: #EAF3DE; color: #173404; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
  Epidemic
</span>
```

### Severity Badge Example

Severity badges use the domain ramp of the event, not a severity-specific color:

```html
<!-- HIGH severity event in the Geopolitical domain -->
<span style="background: #EEEDFE; color: #26215C; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
  HIGH
</span>
```

### Status Badge Example

```html
<!-- ESCALATING status — uses fixed status colors, not domain ramp -->
<span style="background: #FCEBEB; color: #A32D2D; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
  Escalating
</span>
```

---

## 6. Dark Mode Rules

In dark mode, invert the stop usage: use the **800-stop as background fill** and the **50-stop (or white at 90%)** as text. The 400-stop mid value is used as an accent or border in dark contexts.

| Light mode | Dark mode |
|---|---|
| Background: 50-stop | Background: 800-stop |
| Text: 800-stop | Text: 50-stop |
| Accent/border: 400-stop | Accent/border: 400-stop (unchanged) |

**Globe-specific note:** Globe textures are always dark (Earth nightside). The 400-stop mid values listed in the domain sections above are chosen specifically to be legible against dark Earth surface colors. Do not apply light-mode adjustments to globe markers — the 400-stop values are the correct globe fill regardless of UI mode.

---

## 7. ⚠️ Encoding Rules — Critical

> These rules must never be violated. Read them before implementing any color logic.

### Rule 1 — Domain color is the primary encoding

The domain color **must never be overridden** by severity, status, animation state, or any other variable. A flood marker is blue. An epidemic marker is green. An infrastructure failure marker is blue. These cannot swap based on how bad the event is.

### Rule 2 — Severity is the secondary encoding, opacity and size only

Severity changes **opacity** and **marker size**. It does not change hue, saturation, or which color ramp is used. If an EXTREME wildfire and an EXTREME cyberattack both appeared red, observers could no longer distinguish domain from severity. The domain encoding collapses. This must never happen.

---

## 8. Teal vs. Green Disambiguation

Cyber (teal: `#5DCAA5`) and Biological (green: `#97C459`) are the two most easily confused domains at small globe marker sizes.

**Implementation requirements:**
- Use the exact 400-stop hex values for both — `#5DCAA5` and `#97C459` — directly. Do not approximate from system palette variables.
- Never reduce either domain's opacity below 70% when both are simultaneously visible on the globe (i.e., when both Cyber and Biological events are rendered in the same viewport).
- At very small zoom levels where markers are under 6px, consider adding a 1px white ring border to assist differentiation.

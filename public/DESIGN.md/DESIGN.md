# Design System Documentation: Tactical Precision & Intellectual Depth

## 1. Overview & Creative North Star

**The Creative North Star: "The Grandmaster’s Study"**

This design system is not merely a collection of components; it is a visual manifestation of strategic thought. Inspired by the high-stakes, quiet intensity of a championship chess match, the system moves away from "app-like" genericism toward a "High-End Editorial" experience. We prioritize focus, eliminate visual noise, and use sophisticated layering to guide the user’s cognitive flow.

To break the "template" look, this design system utilizes **intentional asymmetry** and **tonal depth**. We reject the rigid, centered grid in favor of dynamic layouts where elements overlap and breathe, creating a rhythm that feels curated and authoritative.

---

### 2. Colors: The Chromatic Strategy

The palette is built on a foundation of deep, intellectual slates and a vibrant "Tactical Green" that signals action and precision.

* **Primary (`#a0d660`):** Our tactical lead. Use this for high-impact actions and success states. To provide "visual soul," use a subtle linear gradient (Top-Left to Bottom-Right) transitioning from `primary` to `primary_container` (`#82b644`) for hero CTAs.

* **Surface Hierarchy:** We utilize a dark-mode-first approach. The base is `surface` (`#141311`), with layers built upward using `surface_container` tokens.

* **The "No-Line" Rule:** To maintain a premium editorial feel, **1px solid borders are prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` card sitting on a `surface` background creates a natural, sophisticated separation without the "cheapness" of a stroke.

* **The Glass & Gradient Rule:** For floating panels or navigation overlays, utilize Glassmorphism. Apply a semi-transparent `surface_container` with a `backdrop-blur` (12px–20px). This allows the deep slate tones to bleed through, ensuring the UI feels integrated rather than "pasted on."

---

### 3. Typography: Editorial Authority

We use **Inter** as our sole typeface, relying on its neutral but modern character to drive the hierarchy.

* **Display & Headline Scale:** Large-scale typography (`display-lg` to `headline-sm`) should be set with tight letter-spacing (-0.02em) to feel impactful and "competitive." Use these for key statistics and victory screens.

* **Body & Labels:** Use `body-md` for general content. `label-sm` should be uppercase with slightly wider letter-spacing (+0.05em) to convey a sense of technical precision, perfect for metadata or coordinates.

* **Hierarchy as Identity:** The contrast between a massive `display-md` headline and a tiny, wide-spaced `label-md` creates the "Editorial" look that distinguishes this design system from standard SaaS products.

---

### 4. Elevation & Depth: Tonal Layering

Depth is achieved through "stacking" rather than traditional drop shadows.

* **The Layering Principle:** Treat the UI as physical sheets of fine material.

  * Level 0: `surface` (The "Table")

  * Level 1: `surface_container_low` (The "Board")

  * Level 2: `surface_container_highest` (The "Piece" or Card)

* **Ambient Shadows:** When an element must "float" (e.g., a modal or a piece being dragged), use an extra-diffused shadow.

  * *Value:* `0px 12px 32px rgba(0, 0, 0, 0.4)`

  * *Note:* The shadow should never be a neutral gray; it should be a deep, tinted version of the `on-surface` color to mimic natural ambient light.

* **The "Ghost Border" Fallback:** If a container requires further definition for accessibility, use a "Ghost Border": the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

---

### 5. Components: Tactile Instruments

**Buttons**

* **Primary:** `primary` to `primary_container` gradient. 8px (`DEFAULT`) or 12px (`md`) rounded corners. Text is `on_primary` (Deep Green-Black).

* **Secondary:** `secondary_container` background with `on_secondary_container` text.

* **States:** On hover, primary buttons should increase in "glow" (a subtle outer shadow of the `primary` color), rather than just changing brightness.

**Cards & Lists**

* **Rule:** Forbid divider lines. Use vertical white space from the spacing scale (e.g., 24px or 32px) to separate content blocks.

* **Visual Shift:** A list item on hover should shift from the base background to `surface_container_high`.

**Input Fields**

* **Styling:** Use `surface_container_lowest` as the fill. The label should use `label-md` in `on_surface_variant`.

* **Focus State:** Instead of a thick border, use a 2px `primary` underline or a subtle `primary` outer glow.

**Chips (Tactical Markers)**

* Use `secondary_container` for inactive filters and `primary` for active ones. Chips should have `full` (9999px) roundness to contrast against the architectural `8px-12px` corners of cards.

**Additional Component: The "Match Status" Bar**

* A specialized, slim component using a gradient of `primary` to track progress or advantage. It should be pinned to the edge of a container, breaking the internal padding to feel "integrated" into the layout’s architecture.

---

### 6. Do's and Don'ts

**Do:**

* **Use Asymmetry:** Place a large headline on the left with a smaller supporting "Ghost Card" offset to the right.

* **Embrace Breathing Room:** Use significantly more whitespace than you think is necessary. Space is a sign of luxury and focus.

* **Prioritize Readability:** Ensure `on_surface` text maintains high contrast against the deep `surface` tones.

**Don't:**

* **No "Boxy" Grids:** Avoid making every page look like a dashboard. Break the grid with overlapping images or floating typography.

* **No High-Contrast Borders:** Never use a solid white or light-gray border on dark backgrounds. It shatters the "Grandmaster's Study" atmosphere.

* **No Default Shadows:** Avoid small, dark, "muddy" drop shadows. If it doesn't look like ambient light, don't use it.

# Active Context

## Current Work Focus
- Refinement of the combined deck configuration page (`src/app/configure/deck/page.tsx`). This involved:
    - Merging the sub-component selection (interactive image) from the old `deck-parts` page with the detailed configuration logic from the old `deck` page.
    - Significant UI redesign of the individual component configuration cards to make all options (Percentage, Finish, Coats, Difficulty, Material) always visible and editable.
    - Updating calculation logic for deck flooring and stairs (including detailed sq ft calculation based on treads, risers, stringers).
    - Implementing logic for material interactions (e.g., certain materials defaulting `coatingType` to 'paint').
    - Adding new material options ('concrete', 'aluminum') to `RailingMaterialType` and relevant UI dropdowns.
    - Fixing navigation from the main selection page to correctly point to `/configure/deck`.

## Recent Changes
- **Deck Configuration Page Overhaul (`src/app/configure/deck/page.tsx` formerly `deck-parts`):**
    - **Merged Functionality:** Combined the interactive deck part selection (SVG lines on image) with the detailed configuration UI into a single page. The old `/configure/deck/page.tsx` was deleted, and `/configure/deck-parts/` directory was renamed to `/configure/deck/`.
    - **UI Redesign - Individual Component Cards:** Each selected sub-component now has its own card where all configuration fields (Percentage, Finish, Coats, Difficulty, Material) are always visible and editable in a grid layout. This replaced the previous `activeEditProperty` system for individual edits.
    - **Styling Enhancements:** Individual component cards received updated styling (`bg-white p-5 rounded-xl shadow-lg border border-gray-200`). Input fields, select dropdowns, and button groups (Coats, Difficulty) were restyled for a more modern and compact appearance.
    - **Dimension Display Logic for "Custom":** Refined the logic that determines whether Length, Area, or Quantity is the primary dimension shown for "Custom" deck parts based on user input.
    - **Stair Calculation Update:** The `useEffect` hook for dynamic calculations now uses a more detailed formula for stair square footage, considering `includeTreads`, `includeRisers` (adds 1x base tread area), and `includeStringers` (adds 0.75x base tread area). Deck flooring calculation now uses `toFixed(1)`.
    - **Stair Details UI Update:** The `<details>` section for stair configuration was restyled for better clarity and input field consistency.
    - **Post and Trellis Configuration Update:**
        - Added a `width` property to the `DeckSubComponentConfig` interface, primarily for `deck-posts` (column width) and `deck-trellis` (length, if height is also used for area).
        - Updated `useEffect` hooks that initialize `componentConfigs` to include the `width` field for `deck-posts` and `deck-trellis`.
        - Implemented calculation logic in the dynamic calculation `useEffect` for:
            - `deck-posts`: `calculatedSqFt` is now `width * height * quantity`. `calculatedQuantity` is also set from the user's quantity input. **Update:** `parseFloatOrDefault` now uses `0` as a default for `width`, `height`, and `userQuantity` in this calculation. `calculatedQuantity` is now explicitly set to `undefined` as the area (sq.ft.) is the primary display.
            - `deck-trellis`: `calculatedSqFt` is now `userLength * height`.
        - Added new UI sections (details view, similar to stairs) for `deck-posts` and `deck-trellis` to configure their `width` (for posts) / `length` (for trellis) and `height`.
        - The "Configure Details" button is now also shown for `deck-posts` and `deck-trellis` to toggle these new UI sections.
        - The UI for `deck-posts` details was updated to a 3-column layout (Width, Height, Columns/Quantity).
        - The primary dimension display for `deck-posts` in the configuration card header now shows total calculated Area (SqFt). The input field in the card header now also directly edits `userSqFt`.
        - The "Quantity" input field within the `deck-posts` details section is now an editable field, allowing users to specify the number of posts. Its value is bound to `config.userQuantity`.
        - Default `userQuantity` for newly created components (both initial selection and new instances) is now `''` (empty string) instead of `'0'`.
        - Corrected an issue in the dynamic calculation `useEffect` where `userQuantity` for `deck-posts` was being unintentionally set to `"0"` if unedited, overriding the initial empty string. It now correctly preserves the empty string if `calculatedQuantity` is `undefined` (as intended for posts) and `userQuantityEdited` is false.
        - The direct display of calculated SqFt (e.g., `<p>Square Footage: ...</p>`) was removed from the specific detail views for both `deck-posts` and `deck-trellis`.
        - The conditional styling (top margin and border) for the main parameters block (Adjust %, Finish, Coats, etc.) now also considers if `deck-posts` or `deck-trellis` details are visible, similar to how it handled `deck-stairs`.
        - Added quick name-change buttons within the details sections for `deck-posts` (to "Columns" or "Supports") and `deck-trellis` (to "Trellis" or "Verticals").
    - **Material Logic & Options:**
        - `RailingMaterialType` was expanded to include 'concrete' and 'aluminum'.
        - Both individual and bulk edit material dropdowns were updated with these new options.
        - Logic was added to `handleComponentConfigChange` and `handleApplyBulkEditToActiveProperty` to automatically set `coatingType` to 'paint' if `railingMaterial` is 'composite', 'metal', 'concrete', or 'aluminum'.
        - Default `coatingType`, `difficulty`, `railingMaterial`, and `coats` were updated in the `initialConfigs` for newly selected deck parts.
    - **Bulk Edit Refinements:**
        - Removed a condition in `handleApplyBulkEditToActiveProperty` that restricted bulk editing of `railingMaterial` to specific component types, allowing it for all selected deck parts.
        - `handleApplyBulkEditToActiveProperty` refactored to use `setComponentConfigs` with `.map()` for consistency and to correctly implement material-dependent `coatingType` changes and dimension clearing for `percentageAdjustment`.
    - **Layout Adjustments:** Removed `space-y-0.5` from the wrapper of individual component cards to let card margins define spacing. The overall container for these cards is now `grid grid-cols-1 lg:grid-cols-2 gap-6`.
    - **Navigation Fix:** Updated `subComponentPagePath` for "Deck" in `src/app/page.tsx` from `/configure/deck-parts` to `/configure/deck` to ensure correct navigation.

- **Previous (Wrought Iron Railings & General Context):**
    - Moved component images (e.g., `siding.png`, `window.png`) into the `public/components/` directory.
    - Updated `src/app/page.tsx` to dynamically render these images using the Next.js `Image` component, along with their names.
    - Implemented image selection state, `onClick` handler, and conditional styling for selected images (blue drop-shadow, scale effect, numbered badge).
    - Added `"use client";` directive to `src/app/page.tsx`.
    - Implemented Interior/Exterior view toggle with separate component lists and grid fade transition.
    - Created and refined `src/app/configure/wrought-iron-railings/page.tsx`.
    - **Implemented React Context for Estimate State (`src/context/EstimateContext.tsx`)**:
        - `EstimateProvider` wraps the application in `src/app/layout.tsx`.
        - `useEstimate` hook provides access to `configuredItems` and actions.
        - `EstimateSidebar.tsx` consumes this context.
        - Configuration pages (`Wrought Iron Railings`, `Deck`) add items to this global context.
    - **Persistent Sidebar Implemented via `layout.tsx`**.
    - Pages refactored for global layout. Header removed from `page.tsx`.
    - UI spacing and padding adjustments on `page.tsx` for compactness.


## Next Steps
- Implement full "edit" functionality for items in the `EstimateSidebar`.
- Generalize the configuration page system and context interaction for other components (e.g., "Porch", "Siding", "Windows").
- User to update actual image dimensions in `page.tsx` for correct aspect ratios on the main selection grid (for all images).
- Thoroughly test responsiveness and visual fidelity for all pages and views, especially the deck configuration page.
- Consider adding a visual cue for the active toggle button (Interior/Exterior) beyond just background color (e.g., font weight).
- Add tests.
- Final review and cleanup.
- Potentially refine the logic for `coatingType` when `railingMaterial` is changed back to 'wood' after being auto-set to 'paint'.

## Active Decisions and Considerations
- The combined deck configuration page (`/configure/deck`) now handles both sub-component selection and their detailed configuration.
- Parameters for Wrought Iron Railings: Decorativeness, Rust Level, Plants in the way, Length, Height.
- Parameters for Deck sub-components: Dimensions (Length/SqFt/Qty, with user overrides and percentage adjustments), Coating Type, Coats, Difficulty, Material. Specifics for stairs (numStairs, width, includeTreads/Risers/Stringers). For `deck-posts`, `width`, `height`, and `userQuantity` (number of columns) are configured in their details section. For `deck-trellis`, `userLength` and `height` are used for area.
- Default values for deck sub-component configurations (coating, difficulty, material, coats) have been set to reflect typical choices (e.g., wood, semi-transparent stain, 2 coats, medium difficulty).
- Global state for the estimate is managed via React Context.
- `addItemToEstimate` function in the context handles adding new items and updating existing ones (if ID matches, which is how pending items become configured).
- Navigation flow: Main Page -> Select Deck -> Deck Config Page -> Save Configuration -> Back to Main Page.
- The root layout (`layout.tsx`) is responsible for the primary page structure including the persistent sidebar.
- Individual component configuration UI aims for clarity by always showing relevant options, rather than hiding/showing based on a global edit mode.

## Important Patterns and Preferences
- Use Next.js features (Client Components, `Image` component, `useRouter`, App Router).
- Maintain clear state management (`useState`, React Context).
- Style with Tailwind CSS, focusing on responsive design.
- Iterative development and refinement based on feedback.
- Controlled components for forms.
- Storing `rawConfigurationData` for estimate items to support future edit functionality.
- Centralizing shared layout in `layout.tsx`.

## Learnings and Project Insights
- Client Components (`'use client';`) are essential for interactivity.
- Careful path management is crucial when renaming/moving files and directories that serve as routes.
- Merging component functionalities (like selection and configuration) into a single page can improve UX by reducing navigation steps, but requires careful state management and UI organization.
- Type safety with TypeScript helps catch issues early, especially when refactoring complex state objects and handlers.
- Tailwind CSS continues to be effective for rapid UI development and complex layouts.
- Detailed UI mockups or clear diffs greatly accelerate implementation.
- React Context is robust for managing shared application state.
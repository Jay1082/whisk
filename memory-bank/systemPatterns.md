# System Patterns

## System Architecture
-   **Framework**: Next.js (App Router)
-   **UI Library**: React
-   **Styling**: Tailwind CSS

## Key Technical Decisions
-   Use Next.js App Router for routing and page structure.
-   Functional components with Hooks for React logic.
-   Utility-first CSS with Tailwind.
-   TypeScript for type safety.

## Design Patterns in Use
-   **Component-Based Architecture**: The UI will be broken down into reusable React components.
-   **Layout Component**: A root layout component (`app/layout.tsx`) will define the overall page structure, including `<html>` and `<body>` tags, and import global styles/fonts.
-   **Page Components**: Each route will have a corresponding page component (e.g., `app/page.tsx`).

## Component Relationships
-   `layout.tsx` will wrap `page.tsx`.
-   `page.tsx` will contain the main content structure, potentially importing sub-components for different sections (e.g., Header, MainContent, Footer - though the example is a single page).

## Critical Implementation Paths
1.  **Next.js Setup**: Correctly initializing the project.
2.  **Tailwind CSS Integration**: Ensuring Tailwind is properly configured and its classes are processed.
3.  **Font Integration**: Making sure the specified Google Fonts are loaded and applied.
4.  **HTML to JSX Conversion**: Accurately translating the HTML structure and Tailwind classes into React components. 
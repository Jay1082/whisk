# Tech Context

## Technologies Used
-   **Next.js**: React framework for server-side rendering, static site generation, routing, etc.
-   **React**: JavaScript library for building user interfaces.
-   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
-   **TypeScript**: Superset of JavaScript that adds static typing.
-   **Node.js**: JavaScript runtime environment (required for Next.js).
-   **npm/yarn/pnpm**: Package manager for Node.js. I will use `npx create-next-app` which defaults to npm but can be switched.

## Development Setup
-   **Installation**: `npx create-next-app@latest`
-   **Tailwind Setup**: Follow the official Next.js + Tailwind CSS guide.
-   **Running Dev Server**: `npm run dev` (or `yarn dev` / `pnpm dev`)

## Technical Constraints
-   Must adhere to the Next.js project structure and conventions.
-   Styling should primarily rely on Tailwind CSS.

## Dependencies
-   `next`
-   `react`
-   `react-dom`
-   `tailwindcss`
-   `postcss`
-   `autoprefixer`
-   ESLint and Prettier (typically included with `create-next-app`)

## Tool Usage Patterns
-   Use `className` for applying Tailwind CSS classes in JSX.
-   Leverage Next.js features like the `Image` component for optimized images (if applicable, though current images are external URLs).
-   Utilize the App Router for defining pages and layouts. 
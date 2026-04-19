# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint validation
npm run preview      # Preview production build
npm test             # Run Vitest unit tests (single run)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright E2E tests (auto-starts dev server)
npm run test:e2e:ui  # Playwright interactive UI mode
```

Run a single unit test file:

```bash
npx vitest run src/tests/someFile.test.ts
```

## Architecture

This is a React + TypeScript PWA for learning French administrative divisions (departments and regions). It has three features accessible via a 3-tab nav:

1. **Carte** — Interactive D3.js SVG map with zoom/pan, department/region/prefecture/river layers, SearchBar, dark mode toggle
2. **Quiz** — Configurable training sessions with 5 subjects and 8 question modes: map-clicking challenges and MCQ variants
3. **Tableau** — Accordion data table of all departments grouped by region

### Data flow

Static data lives in `src/data/` (96 metropolitan departments, 13 regions, adjacency graph, `fleuvesDepts.json` river-department associations). GeoJSON geometry is loaded lazily via `useGeoData` and `useFleuveData` hooks (both in `src/hooks/`). River GeoJSON (`fleuves.json`) is served from `/public/`.

Quiz sessions are orchestrated by `useQuiz` (hook in `src/hooks/`) which calls `generateQuestions` (`src/quiz/`) to build a full session upfront. The 5 subjects (`regions-carte`, `depts-carte`, `depts-numeros`, `depts-prefectures`, `regions-prefectures`) each map to 1–2 `QuizMode` values. For subjects mixing carte and QCM modes (`regions-carte`, `depts-carte`), questions are balanced 50/50 (carte gets the rounding-up half). `buildChoices` implements difficulty-aware distractor selection — "difficile" picks wrong answers from the same region (only applies to carte and numeros subjects; prefecture subjects have no difficulty setting).

`QuizShell` dispatches rendering to one of 8 question-type components in `src/components/quiz/types-questions/` based on `question.mode`.

The D3 map (`CarteFrance.tsx`) uses `useEffect` for zoom behavior and `geoPath` rendering.

### Key constraints

- Bundle size limit is **9 MB** (GeoJSON files are the main contributor; enforced in CI)
- TypeScript strict mode with no unused variables/imports
- PWA: GeoJSON files use Cache-First strategy (30-day expiration via Workbox)
- E2E tests run on Chromium only
- No external API calls — all data is bundled or loaded from `/public/`

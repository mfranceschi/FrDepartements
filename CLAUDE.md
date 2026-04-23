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

## Commit conventions

Commits follow the **Conventional Commits** format, written in **French**:

```text
type(scope): description en français
```

Common types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`  
Scope examples: `quiz`, `carte`, `nav`, `ci`, `settings`, `deps`

Examples from history:

- `feat(carte): préfectures et fleuves cliquables`
- `refactor(quiz,carte): union discriminée Question`
- `test: étendre la couverture (buildChoices, quiz, data, hooks)`

## Source structure

```text
src/
├── pages/              # CartePage, QuizPage, TableauPage, StatsPage
├── components/
│   ├── carte/          # CarteFrance, CoucheDepts/Regions/Fleuves/Prefectures, InfoPanel, SearchBar
│   ├── quiz/
│   │   └── types-questions/   # 8 question-type components (QuestionTrouver*, QuestionDeviner*)
│   └── (shared)        # Nav, SuccessBar, ThemeToggle, ErrorBoundary
├── hooks/              # useGeoData, useFleuveData, useQuiz, useD3Zoom, useSearch, useTheme, useTooltip, useAsyncResource
├── quiz/               # generateQuestions.ts, buildChoices.ts, types.ts
├── data/               # departements.ts, regions.ts, regionAdjacency.ts, fleuvesDepts.ts/.json, maps.ts
├── geo/                # departements.json, regions.json (GeoJSON, heavy — lazy-loaded)
├── storage/            # useLocalStorage, useQuizConfig, useQuizHistory, useItemStats
├── utils/              # scoreTheme.ts
└── tests/              # All unit tests (mirror the src/ structure)
```

## Naming conventions

- **Hooks**: `useXxx.ts` — always in `src/hooks/` or `src/storage/`
- **Components**: PascalCase `.tsx` — grouped in `src/components/<feature>/`
- **Question-type components**: `Question<Verb><Target>.tsx` (e.g. `QuestionTrouverCarte.tsx`, `QuestionDevinerPrefecture.tsx`)
- **Map layers**: `Couche<Layer>.tsx` (e.g. `CoucheDepts.tsx`, `CoucheFleuves.tsx`)
- **Types**: co-located in their module or in `src/quiz/types.ts` for quiz-domain types
- **Test files**: `src/tests/<ComponentOrModule>.test.ts(x)` — named after the thing they test

## Testing philosophy

- **Unit tests** (Vitest + Testing Library): cover components, hooks, and pure logic. All test files live in `src/tests/`.
- **E2E tests** (Playwright, Chromium only): cover flows that require a real browser — GeoJSON loading, SVG map interactions, full quiz sessions, routing. Located in `e2e/`.
- **Property tests**: `buildChoices.property.test.ts` uses randomized inputs to verify distractor invariants.
- GeoJSON hooks (`useGeoData`, `useFleuveData`) are mocked in unit tests — their real loading is covered by E2E.
- The `as QcmQuestion` cast in QCM components is intentional: `QuizShell` guarantees the mode matches before rendering.

### E2E policy

**Write E2E when:**

- A feature loads data at runtime (new fetch from `src/geo/` or `/public/`)
- Behavior depends on the real DOM beyond jsdom (SVG hit-testing, D3 transforms, scroll)
- A flow spans multiple pages or requires real routing

**Do NOT write E2E for:** pure logic (`buildChoices`, `generateQuestions`) or isolated component rendering — use unit tests.

**Performance — serial groups for heavy assets:** when tests share an expensive GeoJSON load, group them with `test.describe.configure({ mode: 'serial' })` and a shared `page` (beforeAll/afterAll). The first test absorbs the load; subsequent tests hit the HTTP cache. Each serial group must be self-contained.

**Timeouts:**

- Default UI interaction: 3–5 s
- GeoJSON / river data first load: 15 s (`test.slow()` triples this for river data, ~50 s)
- Full quiz session (10 questions): `test.setTimeout(90_000)`

**No conditional assertions.** Do not guard assertions with `if (await element.isVisible())` — either assert unconditionally or skip the test explicitly with `test.skip`. Silent no-ops hide regressions.

**New features:** every new user-visible feature must add at least one E2E happy-path test. Runtime data loads require a load + render assertion.

## Known gotchas

- **Centre-Val de Loire adjacency**: this region's neighbors in `regionAdjacency.ts` were wrong and have been corrected — double-check if touching adjacency data.
- **GeoJSON lazy loading**: `src/geo/departements.json` and `src/geo/regions.json` are NOT imported statically; they are fetched at runtime via `useGeoData`/`useFleuveData` to keep the initial bundle small. Do not `import` them directly in components.
- **River GeoJSON** (`fleuves.json`) is served from `/public/` (not `src/`), fetched at runtime.
- **`as QcmQuestion` casts**: QCM question components receive `question: Question` via `QuestionProps` but cast to `QcmQuestion` — this is safe because `QuizShell` only renders them when `isQcmQuestion(question)` is true.
- **50/50 balance**: for subjects mixing carte and QCM modes (`regions-carte`, `depts-carte`), carte gets the ceiling half. Do not change this without updating `generateQuestions.ts` and the corresponding tests.
- **`fleuvesDepts.ts` vs `fleuvesDepts.json`**: the `.ts` file re-exports typed data from the `.json` and is the canonical import — never import the raw JSON directly.

## Constraints — and why

- **Bundle size ≤ 9 MB**: GeoJSON files are large. The limit is enforced in CI. Never import GeoJSON statically; always load lazily. Do not add large new assets without checking the impact.
- **TypeScript strict mode**: `noUnusedLocals` and `noUnusedParameters` are on. Clean up any unused symbols before committing.
- **No external API calls**: all data is either bundled in `src/data/` or loaded from `/public/`. The app must work fully offline (PWA).
- **PWA cache strategy**: GeoJSON files use a Cache-First Workbox strategy (30-day expiration). Changes to these files require a cache bust — bump the file name or use query params if needed.
- **E2E on Chromium only**: Playwright is configured for Chromium. Do not add other browsers without discussing it first.
- **No new dependencies without confirmation**: the bundle budget is tight and the dependency tree is intentionally lean.

## Architecture

This is a React + TypeScript PWA for learning French administrative divisions (departments and regions). It has three features accessible via a 3-tab nav:

1. **Carte** — Interactive D3.js SVG map with zoom/pan, department/region/prefecture/river layers, SearchBar, dark mode toggle
2. **Quiz** — Configurable training sessions with 5 subjects and 8 question modes: map-clicking challenges and MCQ variants
3. **Tableau** — Accordion data table of all departments grouped by region

### Data flow

Static data lives in `src/data/` (96 metropolitan departments, 13 regions, adjacency graph, `fleuvesDepts.json` river-department associations). GeoJSON geometry is loaded lazily via `useGeoData` and `useFleuveData` hooks (both in `src/hooks/`). River GeoJSON (`fleuves.json`) is served from `/public/`.

Quiz sessions are orchestrated by `useQuiz` (hook in `src/hooks/`) which calls `generateQuestions` (`src/quiz/`) to build a full session upfront. The 5 subjects (`regions-carte`, `depts-carte`, `depts-numeros`, `depts-prefectures`, `regions-prefectures`) each map to 1–2 `QuizMode` values. For subjects mixing carte and QCM modes (`regions-carte`, `depts-carte`), questions are balanced 50/50 (carte gets the rounding-up half). `buildChoices` implements difficulty-aware distractor selection — "difficile" picks wrong answers from the same region for departments, from adjacent regions for regions, and from the same region for prefecture subjects too. All 5 subjects support the difficulty setting.

`QuizShell` dispatches rendering to one of 8 question-type components in `src/components/quiz/types-questions/` based on `question.mode`. `Question` is a discriminated union: `CarteQuestion` (no `choices`) and `QcmQuestion` (`choices: Choice[]` required). QCM components receive a `QcmQuestion` at runtime and cast via `question as QcmQuestion`.

D3 zoom behavior is extracted into the `useD3Zoom` hook (`src/hooks/useD3Zoom.ts`); `CarteFrance.tsx` owns only rendering. Info-panel sub-components (EmptyPanel, TerritoryPanel, FleuvePanel) live in `src/components/carte/InfoPanel.tsx`. River-department associations are typed and exported from `src/data/fleuvesDepts.ts`.

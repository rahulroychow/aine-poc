# Performance Report

Measured on 2026-09-01 with Lighthouse 12.8.2 driving headless Chrome 152
against the production build (`npm run build`, served by `vite preview` on
localhost). Two passes: Lighthouse's default mobile profile (simulated
Moto G Power, 4x CPU slowdown, 1.6 Mbps / 150 ms RTT throttling) and the
desktop preset (no throttling). Full HTML reports are in `reports/`.

An earlier performance report in this repository's history quoted figures
that had never been measured. It was deleted (commit e2b304f). Every number
below comes from the two reports in `reports/`.

## Scores

| Category | Mobile | Desktop |
| --- | --- | --- |
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |

## Core metrics

| Metric | Mobile (throttled) | Desktop | PRD target |
| --- | --- | --- | --- |
| First Contentful Paint | 1.2 s | 0.3 s | Page load < 1 s |
| Largest Contentful Paint | 1.2 s | 0.3 s | |
| Speed Index | 1.2 s | 0.3 s | |
| Time to Interactive | 1.2 s | 0.3 s | |
| Total Blocking Time | 0 ms | 0 ms | Interactions < 100 ms |
| Cumulative Layout Shift | 0 | 0 | |
| Main-thread work | 0.1 s | 0.0 s | |
| DOM size | 20 elements | 20 elements | |

The PRD's "page load under 1 second" is met on desktop and on any unthrottled
connection. On Lighthouse's simulated slow-4G mobile profile the first paint
lands at 1.2 s, almost all of it network latency on a 150 ms round trip: the
document, one stylesheet and one script are three sequential-ish requests.
Total Blocking Time of 0 ms means no interaction is delayed by script work,
which is the closest lab proxy for the stories' under-100 ms interaction
targets.

## Payload

| Resource | Requests | Transfer size |
| --- | --- | --- |
| Document | 1 | 1.1 KiB |
| Script | 1 | 48.4 KiB |
| Stylesheet | 1 | 3.3 KiB |
| Images, fonts, media, third-party | 0 | 0 |
| **Total** | **3** | **52.8 KiB** |

The script is React 18 plus the app, minified and gzipped. No fonts are
loaded; the UI uses the system font stack. There are no third-party requests.

## Issues found and what was done

| Finding | Source | Severity | Action |
| --- | --- | --- | --- |
| Heading levels skipped h1 to h3 | Lighthouse accessibility (`heading-order`) | Moderate | **Fixed.** Empty-state and todo headings changed from `h3` to `h2` in `TodoList.jsx`; tests updated. Note that axe's WCAG A/AA tag set does not include this rule, which is why the E2E audit had not caught it. |
| Console error: `favicon.ico` 404 | Lighthouse best practices (`errors-in-console`) | Low | **Fixed.** Inline SVG favicon added to `index.html`. |
| No meta description | Lighthouse SEO | Low | **Fixed.** Added to `index.html`. |
| `robots.txt` invalid (SPA fallback returned HTML) | Lighthouse SEO | Low | **Fixed.** `public/robots.txt` added. |
| Render-blocking stylesheet, est. 150 ms on mobile | Lighthouse performance (informational, score unaffected) | Low | **Not changed.** Inlining 3 KiB of critical CSS would save ~150 ms on throttled mobile only. Vite's default is kept for simplicity. |
| Unused JavaScript, est. 21 KiB | Lighthouse performance (informational) | Low | **Not changed.** This is React's runtime; the app's own code is a small fraction of the bundle. Preact or code-splitting are the levers if this matters later. |

Before the fixes the mobile pass scored 98 accessibility, 96 best practices
and 90 SEO; after, 100 on all four categories on both form factors.

## Runtime behaviour worth knowing

- **Every state change rewrites the whole todo list to localStorage.** Linear
  in list size, synchronous, on the main thread. Fine for hundreds of todos;
  a list of tens of thousands would start to show on toggle. The PRD does not
  target that scale.
- **Rehydration filters the stored list once on mount.** Also linear, also
  negligible at expected sizes.
- **No memoisation in `TodoList`.** Each toggle re-renders every row. With 20
  DOM elements per todo this is far below any perceptible threshold at
  realistic sizes.

## Not measured

- Real-user metrics on real devices and networks. All figures are lab.
- Server load. The Express service serves health endpoints only.
- Interaction latency under the stories' 100 ms target, directly. Total
  Blocking Time of 0 ms is indirect evidence.
- Chrome DevTools MCP was not used; see `AI_INTEGRATION_LOG.md`.

## Reproduce

```bash
npm run build
npx vite preview --port 4173 &
npx lighthouse@12 http://localhost:4173/ --output=html --output-path=./lh-mobile
npx lighthouse@12 http://localhost:4173/ --preset=desktop --output=html --output-path=./lh-desktop
```

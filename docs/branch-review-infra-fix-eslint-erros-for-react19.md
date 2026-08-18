# Branch QA & Review Guide

**Branch:** `infra-fix-eslint-erros-for-react19`  
**Base:** `origin/development`  
**Last updated:** 2026-08-07  
**Scope:** ~867 files — React **19**, CRA → **Vite/ESM**, **igz-controls** internalized, RFF v7, Node **24**, ESLint/React ref patterns.

This document is the **QA sign-off checklist** for the branch: what to run automatically, what to click through manually, and **how to reproduce** each known edge case.

---

## Executive summary for QA

| Area | Status / note |
|------|----------------|
| Unit tests | `npm run test` — **475/475** pass (vitest) |
| Production build | `npm run build` — pass |
| Playwright (mock + `:3000`) | Full suite **79/79** pass after mock + branch fixes (see below) |
| Branch fixes included in QA scope | `Projects.jsx` YAML **export** (`file-saver` ESM); mock **`filter[name]`** for project settings |

**Risk focus for manual QA:** forms (RFF v7), date/range filters, project settings **Members**, YAML view/export, Applications (nextGen tables/modals), production deploy path (`/mlrun` basename).

---

## QA environment setup

### Local UI + mock (recommended for most QA)

From repo root `~/Projects/ui`:

```bash
# Terminal 1 — mock API on :30000
npm run mock-server

# Terminal 2 — Vite dev server on :3000 (proxies to mock via .env.development)
npm start
```

**Verify:**

- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200`
- Iguazio projects filter (after mock fix):  
  `curl -s "http://localhost:30000/platform-api.default-tenant.app.vmdev36.lab.iguazeng.com/api/projects?filter%5Bname%5D=default&include=owner"` → **200** JSON (not HTML error page)

**Default project for tests:** `default` (same as Playwright `ui-browser-tests` fixtures).

**Node:** `>=24.15.0` (see `package.json` engines).

### Automated browser suite (optional but recommended)

```bash
cd ~/Projects/ui-browser-tests
npm install
npx playwright install chromium
npm test
```

Requires UI + mock running as above.

### Staging / production-like (required subset)

- Build with the **same env** CI/Docker uses: `VITE_PUBLIC_URL` (often `/mlrun`), assets under that base path.
- Smoke: open app at deployed URL, confirm routing (not blank page / 404 on JS chunks), login/proxy as usual for your env.

---

## Branch fixes QA must validate

### 1. Project YAML export (`FileSaver.saveAs is not a function`)

**What broke:** ESM import treated `file-saver` default export as the `saveAs` function, not `{ saveAs }`.

**Fix:** `import saveAs from 'file-saver'` and call `saveAs(blob, filename)`.

**How to reproduce (before fix):**

1. Mock + UI up, go to **Projects** (`/projects`).
2. Row actions → **Export YAML** (or equivalent export action on a project).
3. **Expected before fix:** console `TypeError: FileSaver.saveAs is not a function`, no download.

**How to verify (after fix):**

1. Same steps on project `default` (or any project mock returns).
2. **Expected:** browser downloads `{projectName}.yaml` with valid YAML content.
3. **Pass criteria:** no console error; file opens and contains `kind: project` (or project metadata).

### 2. Project settings — General / Members (mock `filter[name]`)

**What broke:** Mock handler read `req.query.filter.name`, but Express receives `req.query['filter[name]']` → **500** on `GET .../api/projects?filter[name]=default&include=owner` → settings could not load owner/members → **Members tab hidden**; URL `/settings/members` showed **General** content; no visible **Members** tab label/content.

**Fix:** `tests/mockServer/mock.js` — `getIguazioProjectFilterName()` reads both shapes; 404 if project/owner missing.

**How to reproduce (before fix / broken mock):**

1. Restart mock **without** the fix (or curl the URL above → HTML error / 500).
2. Open `http://localhost:3000/projects/default/settings/members`.
3. **Expected broken:** no **Members** tab in settings sub-nav (or tab missing); page looks like **General**; possible error toast on load; network tab shows failed Iguazio `projects?filter[name]=...`.

**How to verify (after fix):**

1. **Restart mock-server** after pulling branch (mock does not hot-reload).
2. Navigate: **Project settings** → **Members** tab, or direct URL `/projects/default/settings/members`.
3. **Expected:** **Members** tab visible (if membership feature flag enabled in `frontendSpec`); members summary text (e.g. “owner … members have access…”); **Manage members** UI if authorization mock allows.
4. **General tab:** `/projects/default/settings/general` loads without console **500**.
5. **Automation:** Playwright `agentic-screens` → `project-settings-general`, `project-settings-members` pass.

**Who can see Members tab (product rules):** tab hidden unless `project_membership` enabled **and** user is owner, project admin, or has **Project Security Admin** policy — see `isProjectMembersTabShown` in `projectSettings.util.jsx`. Mock user `iguazioSelf.json` includes **Project Security Admin**.

---

## QA test plan — priority order

### P0 — Smoke (must pass before wider QA)

| # | Area | Steps | Pass criteria |
|---|------|--------|----------------|
| P0-1 | App boot | Open `/projects` | List loads, sidebar, no red error overlay |
| P0-2 | Navigation | Projects → Jobs (monitor) → Feature sets → Functions → Applications | Each major page renders table or empty state |
| P0-3 | Project export YAML | Projects → export YAML | Download works (see § Branch fixes) |
| P0-4 | Project settings | General + Members tabs | Both load, no 500 in network |
| P0-5 | Create Feature Set panel | Feature Store → create panel, URL path field | Panel opens/closes, no infinite loading spinner (render loop) |

**Playwright coverage:** `major-pages-navigation`, `rff-form-smoke`, `render-adjust-smoke`, `project-settings-*`.

### P1 — Forms & React Final Form v7

Major dependency bump; highest behavioral risk outside automation.

| # | Scenario | How to reproduce | Pass criteria |
|---|----------|------------------|---------------|
| P1-1 | Feature Set create | Feature Store → **New feature set** → fill name, URL path (Combobox), save/discard | Validation messages; Apply/Discard on URL path; no freeze |
| P1-2 | Feature Set filters (DatePicker + external invalid) | Create FS → **Data source** → set **Start time** / **End time** invalid or empty → trigger validation (next step or submit) | Red invalid state clears when fixed; start/end sync with parent validation |
| P1-3 | Job wizard / Create project | Open wizards that use `createForm`; enter data, navigate away and back | Draft/dirty behavior unchanged; no duplicate forms |
| P1-4 | Field arrays | Function deploy wizard: Data Input / Volume / Env var rows add/remove | Rows register immediately; inputs editable |
| P1-5 | Hub filters | Function hub category filters, apply, remount page | Applied filters restore from URL where designed |

**Playwright:** `rff-v7-migration.spec.js` (6 tests), `rff-form-smoke.spec.js`.

**Edge — Feature Set URL path (Combobox):**

1. Create feature set → edit **URL path**.
2. Change **path type** dropdown (storage scheme).
3. Type in path field; use **Apply** and **Discard**.
4. **Edge case (theoretical):** clear path type selection without changing the default prop object — default should re-apply; if it does not, path type may stay empty until user picks again. **Report if** Apply stays disabled incorrectly after Discard.

### P1 — Date & time filters (DatePicker refactor)

Used on **Alerts**, **Jobs**, **Models**, **Filter menu**, **Project monitoring**, etc.

| # | Scenario | How to reproduce | Pass criteria |
|---|----------|------------------|---------------|
| P1-6 | Alerts date range | Alerts → change date range → Apply | Table refreshes; dropdown closes; no error popup |
| P1-7 | Required empty range | Pick required date filter → leave empty → Apply/search | Invalid styling; message shown |
| P1-8 | Preset option | Open date picker → choose preset (e.g. last 7 days) | Range updates; picker closes when valid |
| P1-9 | Custom range typing | Type date/time in masked fields mid-string, delete middle chars, paste full date | Caret reasonable; mask matches old behavior (MaskedInput) |

**Edge — `selectedOption` vs changing options (theoretical):**

- Only matters if parent changes `customOptions` / `timeFrameLimit` **without** changing `selectedOptionId` while picker stays mounted.
- **Reproduce attempt:** use a screen that passes dynamic `customOptions` (if any); toggle parent state that rebuilds options with same selected id.
- **Pass:** displayed preset label still matches list; **Fail:** stale/orphan option label.

**Edge — `externalInvalid` (Feature Set filter parameters only):**

1. Feature set create → Data source → **Filter parameters**.
2. Set start time after end time or leave required times empty.
3. Move to next wizard step or submit.
4. Fix times.
5. **Pass:** invalid state clears; **Fail:** stuck invalid or flicker loop.

**Playwright:** `pagination-config-smoke` (Alerts/Models/Functions), `ml-12914-iframe-status-filter`, `agentic-interaction-sweep` (alerts combo).

### P1 — YAML viewing & export

Three intentional paths; QA confirms each still works.

| # | Path | How to reproduce | Pass criteria |
|---|------|------------------|---------------|
| P1-10 | Legacy Redux YAML | Functions / Jobs / Artifacts row → **View YAML** | Single global modal; YAML readable; close works |
| P1-11 | Projects YAML | Projects → **View YAML** / export | View modal or download; large project uses fallback if applicable |
| P1-12 | Applications YAML | Applications → app → **View YAML** (overview/config) | nextGen dialog modal |
| P1-13 | Monitoring endpoints | App → Monitoring endpoints → row **View YAML**; open row details → YAML from dialog if present | Both modals work; content appropriate to action (endpoint object vs function UI) |

**Edge — nextGen vs legacy content:**

- Legacy `toggleYaml` strips `spec.extra_data.model_spec.yaml`; nextGen modal may show full dump for some payloads.
- **Reproduce:** open YAML on application whose UI object includes large `extra_data`; compare with Functions YAML for same backend object if available.
- **Pass:** no crash; content acceptable for product; **Note:** parity difference is known, not necessarily a blocker.

**Large project YAML (> ~2 MB):**

1. Use project with huge `mlrun_project` in mock or staging.
2. View YAML from Projects.
3. **Expected:** fallback message or download path per `Projects.jsx` logic — not browser hang.

### P1 — Applications & nextGen DataTable

| # | Scenario | How to reproduce | Pass criteria |
|---|----------|------------------|---------------|
| P1-14 | Applications list | `/projects/default/applications` | Table, filters, navigate to detail |
| P1-15 | Build logs states | App **vizro** → Build logs: initialized / deploying / ready (mock apps) | ML-12730: no spurious 404 popup when deploying+404 |
| P1-16 | Table interactions | Sort, filter, row actions, details panel | No layout collapse; selection works |
| P1-17 | Empty / filtered empty | Filter to zero rows | Empty state, no NaN column widths |

**Playwright:** `build-logs`, `mock-functions`, `major-pages-navigation` (Applications), agentic application screens.

**Edge — DataTable column width:** all columns size 0 in config (dev-only misconfig) → **Fail:** broken layout; unlikely in shipped configs.

### P2 — Project settings depth

| # | Scenario | How to reproduce | Pass criteria |
|---|----------|------------------|---------------|
| P2-1 | General — edit metadata | Change description/params where editable → save | Saves or shows expected error |
| P2-2 | Secrets tab | `/projects/default/settings/secrets` | Secrets UI loads |
| P2-3 | Members — manage | Members tab → open manage members (if shown) | List loads; no perpetual loader |
| P2-4 | Delete project | Delete (as owner/admin) | Confirm dialog; behavior unchanged |

### P2 — Sidebar & layout

| # | Scenario | Steps | Pass criteria |
|---|----------|--------|---------------|
| P2-5 | Sidebar navigation | Collapse/expand, pin (if visible in your theme) | No crash; links work |
| P2-6 | Project dropdown | Switch project from sidebar | Routes update |

**Note:** Playwright `simple-sidebar` logs “PIN BUTTON NOT FOUND” but passes — pin affordance may depend on layout/CSS; verify visually if your release cares about pin.

### P2 — Real backend / staging (if available)

Run **P0 + P1** subset against staging with real Iguazio + MLRun (not only mock):

- Project settings Members with real RBAC.
- Production basename `/mlrun` (or your `VITE_PUBLIC_URL`).
- SSO/session headers (not mock `x-remote-user: admin`).

---

## Edge-case reproduction cheat sheet

Quick reference for testers filing bugs — include **URL**, **project**, **browser**, **network failing request**.

| ID | Component | Trigger | Steps to reproduce | Expected (pass) | Failure signal |
|----|-----------|---------|-------------------|-------------------|----------------|
| EC-01 | Combobox | Default not restored after clear | Feature set → URL path → clear type selection without changing parent path type prop | Default type re-applies or user can re-select | Empty type, Apply stuck |
| EC-02 | DatePicker | Stale preset label | Screen with dynamic `customOptions`; change options while keeping same `selectedOptionId` | Label matches option list | Wrong label/range |
| EC-03 | DatePicker | externalInvalid desync | FS → Filter parameters → invalid start/end → fix values | Invalid UI clears | Stuck red border or loop |
| EC-04 | DatePicker | Memo / perf | Page with many date pickers (monitoring); interact unrelated parent state | Usable, no severe lag | Visible slowness only — file perf bug if bad |
| EC-05 | MaskedInput | Caret on date fields | Date range → edit middle of masked field, paste | Sensible caret/mask | Jumping cursor, wrong digits |
| EC-06 | YAML | Dual modals | Monitoring endpoints → row YAML + dialog YAML same session | Both open/close independently | Stale content in wrong modal |
| EC-07 | YAML | extra_data size | Application YAML with large model_spec in extra_data | Loads or truncates acceptably | Hang or unusable modal |
| EC-08 | Projects export | ESM saveAs | Export YAML from projects list | File downloads | Console TypeError saveAs |
| EC-09 | Mock settings | filter query | Broken mock: curl projects with `filter[name]=default` | 200 JSON | 500 / Members tab missing |
| EC-10 | Forms | RFF remount | Wizards with dirty state; refresh mid-flow | Predictable dirty/reset | Lost data without warning or duplicate submit |

---

## Automated test matrix (Playwright)

| Spec file | What it guards |
|-----------|----------------|
| `major-pages-navigation.spec.js` | Cross-page smoke |
| `rff-v7-migration.spec.js` | RFF v7 forms, FieldArray, DRC, Create Project dirty |
| `rff-form-smoke.spec.js` | Feature set form |
| `render-adjust-smoke.spec.js` | Feature set URL path / render loop |
| `pagination-config-smoke.spec.js` | Date filter threading Alerts/Models/Functions |
| `build-logs.spec.js` / `mock-functions.spec.js` | ML-12730 build log 404 gating |
| `group-row-expand.spec.js` | Grouped table expand |
| `jobs-actions-menu.spec.js` | Jobs row menu |
| `agentic-screens.spec.js` | Broad route catalog incl. settings |
| `agentic-interaction-sweep.spec.js` | Navbar + deep combos |

**Full run:** `cd ~/Projects/ui-browser-tests && npm test` (with mock + UI up).

---

## Infra / release checks (QA awareness — often DevOps)

Not always manual QA, but **release blockers** if your process includes them:

| Check | Why |
|-------|-----|
| `VITE_PUBLIC_URL` set for production build | Wrong base → broken assets/routes |
| Deployed app at `/mlrun` (or configured base) | Router basename must match |
| Node 24 in CI/Docker | Engine requirement |
| `npm run lint` with `NODE_ENV=production` in CI | Stricter rules only in prod mode today |

---

## Known non-blockers / deferred

| Item | Note |
|------|------|
| `tests/mockServer/backendSynchronizator.js` + `yaml.safeDump` | Standalone fixture sync script; **not** used by `mock-server` |
| `src/hooks/yaml.hook.js` | Dead code; no UI impact |
| YAML sanitization parity nextGen vs Redux | Product decision / follow-up |

---

## Review agent references (engineering)

| Agent | Role | ID |
|-------|------|-----|
| Bugbot | Regressions, routing/YAML | [2026dd04-8104-4dae-afab-a450addb54e8](2026dd04-8104-4dae-afab-a450addb54e8) |
| Security | XSS, env, mocks | [0e7aed9d-f5d1-4913-9508-1d86bfb15c2c](0e7aed9d-f5d1-4913-9508-1d86bfb15c2c) |
| Infra | Vite, CI, deps | [6b7b90fe-aa70-4ee1-aeab-51a0a5a7f7bf](6b7b90fe-aa70-4ee1-aeab-51a0a5a7f7bf) |
| UI architecture | DataTable, YamlModal, pickers | [f2079133-2afb-48ea-b6c1-a29c15514316](f2079133-2afb-48ea-b6c1-a29c15514316) |
| QA / mocks | Mock server, E2E | [34f0b52b-8084-4a5c-9549-deeb25c01b50](34f0b52b-8084-4a5c-9549-deeb25c01b50) |

---

## QA sign-off template

Copy into ticket/PR when done:

```text
Environment: [ ] mock+local  [ ] staging  [ ] production-like build
Automated: [ ] vitest  [ ] npm run build  [ ] Playwright full (79/79)
P0 smoke: [ ] all pass
P1 areas tested: _______________________
Edge cases attempted (IDs): _______________________
Blockers found: _______________________
Signed off by: __________ Date: __________
```

---

_Document combines multi-agent review, Playwright runs, and follow-up fixes (file-saver export, mock `filter[name]`)._

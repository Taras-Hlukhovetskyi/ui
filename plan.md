# React 19 Migration Plan — `ui` + `dashboard-react-controls` (DRC)

> Status snapshot (as of writing): `ui` already **builds** and passes **457/457 tests** on
> React 19 + RTK 2 + redux 5 + react-redux 9 (installed with `--legacy-peer-deps`).
> The remaining work is: finish dependency bumps cleanly, migrate DRC in lockstep, and
> eliminate the **204 `eslint-plugin-react-hooks@7` violations** before cutover.

## Decisions (locked)

- **react-final-form**: bump to `react-final-form@^7` + `final-form@^5` + `final-form-arrays@^4` + `react-final-form-arrays@^5` (clean peers). _Not_ keeping v6.
- **Hooks violations**: fix **all** 204 before the React 19 cutover (hard gate).
- **react-text-mask**: handled in a separate branch — out of scope here.
- **Form-lib swap** (final-form → react-hook-form) in DRC is a separate in-flight effort; this migration must not collide with it at integration.

## Sequencing overview

```
Phase 1 (DRC)  ─►  Phase 2 (ui deps)  ─►  Phase 3 (hooks = 0 errors)  ─►  Phase 4 (cutover)
```

DRC must ship a React-19-built `dist` first because `ui` consumes it from
`node_modules/iguazio.dashboard-react-controls/dist` (aliased `igz-controls`),
validated locally via `npm run nli` (npm link).

---

## Already done (no ticket needed)

- `ui`: ESLint toolchain upgraded — `eslint-plugin-react-hooks 5 → 7`, `eslint-config-prettier 9 → 10`, `eslint-plugin-react-refresh 0.4 → 0.5`, `@eslint/js`/`globals` bumped. Stayed on **ESLint 9** (eslint-plugin-react peer caps at `^9.7`; do **not** jump to ESLint 10).
- `ui`: `react`/`react-dom → ^19.2.7`, `react-redux → ^9.3.0`, `@reduxjs/toolkit → ^2.12.0`, `redux → ^5.0.1`, `redux-thunk → ^3.1.0`. Store (`src/store/toolkitStore.js`) needed no change.
- `ui`: added `@testing-library/dom@^10.4.1` devDep (required peer of `@testing-library/react@16` once peers aren't auto-resolved).

---

# PHASE 1 — DRC (dashboard-react-controls)

### TICKET 1.1 — DRC: dependency bump to React 19

- **Goal**: DRC dev/build environment runs React 19.
- **Files**: `dashboard-react-controls/package.json`.
- **Steps**:
  - dev `react`/`react-dom`: `^18.3.1 → ^19`.
  - `@types/react`: `18.3.28 → ^19`; `@types/react-dom`: `18.3.7 → ^19`.
  - `react-redux`: `^7.2.9 → ^9` (RTK already `^2.8.2` — OK).
  - `eslint-plugin-react-hooks`: `^5.1.0 → ^7`; `eslint-plugin-react-refresh → ^0.5`.
  - Peers: change `react`/`react-dom` from `*` to `^18.3.1 || ^19.0.0` (leave others `*`).
- **Acceptance**: `npm install` resolves; `npm run build` produces `dist`.
- **Risk**: Low. **Depends on**: none.

### TICKET 1.2 — DRC: hooks v7 audit + fix

- **Goal**: 0 `react-hooks/*` errors in DRC (same rules as `ui`).
- **Steps**:
  - Run `npm run lint` after 1.1; quantify `refs` / `set-state-in-effect` / `immutability` / `purity` counts (currently unknown — DRC still lints with hooks v5).
  - Fix violations. DRC owns shared primitives (Select, DatePicker, Tooltip, Modal, Table) so these are high-leverage.
- **Acceptance**: `npm run lint` clean.
- **Risk**: Medium (count unknown). **Depends on**: 1.1.

### TICKET 1.3 — DRC: validate final-form v5 path

- **Goal**: DRC's final-form code path works on `final-form@5` / `react-final-form@7` (its peers are `*`, so it must be tested against the versions `ui` will ship).
- **Steps**: install final-form v5 set in DRC dev deps; run `npm run test:run` and `DRC_FORM_LIB=rhf npm run test:rhf`.
- **Acceptance**: both test modes pass.
- **Risk**: Medium (overlaps with the RHF swap). **Depends on**: 1.1.

### TICKET 1.4 — DRC: build + storybook smoke on React 19

- **Goal**: confirm Radix UI, `react-day-picker@9`, `@tanstack/react-table`, `@tanstack/react-virtual`, `react-transition-group` render under React 19.
- **Steps**: `npm run build` (vite + tsc), `npm run test:coverage`, storybook smoke of key components.
- **Acceptance**: build + tests green; no console ref/act errors in storybook.
- **Risk**: Low–Medium. **Depends on**: 1.1–1.3.

### TICKET 1.5 — DRC: version bump, link, publish

- **Goal**: a React-19-ready DRC available to `ui`.
- **Steps**: bump version (e.g. `3.3.0`); validate locally via `npm run nli` from `ui`; publish; `ui` pins the new version.
- **Acceptance**: `ui` installs the new version without `igz-controls` resolution errors.
- **Risk**: Low. **Depends on**: 1.1–1.4.

---

# PHASE 2 — `ui` dependency finalization

### TICKET 2.1 — ui: redux stack ✅ DONE

- RTK2 / redux5 / react-redux9 / redux-thunk3 installed; store unchanged; build + tests pass. (Tracking only — no work.)

### TICKET 2.2 — ui: react-final-form v7 / final-form v5 bump

- **Goal**: clean React 19 peers for the forms layer.
- **Files**: `package.json` + ~41 form files (see Appendix B).
- **Steps**:
  - `react-final-form ^6.5.9 → ^7`, `final-form ^4.20.10 → ^5`, `final-form-arrays ^3.1.0 → ^4`, `react-final-form-arrays ^3.1.4 → ^5`.
  - Verify `final-form@5` breaking changes across all consumers (public API `Form`/`Field`/`useField`/`FormSpy`/`arrayMutators` is stable; risk is ESM/interop + mutator typing).
- **Acceptance**: build + full vitest pass; forms render/validate/submit in browser smoke.
- **Risk**: Medium (final-form major). **Depends on**: coordinate with DRC 1.3.

### TICKET 2.3 — ui: peer resolution strategy

- **Goal**: replace ad-hoc `--legacy-peer-deps` with an intentional, committed choice.
- **Steps**: either commit `.npmrc` with `legacy-peer-deps=true`, or add targeted `overrides`. Keep the `@testing-library/dom` devDep. Consume the new DRC version from 1.5.
- **Acceptance**: clean `npm install` documented and reproducible in CI/Docker.
- **Risk**: Low. **Depends on**: 1.5, 2.2.

---

# PHASE 3 — Hooks remediation (must reach **0 errors** before cutover)

> Current `ui` totals: **204 errors + 15 warnings**. Re-generate anytime with:
> `npx eslint "src/**/*.{js,jsx}" -f json > /tmp/eslint-report.json`

| Rule                                      | Count | Files | Ticket |
| ----------------------------------------- | ----- | ----- | ------ |
| `react-hooks/set-state-in-effect`         | 117   | 82    | 3.4    |
| `react-hooks/refs`                        | 55    | 31    | 3.3    |
| `react-hooks/immutability`                | 23    | 15    | 3.2    |
| `react-hooks/purity`                      | 4     | 3     | 3.5    |
| `react-hooks/preserve-manual-memoization` | 3     | 3     | 3.1    |
| `react-hooks/use-memo`                    | 2     | 2     | 3.1    |

### TICKET 3.1 — Hooks quick wins (use-memo + preserve-manual-memoization)

- **Goal**: clear 5 trivial errors.
- **Files**: `DetailsFeaturesAnalysis.jsx`, `DetailsStatistics.jsx` (use-memo); `DetailsInfoItemChip.jsx`, `ScheduledJobsCounters.jsx`, `ApplicationMonitoringEndpoints.jsx` (preserve-manual-memoization).
- **Fix**: wrap `useMemo` first arg in an inline function; align/clean up memo deps.
- **Risk**: Low.

### TICKET 3.2 — Hooks: immutability (23)

- **Goal**: 0 `react-hooks/immutability` errors.
- **Sub-messages**: "Cannot access variable before it is declared" (18), "This value cannot be modified" (2), "Cannot reassign variable after render completes" (2), "Cannot modify local variables after render completes" (1).
- **Hot files**: `ProjectsPage/Projects.jsx` (×5), `Select.jsx` (×2), `FunctionsPage/Functions.jsx` (×2), `FunctionsPageOld/FunctionsOld.jsx` (×2), `usePagination.hook.js` (×2), + 10 more (Appendix A).
- **Fix**: review each — reorder declarations, avoid mutating render-scope vars, hoist into refs/effects where appropriate. Some may be latent bugs.
- **Risk**: Medium (case-by-case).

### TICKET 3.3 — Hooks: refs-during-render (55) — forms first

- **Goal**: 0 `react-hooks/refs` errors ("Cannot access refs during render").
- **Pattern**: writing/reading `ref.current` in render or `useMemo` (e.g. `Pagination.jsx` writes `rightSideRef.current` inside a memo).
- **Priority files (form-related, overlaps final-form concern)**: `JobWizard.jsx`, `FeatureSetsPanel.jsx`, `CreateProjectDialog.jsx`, `RegisterArtifactModal.jsx`, `RegisterModelModal.jsx`, `AddArtifactTagPopUp.jsx`, `ChangeOwnerPopUp.jsx`, `DeployModelPopUp.jsx`, `CreateFeatureVectorPopUp.jsx`.
- **Then**: remaining 22 files (Appendix A).
- **Fix**: move ref writes into effects/event handlers; compute derived values without a ref.
- **Risk**: Medium.

### TICKET 3.4 — Hooks: set-state-in-effect (117) — in waves

- **Goal**: 0 `react-hooks/set-state-in-effect` errors.
- **Dominant pattern**: syncing an external/default value into local state inside an effect (e.g. `Combobox.jsx`, `DatePicker.jsx` ×5).
- **Suggested wave split (separate tickets/PRs to stay reviewable)**:
  - 3.4a `src/common/**` (~18 files)
  - 3.4b `src/elements/**` (~25 files)
  - 3.4c `src/components/**` (~30 files)
  - 3.4d `src/hooks/**` + `src/layout/**` + `src/nextGenComponents/**` (~9 files)
- **Fix**: derive-during-render, `key`-based reset, or move into event handler; only keep `setState` in effect when genuinely syncing to an external system.
- **Risk**: Medium–High (volume). Full file list in Appendix A.

### TICKET 3.5 — Hooks: purity (4)

- **Goal**: 0 `react-hooks/purity` errors ("Cannot call impure function during render").
- **Files**: `ProjectStatisticsCounter.jsx` (×2), `DetailsStatisticsTableRow.jsx`, `ApplicationsPage.jsx`.
- **Fix**: memoize or move impure calls out of render.
- **Risk**: Low–Medium.

---

# PHASE 4 — Cutover & rollout

### TICKET 4.1 — Cutover gate verification

- **Acceptance (all required)**:
  - `npm run lint` → **0 errors** (hooks included).
  - `npm run build` succeeds.
  - `npx vitest run` → all pass.
  - Browser smoke (Playwright): forms (final-form), modals/tooltips/transitions (DRC), ReactFlow pipelines, notifications, DatePicker.
- **Depends on**: all of Phase 1–3.

### TICKET 4.2 — Coordinated release

- Publish DRC (1.5) and bump `ui`'s dependency in the same release; update Docker/CI install to match the peer-resolution strategy (2.3).

---

## Appendix A — full file lists (for ticket breakdown)

### `react-hooks/refs` (31 files)

```
4  src/common/Search/Search.jsx
4  src/common/Select/Select.jsx
4  src/elements/ChangeOwnerPopUp/ChangeOwnerPopUp.jsx
3  src/common/TimePicker/TimePicker.jsx
3  src/components/FunctionsPage/Functions.jsx
3  src/components/FunctionsPageOld/FunctionsOld.jsx
2  src/common/Pagination/Pagination.jsx
2  src/components/Alerts/Alerts.jsx
2  src/components/JobWizard/JobWizard.jsx
2  src/components/ProjectsPage/CreateProjectDialog/CreateProjectDialog.jsx
2  src/components/RegisterArtifactModal/RegisterArtifactModal.jsx
2  src/elements/AddArtifactTagPopUp/AddArtifactTagPopUp.jsx
2  src/elements/DeployModelPopUp/DeployModelPopUp.jsx
2  src/elements/DetailsPopUp/FunctionPopUp/FunctionPopUp.jsx
2  src/elements/RegisterModelModal/RegisterModelModal.jsx
1  src/common/ReactFlow/MlNodeWithSubItems/MlNodeWithSubItems.jsx
1  src/components/ActionBar/ActionBar.jsx
1  src/components/ApplicationMetrics/ApplicationMetrics.jsx
1  src/components/Artifacts/ArtifactsTable.jsx
1  src/components/FeatureSetsPanel/FeatureSetsPanel.jsx
1  src/components/FeatureStore/FeatureVectors/FeatureVectors.jsx
1  src/components/FilterMenuModal/FilterMenuModal.jsx
1  src/components/FunctionsPage/FunctionsView.jsx
1  src/components/FunctionsPanel/FunctionsPanel.jsx
1  src/elements/CreateFeatureVectorPopUp/CreateFeatureVectorPopUp.jsx
1  src/elements/DeleteArtifactPopUp/DeleteArtifactPopUp.jsx
1  src/elements/FeatureStoreTableRow/FeatureStoreTableRow.jsx
1  src/elements/FunctionsTableRow/FunctionsTableRowOld.jsx
1  src/elements/MetricsSelector/MetricsSelector.jsx
1  src/elements/ProjectSettingsSecrets/ProjectSettingsSecrets.jsx
1  src/hooks/useInitialTableFetch.hook.js
```

### `react-hooks/immutability` (15 files)

```
5  src/components/ProjectsPage/Projects.jsx
2  src/common/Select/Select.jsx
2  src/components/FunctionsPage/Functions.jsx
2  src/components/FunctionsPageOld/FunctionsOld.jsx
2  src/hooks/usePagination.hook.js
1  src/common/Notifications/Notification.jsx
1  src/components/AddToFeatureVectorPage/AddToFeatureVectorPage.jsx
1  src/components/DetailsInputs/DetailsInputs.jsx
1  src/components/FeatureStore/FeatureVectors/FeatureVectors.jsx
1  src/components/JobWizard/JobWizardSteps/JobWizardFunctionSelection/JobWizardFunctionSelection.jsx
1  src/components/ModelsPage/RealTimePipelines/RealTimePipelines.jsx
1  src/components/MonitoringApplicationsPage/MonitoringApplications/MEPsWithDetections.jsx
1  src/elements/ProjectSettingsSecrets/ProjectSettingsSecrets.jsx
1  src/elements/ScheduledJobsTable/ScheduledJobsTable.jsx
1  src/hooks/useJobsPageData.js
```

### `react-hooks/set-state-in-effect` (82 files)

```
5  src/common/DatePicker/DatePicker.jsx
4  src/common/Combobox/Combobox.jsx
4  src/components/DetailsTransformations/DetailsTransformations.jsx
3  src/components/ConsumerGroup/ConsumerGroup.jsx
3  src/components/FeatureSetsPanel/FeatureSetsPanelTargetStore/FeatureSetsPanelTargetStore.jsx
3  src/components/FeatureSetsPanel/UrlPath.jsx
3  src/components/ProjectsPage/Projects.jsx
3  src/elements/DeployModelPopUp/DeployModelPopUp.jsx
3  src/hooks/useSortTable.hook.jsx
2  src/common/Search/Search.jsx
2  src/common/SuggestionsChips/SuggestionsChips.jsx
2  src/components/DetailsMetrics/DetailsMetrics.jsx
2  src/components/DetailsPipeline/DetailsPipeline.jsx
2  src/components/DetailsPods/DetailsPods.jsx
2  src/components/FeatureStore/FeatureSets/FeatureSets.jsx
2  src/components/FeatureStore/FeatureVectors/FeatureVectors.jsx
2  src/components/FilterMenu/FilterMenu.jsx
2  src/components/JobWizard/JobWizardSteps/JobWizardFunctionSelection/JobWizardFunctionSelection.jsx
2  src/elements/AddFeatureButton/AddFeatureButton.jsx
2  src/elements/MetricsSelector/MetricsSelector.jsx
2  src/hooks/groupContent.hook.js
2  src/hooks/useVirtualization.hook.js
1  src/common/ExpandableText/ExpandableText.jsx
1  src/common/FormTagFilter/FormTagFilter.jsx
1  src/common/RadioButtons/RadioButtons.jsx
1  src/common/RangeInput/RangeInput.jsx
1  src/common/ReactFlow/MlReactFlow.jsx
1  src/common/Sort/Sort.jsx
1  src/common/TagFilter/TagFilter.jsx
1  src/common/TargetPath/TargetPath.jsx
1  src/common/TimePicker/TimePicker.jsx
1  src/components/ActionBar/ActionBar.jsx
1  src/components/ApplicationMetrics/ApplicationMetrics.jsx
1  src/components/ConsumerGroups/ConsumerGroups.jsx
1  src/components/ConsumerGroupsWrapper/ConsumerGroupsWrapper.jsx
1  src/components/Details/DetailsPromptTemplate/PromptTab.jsx
1  src/components/DetailsAnalysis/DetailsAnalysis.jsx
1  src/components/DetailsCode/DetailsCode.jsx
1  src/components/FeatureSetsPanel/FeatureSetsPanelTitle/FeatureSetsPanelTitle.jsx
1  src/components/FeatureStore/Features/Features.jsx
1  src/components/FunctionsPage/Functions.jsx
1  src/components/FunctionsPageOld/FunctionsOld.jsx
1  src/components/JobWizard/JobWizard.jsx
1  src/components/Jobs/Jobs.jsx
1  src/components/Jobs/ScheduledJobs/ScheduledJobs.jsx
1  src/components/ProjectsJobsMonitoring/ProjectsJobsMonitoring.jsx
1  src/components/ProjectsJobsMonitoring/ScheduledMonitoring/ScheduledMonitoring.jsx
1  src/components/ProjectsJobsMonitoring/WorkflowsMonitoring/WorkflowsMonitoring.jsx
1  src/components/Workflow/Workflow.jsx
1  src/elements/AddToFeatureVectorPopUp/AddToFeatureVectorPopUp.jsx
1  src/elements/ChangeOwnerPopUp/ChangeOwnerPopUp.jsx
1  src/elements/DetailsPopUp/ArtifactPopUp/ArtifactPopUp.jsx
1  src/elements/DetailsPopUp/FeatureSetPopUp/FeatureSetPopUp.jsx
1  src/elements/DetailsPopUp/FeatureVectorPopUp/FeatureVectorPopUp.jsx
1  src/elements/DetailsPopUp/FunctionPopUp/FunctionPopUp.jsx
1  src/elements/DetailsPopUp/JobPopUp/JobPopUp.jsx
1  src/elements/DetailsPopUp/ModelEndpointPopUp/ModelEndpointPopUp.jsx
1  src/elements/EnvironmentVariables/EditableEnvironmentVariablesRow.jsx
1  src/elements/FormDataInputsTable/FormDataInputsRow/FormDataInputsRow.jsx
1  src/elements/FormEnvironmentVariablesTable/FormEnvironmentVariablesRow/FormEnvironmentVariablesRow.jsx
1  src/elements/FormParametersTable/FormParametersRow/FormParametersRow.jsx
1  src/elements/FormVolumesTable/FormVolumesRow/FormVolumesRow.jsx
1  src/elements/FunctionsPanelCode/FunctionsPanelCode.jsx
1  src/elements/FunctionsPanelEnvironmentVariables/FunctionsPanelEnvironmentVariables.jsx
1  src/elements/FunctionsPanelParameters/FunctionsPanelParameters.jsx
1  src/elements/NewFunctionPopUp/NewFunctionPopUp.jsx
1  src/elements/PanelCredentialsAccessKey/PanelCredentialsAccessKey.jsx
1  src/elements/ProjectCard/ProjectCard.jsx
1  src/elements/ProjectJobs/ProjectJobs.jsx
1  src/elements/ProjectSettingsSecrets/ProjectSettingsSecrets.jsx
1  src/elements/VolumesTable/VolumesTable.jsx
1  src/hooks/mode.hook.js
1  src/hooks/nuclioMode.hook.js
1  src/hooks/openPanel.hook.js
1  src/hooks/useFetchData.hook.js
1  src/hooks/useGetTagOptions.hook.js
1  src/hooks/useNuclioEnrichedFunctions.hook.js
1  src/hooks/useRefreshAlerts.hook.js
1  src/layout/Page/Page.jsx
1  src/nextGenComponents/pages/ApplicationsPage/ApplicationDetails/MonitoringEndpoints/EndpointDetailsDialog.jsx
1  src/nextGenComponents/pages/ApplicationsPage/ApplicationsFilters/ApplicationsFilters.jsx
1  src/nextGenComponents/shared/UrlCell/UrlCell.jsx
```

## Appendix B — dependency target versions

| Package                   | From         | To                                     |
| ------------------------- | ------------ | -------------------------------------- |
| react / react-dom         | 18.2         | ^19.2.7 ✅                             |
| react-redux               | 7.2.9        | ^9.3.0 ✅                              |
| @reduxjs/toolkit          | 1.9.5        | ^2.12.0 ✅                             |
| redux                     | 4.2.1        | ^5.0.1 ✅                              |
| redux-thunk               | 2.4.2        | ^3.1.0 ✅                              |
| @testing-library/dom      | (transitive) | ^10.4.1 ✅                             |
| react-final-form          | 6.5.9        | ^7                                     |
| final-form                | 4.20.10      | ^5                                     |
| final-form-arrays         | 3.1.0        | ^4                                     |
| react-final-form-arrays   | 3.1.4        | ^5                                     |
| eslint-plugin-react-hooks | 5            | ^7 ✅                                  |
| reactflow                 | 11.11.1      | keep (peer `react >=17` — React 19 OK) |
| react-router-dom          | 6.30.4       | keep (works on React 19)               |
| react-transition-group    | 4.4.5        | keep (all usages pass `nodeRef`)       |

## Notes / gotchas

- **Do not upgrade to ESLint 10**: `eslint-plugin-react@7.37.5` peers cap at `^9.7`.
- **`reactflow` is not a blocker** (earlier plan over-worried): 11.11.4 allows `react >=17`.
- **react-redux 9 forces redux 5 + RTK 2** (earlier plan assumed RTK 1.9.5 would do — incorrect).
- **`--legacy-peer-deps`** is currently required only because of `react-final-form@6` + `react-text-mask`; after Ticket 2.2 (final-form v7) and the text-mask branch land, re-check whether it can be dropped.
- Hooks violations are **not** React-19 hard blockers (build + tests pass with them), but are fixed before cutover per decision.

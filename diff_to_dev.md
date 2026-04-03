# feature/ig4 vs development — Deep Comparison & Merge Plan
# UPDATED 2026-03-25 (post-rebase on development)
# NOTE: Many bug fixes from feature/ig4 are already in development after the rebase and are no longer listed here.
**62 files changed | +3,238 / -816 lines**

The app in this branch runs as a **Module Federation remote** consumed by the Iguazio Dashboard (IGZ4).
The `development` branch is the **standalone app** for IGZ3.

The user clarified: **MLRun API is unchanged**. Only the **Iguazio platform API** changed for IGZ4.

---

## SECTION 1 — Complete Change Classification

### ✅ Safe to merge as-is (no conditions needed)

| File | What changes | Why safe |
|------|-------------|---------|
| [`.env.production`](#10-builddeploy-infrastructure) | `VITE_FEDERATION=false` default | In IGZ4 Dockerfile, `sed` overwrites to `true` |
| [`.gitignore`](#13-module-federation-build) | Ignore `.__mf__temp/`, `*.tar` | MF build artifacts |
| [`README.md`](#10-builddeploy-infrastructure) | Documents `IS_MF` build arg, MF run modes | Documentation only |
| [`config.json.tmpl`](#10-builddeploy-infrastructure) | Added `nuclioRemoteEntryUrl` field | Additive; empty in IGZ3 |
| [`config/loadDevProxyConfig.js`](#13-module-federation-build) | Dev proxy via DRC file | Only affects dev server |
| [`eslint.config.mjs`](#13-module-federation-build) + [`eslint.mlrun-globals.mjs`](#13-module-federation-build) | ESLint config for MF globals | Tooling only |
| [`package.json`](#13-module-federation-build) + `package-lock.json` | Added `@module-federation/*`, `react-error-boundary`, `dotenv-cli`; `preview:federation` script | Federation plugin only activates when `VITE_FEDERATION=true` |
| [`public/config.json`](#2-config-loading) | `nuclioUiUrl` → `localhost:4000`; added `nuclioRemoteEntryUrl` | Local dev config only |
| [`public/landing.html`](#10-builddeploy-infrastructure) | MF landing page | Only served in IGZ4 nginx |
| [`scripts/previewLocalBuildMF.mjs`](#13-module-federation-build) | MF preview script | Dev tooling |
| [`src/api/jobs-api.js`](#14-bug-fixes) | Stream via axios adapter | Bug fix, works in both |
| [`src/common/Download/Download.jsx`](#14-bug-fixes) | Optional chaining | Defensive, IGZ3-safe |
| [`src/components/Datasets/datasets.util.jsx`](#14-bug-fixes) | `artifact_limits?.max_download_size` | Optional chaining |
| [`src/components/LLMPrompts/llmPrompts.util.jsx`](#14-bug-fixes) | `artifact_limits?.max_download_size` | Optional chaining |
| [`src/components/ProjectsPage/projects.util.jsx`](#14-bug-fixes) | `window.mlrunConfig?.nuclioMode`, `project?.metadata?.name` | Optional chaining |
| [`src/components/RemoteNuclio/NuclioRemoteError.jsx`](#8-nuclio-navigation) | New MF Nuclio error fallback component | Additive, only routed in IGZ4 |
| [`src/components/RemoteNuclio/RemoteNuclio.scss`](#8-nuclio-navigation) | Styles for MF Nuclio wrapper | Additive |
| [`src/components/RemoteNuclio/RemoteNuclioRouteWrapper.jsx`](#8-nuclio-navigation) | New MF Nuclio route wrapper | Additive, only routed in IGZ4 |
| [`src/constants.js`](#2-config-loading) | `FORCE_REFRESH`, `API_TOKEN_TIP` | Additive constants |
| [`src/elements/BreadcrumbsDropdown/breadcrumbsDropdown.scss`](#8-nuclio-navigation) | z-index 7 → 100 | UI fix |
| [`src/hooks/nuclioMode.hook.js`](#14-bug-fixes) | `window?.mlrunConfig` optional chaining | Defensive |
| [`src/index.jsx`](#2-config-loading) | Uses `loadRemoteConfig()` | `loadRemoteConfig()` handles both IGZ3 and IGZ4 |
| [`src/loadRemoteConfig.js`](#2-config-loading) | New file — loads config from host or file | IGZ3 fallback: fetches `config.json` from disk |
| [`src/main.jsx`](#2-config-loading) | MF entry point | Only used when imported as remote |
| [`src/utils/getArtifactPreview.jsx`](#14-bug-fixes) | Optional chaining | Defensive |
| [`src/utils/getJobLogs.util.js`](#14-bug-fixes) | `res.body` → `res.data` | Pairs with jobs-api.js fix |
| [`src/utils/nuclio.remotes.utils.js`](#13-module-federation-build) | MF remote loader utils | Additive |
| [`vite.config.mjs`](#13-module-federation-build) | MF plugin + proxy config refactor; `build.target: 'esnext'` | MF plugin only enabled when `VITE_FEDERATION=true` |

### ⚠️ Needs conditional logic (`VITE_FEDERATION` / `IS_MF`)

| File | What to make conditional | Mechanism |
|------|--------------------------|-----------|
| [`src/httpClient.js`](#1-http-client) | `iguazioHttpClient` baseURL (`/api` vs `/igz/api`) — `attachHostAuth` is safe as-is | `VITE_FEDERATION` build-time env |
| [`src/api/projects-iguazio-api.js`](#3-iguazio-platform-api) | Entire API — IGZ3 endpoints removed, IGZ4 endpoints added | Export based on `VITE_FEDERATION` |
| [`src/elements/MembersPopUp/membersReducer.js`](#4-members-state) | `users`/`userGroups` state removed — needed by IGZ3 `generateMembers()` | Restore for IGZ3 |
| [`src/components/ProjectSettings/ProjectSettings.jsx`](#5-project-settings) | Data-fetch strategy, job polling, owner identity, system-admin check | `VITE_FEDERATION` branch |
| [`src/components/ProjectSettings/projectSettings.util.jsx`](#5-project-settings) | `generateMembers()` and `isProjectMembersTabShown()` — IGZ4 rewrite | `VITE_FEDERATION` branch |
| [`src/elements/MembersPopUp/MembersPopUp.jsx`](#6-members-pop-up) | User search API + response parsing + apply changes | `VITE_FEDERATION` branch |
| [`src/elements/ChangeOwnerPopUp/ChangeOwnerPopUp.jsx`](#11-change-owner-pop-up) | Owner search API + apply changes | `VITE_FEDERATION` branch |
| [`src/utils/projectAuth.util.js`](#12-project-authorization-utility) | IGZ4-only — needs IGZ3 fallback added | `VITE_FEDERATION` branch |
| [`src/components/Workflow/workflow.util.js`](#12-project-authorization-utility) | Calls `checkProjectWriteAccess` (IGZ4-only) — needs IGZ3 two-call fallback in auth util | Add IGZ3 path to `projectAuth.util.js` |
| [`src/App.jsx`](#8-nuclio-navigation) | RemoteNuclio routes (will fail in IGZ3) | Only add when `VITE_FEDERATION=true` |
| [`src/common/Breadcrumbs/breadcrumbs.util.js`](#8-nuclio-navigation) | External vs internal Nuclio links | `VITE_FEDERATION` branch |
| [`src/elements/ProjectFunctions/ProjectFunctions.jsx`](#8-nuclio-navigation) | Nuclio link path `/functions/` → `/real-time-functions/` | `VITE_FEDERATION` branch |
| [`src/layout/Navbar/navbar.util.jsx`](#8-nuclio-navigation) | Nuclio link path `/functions` → `/real-time-functions` | `VITE_FEDERATION` branch |
| [`src/components/Project/project.utils.jsx`](#8-nuclio-navigation) | "Create real-time function" link path + `window.top` navigation | `VITE_FEDERATION` branch |
| [`src/components/Project/ProjectOverview/ProjectOverview.util.jsx`](#8-nuclio-navigation) | Nuclio link paths | `VITE_FEDERATION` branch |
| [`src/components/MonitoringApplicationsPage/MonitoringApplications/monitoringApplications.util.js`](#8-nuclio-navigation) | Nuclio link path `/functions/` → `/real-time-functions/` | `VITE_FEDERATION` branch |
| [`src/utils/createApplicationContent.jsx`](#8-nuclio-navigation) | Nuclio link path `/functions/` → `/real-time-functions/` | `VITE_FEDERATION` branch |
| [`src/utils/createConsumerGroupsContent.js`](#8-nuclio-navigation) | Nuclio link path `/functions/` → `/real-time-functions/` | `VITE_FEDERATION` branch |
| [`src/utils/createRealTimePipelinesContent.js`](#8-nuclio-navigation) | Nuclio link path `/functions/` → `/real-time-functions/` | `VITE_FEDERATION` branch |
| [`src/components/Details/details.util.js`](#8-nuclio-navigation) | Nuclio link path `/functions/` → `/real-time-functions/`; removed `linkIsExternal: true` | `VITE_FEDERATION` branch |
| [`src/utils/parseUri.js`](#8-nuclio-navigation) | `generateNuclioLink()`: removed `?origin` param (needed by IGZ3) + null-safe base URL | Restore `?origin` for IGZ3 |
| [`src/components/JobWizard/JobWizardSteps/JobWizardAdvanced/JobWizardAdvanced.jsx`](#7-job-wizard-access-key--api-token) | Access key UI vs API Token UI | `VITE_FEDERATION` |
| [`src/components/JobWizard/JobWizard.util.js`](#7-job-wizard-access-key--api-token) | `outputPath` fallback; form defaults; request body shape | `VITE_FEDERATION` |
| [`src/components/JobWizard/JobWizard.jsx`](#7-job-wizard-access-key--api-token) | Removed `credentials` from `editJob` dispatch | `VITE_FEDERATION` branch |
| [`src/components/Jobs/jobs.util.js`](#7-job-wizard-access-key--api-token) | Rerun job: removed `credentials`, added `auth.token_name` | `VITE_FEDERATION` branch |
| [`src/reducers/jobReducer.js`](#7-job-wizard-access-key--api-token) | Removed `function.metadata.credentials.access_key` from initial state | Restore for IGZ3 (pairs with JobWizard changes) |
| [`src/components/JobWizard/JobWizardSteps/JobWizardAdvanced/jobWizardAdvanced.scss`](#7-job-wizard-access-key--api-token) | `.access-key-checkbox` → `.api-token-field` styles | Keep both classes or conditioned at build time |
| [`nginx/nginx.conf.tmpl`](#10-builddeploy-infrastructure) | Create `.mf.tmpl` version; restore IGZ3 original | `IS_MF` in `run_nginx` |
| [`nginx/run_nginx`](#10-builddeploy-infrastructure) | envsubst+resolver (IGZ3) vs cp (IGZ4) | `IS_MF` branch |
| [`Dockerfile`](#10-builddeploy-infrastructure) | Restore `COPY config.json.tmpl` for IGZ3 path | `IS_MF` |

### ❓ Needs clarification before deciding

| File | Question |
|------|----------|
| [`Dockerfile`](#10-builddeploy-infrastructure) | Base image `node:20-alpine` → `node:20.19.2-slim` — should it be updated to 22 or 24? Coordinate with DevOps. |
| [`src/common/ActionsMenu/ActionsMenu.jsx`](#spurious) | Empty 0-byte file created — this **overwrites** the existing component. Revert before PR: `git checkout development -- src/common/ActionsMenu/ActionsMenu.jsx` |
| [`src/utils/parseUri.js`](#8-nuclio-navigation) | Does IGZ3's Nuclio UI still require `?origin=...` param? If yes, restore it for the IGZ3 path. |
| Job wizard auth | Does IGZ3's MLRun support `task.spec.auth.token_name`? If yes, the conditional may be simpler. |

---

## SECTION 2 — What changed, why, and how to merge

---

### 1. HTTP Client

**File:** `src/httpClient.js`

#### What changed
Two independent things were changed in the same file:

**A. `iguazioHttpClient` base URL** (one line)
```diff
- baseURL: import.meta.env.MODE === 'production' ? '/api' : '/iguazio/api'
+ baseURL: import.meta.env.MODE === 'production' ? '/igz/api' : '/iguazio/api'
```

**B. `attachHostAuth()` added** (new function, ~50 lines)
```js
export const getHostAuth = () => window.__mlrunHostServices?.auth || window.__igzAuth || null

const attachHostAuth = client => {
  const auth = getHostAuth()
  if (!auth) return   // ← no-op when not in MF host → SAFE in IGZ3

  client.interceptors.request.use(...)   // adds Bearer token
  client.interceptors.response.use(...)  // handles 401 → refresh token → retry
}

// Applied to ALL clients:
attachHostAuth(mainHttpClient)
attachHostAuth(mainHttpClientV2)
attachHostAuth(iguazioHttpClient)
// ...
```

#### Why
- **Base URL**: In IGZ4, nginx doesn't proxy `/api`. The Iguazio backend API is served under `/igz/api` by the host.
- **attachHostAuth**: In IGZ4, auth is token-based (Bearer), provided by the host via `window.__mlrunHostServices.auth`. The host injects this before mounting the remote app.

#### How to merge
- **`attachHostAuth()`** — **SAFE TO MERGE AS-IS**. The `if (!auth) return` guard means it does nothing in IGZ3 where `window.__mlrunHostServices` is not set.
- **Base URL** — **NEEDS CONDITIONAL**:
  ```js
  baseURL: import.meta.env.MODE === 'production'
    ? (import.meta.env.VITE_FEDERATION === 'true' ? '/igz/api' : '/api')
    : '/iguazio/api'
  ```

---

### 2. Config Loading

**Files:** `src/index.jsx`, `src/loadRemoteConfig.js`, `src/constants.js`, `src/main.jsx`, `public/config.json`

#### What changed
`index.jsx` replaced inline `fetch('/config.json')` + protocol normalization with a call to `loadRemoteConfig()`:
```diff
- fetch(`${VITE_PUBLIC_URL}/config.json`)
-   .then(config => { window.mlrunConfig = ...; normalizeProtocol... })
-   .then(() => render(<App/>))
+ loadRemoteConfig().then(() => render(<App/>))
```

`loadRemoteConfig.js` (new file) implements:
1. If host has already injected `window.mlrunConfig` → use it (IGZ4 path)
2. Otherwise → fetch `config.json` from disk (IGZ3 path, same as before)
3. Normalizes `nuclioUiUrl` protocol in both cases
4. Stores host services at `window.__mlrunHostServices`

`main.jsx` (new file) is the MF entry point — exposes the React tree for the host to mount.

`src/constants.js` adds `FORCE_REFRESH` (used by usePagination) and `API_TOKEN_TIP`.

`public/config.json` — local dev config updated:
```diff
- "nuclioUiUrl": "http://localhost:8070"
+ "nuclioUiUrl": "http://localhost:4000",
+ "nuclioRemoteEntryUrl": "http://localhost:5189"
```

#### Why
In IGZ4, the Iguazio Dashboard (host) injects `window.mlrunConfig` before mounting the remote app. The standalone fetch is only a fallback for IGZ3 / local dev. `nuclioUiUrl` changed port because in IGZ4 dev, Nuclio runs at 4000. `nuclioRemoteEntryUrl` is the MF remote entry for loading Nuclio as a federated module.

#### How to merge
**SAFE TO MERGE AS-IS.** `loadRemoteConfig.js` already handles both cases. The fallback to `fetch('/config.json')` preserves IGZ3 behavior exactly. `public/config.json` is only used in local dev — each developer sets their own ports.

---

### 3. Iguazio Platform API

**File:** `src/api/projects-iguazio-api.js`

#### What changed — complete rewrite

| Purpose | IGZ3 endpoint (removed) | IGZ4 endpoint (added) |
|---------|------------------------|----------------------|
| Get project + owner | `GET /projects?filter[name]=X&include=owner` | _(replaced by policies endpoint)_ |
| Get project members | `GET /projects/{id}?include=project_authorization_roles.principal_users,...` | _(replaced by policies endpoint)_ |
| Member + owner visibility | `GET /projects/__name__/{name}/authorization?action=...` | _(removed — policies response contains access info)_ |
| Poll member update job | `GET /jobs/{jobId}` | _(removed — new API is synchronous)_ |
| Update members | `POST /async_transactions` (batch job → async, poll for completion) | `PUT /v1/authorization/projects/{name}/roles` (sync, immediate) |
| Get active user | `GET /self` | `GET /v1/authentication/self?format=full` |
| Search users | `GET /scrubbed_users?filter[username][$match-i]=^.*query.*$` | `GET /v1/profile/search-users-metadata?searchTerm=query` |
| Search groups | `GET /scrubbed_user_groups?filter[name][$match-i]=^.*query.*$` | `GET /v1/profile/search-groups-metadata?searchTerm=query` |
| Get project policies | _(not present)_ | `GET /v1/authorization/projects/{name}/policies` |
| Update owner | `PUT /projects/{id}` (via editProject) | `PUT /v1/authorization/projects/{name}/owner` |

#### Why
IGZ4 has a completely new authorization service (`/v1/authorization/`, `/v1/profile/`, `/v1/authentication/`). The data model also changed:
- **IGZ3**: Members are UUID-based; roles are objects with `principal_users` / `principal_user_groups` UUID arrays; updates are async batch jobs
- **IGZ4**: Members are username-based; roles map to arrays of usernames; updates are synchronous

#### How to merge
Keep both API implementations, switch on `VITE_FEDERATION`:

```js
// src/api/projects-iguazio-api.js
const igz3Api = {
  editProject: ...,
  getProjectJob: ...,
  getProjects: ...,
  getProjectMembers: ...,
  getProjectMembersVisibility: ...,
  getProjectOwnerVisibility: ...,
  getProjectWorkflowsUpdateAuthorization: ...,
  updateProjectMembers: ...,
  getScrubbedUsers: ...,
  getScrubbedUserGroups: ...,
  getActiveUser: () => iguazioHttpClient.get('/self')
}

const igz4Api = {
  updateProjectOwner: ...,
  getProjectPolicies: ...,
  setProjectMembership: ...,
  searchUsersMetadata: ...,
  searchGroupsMetadata: ...,
  getActiveUser: () => iguazioHttpClient.get('/v1/authentication/self', { params: { format: 'full' } })
}

export default import.meta.env.VITE_FEDERATION === 'true' ? igz4Api : igz3Api
```

---

### 4. Members State

**File:** `src/elements/MembersPopUp/membersReducer.js`

#### What changed
```diff
- users: [],        // list of user members from IGZ3 API response
- userGroups: [],   // list of user-group members from IGZ3 API response
+ // (removed — IGZ4 policies endpoint returns everything in one call)
```
Also removed actions: `SET_USERS`, `SET_USER_GROUPS`

#### Why
In IGZ3, members were fetched in two steps: project_authorization_roles + separate user/group lists → stored in `users` / `userGroups`. In IGZ4, `getProjectPolicies()` returns everything at once — no separate user/group arrays needed.

#### How to merge
**Restore both fields for IGZ3 compatibility.** The IGZ3 `generateMembers()` function (called from `fetchProjectMembers()`) dispatches `SET_USERS` and `SET_USER_GROUPS`. Removing these breaks IGZ3 silently.

```js
// Restore in initialMembersState:
users: [],
userGroups: [],

// Restore in membersActions:
SET_USERS: 'SET_USERS',
SET_USER_GROUPS: 'SET_USER_GROUPS'

// Restore reducer cases for SET_USERS, SET_USER_GROUPS
```

Alternatively, keep the IGZ4 version but verify that no IGZ3 code path dispatches or reads these fields.

---

### 5. Project Settings

**Files:** `src/components/ProjectSettings/ProjectSettings.jsx`, `src/components/ProjectSettings/projectSettings.util.jsx`

#### What changed — two files, same underlying concern

**ProjectSettings.jsx — four independent concerns**

**A. Owner identity model**
```diff
// IGZ3: compared by UUID
- return membersState?.activeUser?.data?.id === membersState?.projectInfo?.owner.id

// IGZ4: compared by username
+ const activeUsername = membersState?.activeUser?.data?.attributes?.username
+ const ownerUsername = membersState?.projectInfo?.owner?.username
+ return Boolean(activeUsername && activeUsername === ownerUsername)
```

**B. System Admin check (new for IGZ4)**
```diff
+ const userIsSystemAdmin = useMemo(
+   () => membersState?.activeUser?.data?.attributes?.user_policies_collection?.has('System Admin') ?? false,
+   [...]
+ )
```
In IGZ4, `igz-system-admin` users can change project owners even if they're not the project owner.

**C. Data-fetching strategy replaced**
```diff
// IGZ3: two-step fetch (project + members separately) + job polling
- fetchProjectIdAndOwner()              // GET /projects?include=owner
-   .then(({ id, owner }) => {
-     fetchActiveUser()                 // GET /self
-     fetchProjectMembersVisibility()   // GET /projects/__name__/X/authorization
-     fetchProjectOwnerVisibility()     // GET /projects/__name__/X/authorization
-     fetchProjectMembers(id, owner)    // GET /projects/{id}?include=roles
-   })

// IGZ4: single call
+ fetchActiveUser()                     // GET /v1/authentication/self?format=full
+ fetchProjectPolicies()                // GET /v1/authorization/projects/{name}/policies
```

**D. After member update**
```diff
// IGZ3: async job polling
- changeMembersCallback = (jobId, userIsValid) => {
-   const fetchJob = () => {
-     getProjectJob(jobId).then(response => {
-       if (response.data.data.attributes.state !== COMPLETED_STATE) {
-         setTimeout(fetchJob, 1000)  // poll every second
-       } else {
-         fetchProjectMembers(...)
-       }
-     })
-   }
-   fetchJob()
- }

// IGZ4: immediate refetch
+ changeMembersCallback = (userIsStillMember) => {
+   if (userIsStillMember) {
+     fetchProjectPolicies()
+   } else {
+     navigate('/projects/')
+   }
+ }
```

**projectSettings.util.jsx — `generateMembers()` and `isProjectMembersTabShown()` rewritten**

`generateMembers()` in IGZ3 parsed a JSONAPI response with `included` arrays (roles, users, user_groups keyed by UUID). In IGZ4 it parses a policies response where members are identified by username:

```diff
// IGZ3
- export const generateMembers = (membersResponse, membersDispatch, owner) => {
-   const { project_authorization_role, user, user_group } = groupBy(membersResponse.data.included, ...)
-   // dispatch SET_USERS, SET_USER_GROUPS
-   // match member UUIDs against user/group lists to build display names

// IGZ4
+ export const generateMembers = (policiesResponse, membersDispatch) => {
+   const policies = policiesResponse.data.items || []
+   // dispatch SET_PROJECT_AUTHORIZATION_ROLES with policies
+   // dispatch SET_PROJECT_INFO with owner derived from OWNER_ROLE policy
+   // build members list directly from assignedMembers[].id (username)
```

`isProjectMembersTabShown()` now uses `username` and `user_group_names` Set instead of UUID-based relationships:
```diff
- member.id === activeUser.data?.id ||
- activeUser.data?.relationships?.user_groups?.data?.some?.(group => group.id === member.id)
+ member.id === activeUsername ||
+ activeUser.data?.attributes?.user_group_names?.has(member.id)
```

#### Why
The IGZ4 `/v1/authorization/projects/{name}/policies` endpoint returns all data in one call: active policies, members per role, and owner. No need for separate member/owner visibility checks. Member updates are synchronous (no job polling). The `igz-system-admin` role is a new IGZ4 concept.

#### How to merge
Wrap the two data-fetching strategies and both utility functions in a conditional:

```js
// ProjectSettings.jsx
const fetchProjectUsersData = useCallback(() => {
  if (projectMembershipIsEnabled) {
    if (import.meta.env.VITE_FEDERATION === 'true') {
      // IGZ4 path
      fetchActiveUser()
      fetchProjectPolicies().catch(...)
    } else {
      // IGZ3 path
      fetchProjectOwnerVisibility(params.projectName)
      fetchProjectIdAndOwner()
        .then(({ id, owner }) => {
          fetchActiveUser()
          fetchProjectMembersVisibility(params.projectName)
          return fetchProjectMembers(id, owner)
        })
        .catch(...)
    }
  }
}, [...])
```

```js
// projectSettings.util.jsx
export const generateMembers = (response, membersDispatch, owner) => {
  if (import.meta.env.VITE_FEDERATION === 'true') {
    // IGZ4 path — parse policies response
  } else {
    // IGZ3 path — parse JSONAPI included arrays
  }
}
```

The `userIsSystemAdmin` check and `changeMembersCallback` also need the same branching.

---

### 6. Members Pop-Up

**File:** `src/elements/MembersPopUp/MembersPopUp.jsx`

#### What changed — three independent concerns

**A. User/group search API and response shape**
```diff
// IGZ3
- const getUsersPromise = projectsIguazioApi.getScrubbedUsers({
-   params: { 'filter[username]': '[$match-i]^.*query.*$', 'page[size]': 200 }
- })
// Response: { data: { data: [{ id: 'uuid', type: 'user', attributes: { username, ... } }] } }

// IGZ4
+ const getUsersPromise = projectsIguazioApi.searchUsersMetadata(searchQuery)
// Response: { data: { items: [{ username: 'john', ... }] } }
```

**B. Member identity: UUID → username**
```diff
// IGZ3: id is UUID, label is username
- { id: identity.id, label: identity.attributes.username }   // user
- { id: identity.id, label: identity.attributes.name }        // group

// IGZ4: id IS the username/groupId
+ { id: user.username,  label: user.username }   // user
+ { id: group.groupId,  label: group.path.replace(/^\//, '') ?? group.groupId }  // group
```

**C. Applying member changes: async batch → sync call**
```diff
// IGZ3: complex async_transactions batch
- const changesBody = { data: { attributes: { ... }, requests: modifiedRoles.map(...) } }
- projectsIguazioApi.updateProjectMembers(changesBody)
-   .then(response => {
-     changeMembersCallback(response.data.data.id, validMember || userIsProjectSecurityAdmin)
-   })

// IGZ4: simple sync call
+ projectsIguazioApi.setProjectMembership(projectName, { membership, override: true })
+   .then(() => {
+     const userIsStillMember = membersData.members?.some(member => ...)
+     changeMembersCallback(userIsStillMember)
+   })
```

Also removed: `isIgzVersionCompatible` version check (was switching filter syntax). Removed: `Project Security Admin` bypass for self-removal redirect.

#### Why
New IGZ4 APIs return different shapes. Identity is username-based not UUID-based. Member update is now synchronous and atomic (override replaces entire role membership). `Project Security Admin` no longer exists in IGZ4 auth model.

#### How to merge
Wrap the three concerns in `VITE_FEDERATION` conditionals within `generateUsersSuggestionList()` and `applyMembersChanges()`. The rest of the component (UI rendering, state management) is the same.

---

### 7. Job Wizard: Access Key → API Token

**Files:** `src/components/JobWizard/JobWizardSteps/JobWizardAdvanced/JobWizardAdvanced.jsx`, `src/components/JobWizard/JobWizard.util.js`, `src/components/JobWizard/JobWizard.jsx`, `src/components/Jobs/jobs.util.js`, `src/reducers/jobReducer.js`, `src/components/JobWizard/JobWizardSteps/JobWizardAdvanced/jobWizardAdvanced.scss`

#### What changed

**A. UI in `JobWizardAdvanced.jsx`**
```diff
// IGZ3: checkbox + optional text input
- <FormCheckBox label="Auto-generate access key" name={`${ADVANCED_STEP}.accessKey`} />
- {!formState.values[ADVANCED_STEP].accessKey && (
-   <FormInput name={`${ADVANCED_STEP}.accessKeyInput`} label="Access key" required />
- )}

// IGZ4: single text input (only shown for non-CE)
+ {!frontendSpec.ce?.version && (
+   <FormInput name={`${ADVANCED_STEP}.apiTokenInput`} label="API Token"
+     tip="Get a valid API Token from your API tokens list (under Personal Settings)" required />
+ )}
```

**B. Default form data in `JobWizard.util.js`**
```diff
// IGZ3 defaults
- accessKey: true,
- accessKeyInput: '',
- outputPath: currentProject?.spec?.artifact_path
-   || (frontendSpec.ce?.version && frontendSpec.default_artifact_path)
-   || JOB_DEFAULT_OUTPUT_PATH

// IGZ4 defaults
+ apiTokenInput: 'default',
+ outputPath: currentProject?.spec?.artifact_path || frontendSpec.default_artifact_path
```

**C. Job request body in `JobWizard.util.js`**
```diff
// IGZ3: access key in function metadata
- function: {
-   metadata: {
-     credentials: { access_key: formData.accessKey ? '$generate' : formData.accessKeyInput }
-   }
- }

// IGZ4: token name in task spec
+ task: {
+   spec: {
+     ...(formData.apiTokenInput && { auth: { token_name: formData.apiTokenInput } }),
+     ...
+   }
+ }
```

**D. `JobWizard.jsx` — edit job cleaned up**
```diff
- const credentials = jobRequestData.function?.metadata?.credentials
- delete jobRequestData.function.metadata
  dispatch(editJob({
    postData: {
-     credentials,
      scheduled_object: jobRequestData,
      ...
    }
  }))
```

**E. Rerun job in `Jobs/jobs.util.js`**
```diff
- function: { metadata: { credentials: { access_key: functionData?.metadata?.credentials?.access_key } } }
+ task: { spec: { ...(job.auth?.token_name && { auth: { token_name: job.auth.token_name } }), ... } }
```

**F. `jobReducer.js` — initial state**
```diff
  function: {
-   metadata: {
-     credentials: {
-       access_key: ''
-     }
-   },
    spec: { ... }
  }
```

#### Why
IGZ4 uses named API tokens (stored in the platform) instead of v3io access keys. The job spec field changed from `function.metadata.credentials.access_key` to `task.spec.auth.token_name`.

#### How to merge
The user says MLRun API is the same. The question is: **does IGZ3 MLRun support `task.spec.auth.token_name`?**
- If **yes**: can merge as-is. The `auth.token_name` only appears if the field is filled (`...formData.apiTokenInput && {...}`).
- If **no**: wrap the request body generation in `VITE_FEDERATION`:
  ```js
  function: import.meta.env.VITE_FEDERATION === 'true' ? {} : {
    metadata: { credentials: { access_key: formData.accessKey ? '$generate' : formData.accessKeyInput } }
  },
  task: { spec: {
    ...(import.meta.env.VITE_FEDERATION === 'true' && formData.apiTokenInput
      ? { auth: { token_name: formData.apiTokenInput } }
      : {}),
    ...
  }}
  ```

The `outputPath` change also differs: IGZ3 uses `JOB_DEFAULT_OUTPUT_PATH` as fallback (v3io path), IGZ4 uses `frontendSpec.default_artifact_path`. This is a **breaking change for IGZ3** if `default_artifact_path` is undefined or points to wrong location. Needs conditional:
```js
outputPath: currentProject?.spec?.artifact_path
  || (import.meta.env.VITE_FEDERATION === 'true'
    ? frontendSpec.default_artifact_path
    : (frontendSpec.ce?.version && frontendSpec.default_artifact_path) || JOB_DEFAULT_OUTPUT_PATH)
```

---

### 8. Nuclio Navigation

**Files:** `src/App.jsx`, `src/common/Breadcrumbs/breadcrumbs.util.js`, `src/layout/Navbar/navbar.util.jsx`, `src/utils/parseUri.js`, `src/elements/ProjectFunctions/ProjectFunctions.jsx`, `src/components/Project/project.utils.jsx`, `src/components/Project/ProjectOverview/ProjectOverview.util.jsx`, `src/components/MonitoringApplicationsPage/MonitoringApplications/monitoringApplications.util.js`, `src/utils/createApplicationContent.jsx`, `src/utils/createConsumerGroupsContent.js`, `src/utils/createRealTimePipelinesContent.js`, `src/components/Details/details.util.js`, `src/components/RemoteNuclio/NuclioRemoteError.jsx`, `src/components/RemoteNuclio/RemoteNuclio.scss`, `src/components/RemoteNuclio/RemoteNuclioRouteWrapper.jsx`

#### What changed

**A. `src/App.jsx` — new internal routes for Nuclio**
```diff
+ <Route path="projects/:projectName">
+   <Route index element={<Navigate replace to={PROJECT_MONITOR} />} />
+   <Route path="real-time-functions/*" element={<RemoteNuclioRouteWrapper />} />
+   <Route path="create-function/*" element={<RemoteNuclioRouteWrapper />} />
+   <Route path="api-gateways/*" element={<RemoteNuclioRouteWrapper />} />
+ </Route>
- <Route path="projects/:projectName" element={<Navigate replace to={PROJECT_MONITOR} />} />
```

**B. Nuclio link path: `/functions/` → `/real-time-functions/` (9 files)**

All of the following files changed the same Nuclio link path segment. In IGZ4, the Nuclio MF app is mounted at `/real-time-functions/`. In IGZ3, the external Nuclio UI expects `/functions/`.

| File | What changed |
|------|-------------|
| `src/common/Breadcrumbs/breadcrumbs.util.js` | External links removed; uses internal route id `real-time-functions` instead |
| `src/layout/Navbar/navbar.util.jsx` | `generateNuclioLink('.../functions')` → `generateNuclioLink('.../real-time-functions')` |
| `src/elements/ProjectFunctions/ProjectFunctions.jsx` | Nuclio function link path + name slicing logic |
| `src/components/Project/project.utils.jsx` | "Create real-time function" link path + `window.top` navigation |
| `src/components/Project/ProjectOverview/ProjectOverview.util.jsx` | "Create real-time function" and "Nuclio functions" link paths |
| `src/components/MonitoringApplicationsPage/MonitoringApplications/monitoringApplications.util.js` | Function name link |
| `src/utils/createApplicationContent.jsx` | Application function link |
| `src/utils/createConsumerGroupsContent.js` | Consumer group function link |
| `src/utils/createRealTimePipelinesContent.js` | Pipeline function link |
| `src/components/Details/details.util.js` | Real-time pipeline function link; also removes `linkIsExternal: true` (link becomes internal in IGZ4) |

All 10 need the same pattern (and `details.util.js` also needs `linkIsExternal` restored for IGZ3):
```js
generateNuclioLink(
  `/projects/${projectName}/${import.meta.env.VITE_FEDERATION === 'true' ? 'real-time-functions' : 'functions'}/${name}`
)
```

**C. `src/utils/parseUri.js` — `generateNuclioLink()` simplified**
```diff
// IGZ3: sets `?origin=...` param so Nuclio UI knows where mlrun UI is hosted
- const linkUrl = new URL(`${window.mlrunConfig.nuclioUiUrl}${pathname}`)
- if (window.location.origin !== window.mlrunConfig.nuclioUiUrl) {
-   linkUrl.searchParams.set?.('origin', window.location.origin)
- }

// IGZ4: simple URL construction + null-safe base URL
+ const base = window.mlrunConfig?.nuclioUiUrl || window.location.origin
+ return new URL(`${base}${cleanPath}`).toString()
```

**D. `src/components/Project/project.utils.jsx` — `window.top` navigation**
```diff
// IGZ3: direct window.location.assign
- handler: () => window.location.assign(generateNuclioLink(`/projects/${params.projectName}/create-function`))

// IGZ4: path updated + window.top for MF iframe context
+ handler: () => {
+   const url = generateNuclioLink(`/projects/${params.projectName}/real-time-functions/create-function`)
+   if (window.top && window.top !== window.self) {
+     window.top.location.assign(url)
+   } else {
+     window.location.assign(url)
+   }
+ }
```

#### Why
In IGZ4, Nuclio is loaded as a remote MF app within the same React Router. So "Real-time functions" navigates to an internal route (`/projects/:name/real-time-functions/*`) which loads `RemoteNuclioRouteWrapper`. In IGZ3, they are external links to the standalone Nuclio UI. The `window.top` navigation is needed because the MF app runs inside an iframe provided by the host.

#### How to merge

**App.jsx routes**: These new routes are only useful in IGZ4. In IGZ3, navigating to `real-time-functions/*` would load `RemoteNuclioRouteWrapper` which tries to load the Nuclio MF remote — this will fail. Options:
- Wrap in `VITE_FEDERATION` check
- Or make `RemoteNuclioRouteWrapper` redirect to external Nuclio link when `VITE_FEDERATION !== 'true'`

**Breadcrumbs**: Must restore external links for IGZ3:
```js
import.meta.env.VITE_FEDERATION === 'true'
  ? { label: 'Real-time functions', id: 'real-time-functions' }
  : { label: 'Real-time functions', id: 'Real-time functions',
      link: generateNuclioLink(`/projects/${params.projectName}/functions`) }
```

**All 9 link-path files**: Apply the conditional path pattern shown in section B above.

**`generateNuclioLink()`**: The null-safety fix (`window.mlrunConfig?.nuclioUiUrl`) is safe to keep. Restore `?origin` for IGZ3:
```js
const generateNuclioLink = pathname => {
  const base = window.mlrunConfig?.nuclioUiUrl || window.location.origin
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const linkUrl = new URL(`${base}${cleanPath}`)
  if (import.meta.env.VITE_FEDERATION !== 'true' && window.location.origin !== base) {
    linkUrl.searchParams.set('origin', window.location.origin)
  }
  return linkUrl.toString()
}
```

**`project.utils.jsx`**: The `window.top` fallback is safe as-is in IGZ3 (not in an iframe). The path change still needs the conditional.

---

### 9. Build/Deploy Infrastructure

**Files:** `nginx/nginx.conf.tmpl`, `nginx/run_nginx`, `Dockerfile`, `.env.production`, `config.json.tmpl`, `public/landing.html`, `README.md`

#### `nginx/nginx.conf.tmpl` — complete rewrite
| | IGZ3 (dev branch) | IGZ4 (feature/ig4) |
|---|---|---|
| Proxy rules | `/api`, `/nuclio`, `/function-catalog` with v3io header forwarding | **None** |
| DNS resolver | `include resolvers.conf` | None needed |
| v3io key map | `map $http_x_v3io_session_key ...` | Removed |
| Fallback | `/index.html` | `/landing.html` |
| CORS | None | `Access-Control-Allow-Origin: *` (required for cross-origin JS module loading) |
| Gzip | No | Yes |
| Cache-busting | No | `Cache-Control: no-cache` on `.js`/`.json` |

**Merge plan**: Create `nginx/nginx.conf.mf.tmpl` (IGZ4 content, current file). Restore original content in `nginx/nginx.conf.tmpl` (IGZ3). Select in `run_nginx` via `IS_MF`.

#### `nginx/run_nginx` — complete rewrite
| IGZ3 | IGZ4 |
|------|------|
| `envsubst` with 8 env vars into `nginx.conf.tmpl` | `cp` (no env vars — no proxy config) |
| `envsubst` config vars into `config.json.tmpl` | Removed — no `config.json.tmpl` |
| DNS: `echo resolver $(awk nameserver /etc/resolv.conf) > resolvers.conf` | Removed — no proxy needs DNS |
| `nginx -g 'daemon off;'` | `exec nginx -g 'daemon off;'` |

**Merge plan**: Add `IS_MF` branch:
```sh
if [ "$IS_MF" = "true" ]; then
  cp /etc/nginx/conf.d/nginx.conf.mf.tmpl /etc/nginx/conf.d/nginx.conf
else
  echo resolver $(awk 'BEGIN{ORS=" "} $1=="nameserver" {print $2}' /etc/resolv.conf) ";" > /etc/nginx/resolvers.conf
  envsubst '${MLRUN_API_PROXY_URL} ${MLRUN_V3IO_ACCESS_KEY} ...' \
    < /etc/nginx/conf.d/nginx.conf.tmpl > /etc/nginx/conf.d/nginx.conf
  envsubst '${MLRUN_BETA_MODE} ${MLRUN_NUCLIO_MODE} ${MLRUN_NUCLIO_UI_URL}' \
    < /usr/share/nginx/html/config.json.tmpl > /usr/share/nginx/html/config.json
fi
exec nginx -g 'daemon off;'
```

#### `Dockerfile`
- `IS_MF=false` default already added ✅
- Base image `20-alpine` → `20.19.2-slim`: coordinate with DevOps
- `CMD` simplified (DNS resolver setup moved to `run_nginx`)
- `COPY config.json.tmpl` removed — in IGZ3 it's still needed for runtime config generation

**Merge plan**: `IS_MF=false` default makes the standard build safe. Restore `COPY config.json.tmpl` for IGZ3 path. The DNS resolver trick should remain in `run_nginx` for IGZ3.

#### `.env.production`
```diff
+ VITE_FEDERATION=false
```
**SAFE TO MERGE**. In IGZ4 Dockerfile, the `sed` command overwrites this with `true`.

#### `config.json.tmpl`
```diff
+ "nuclioRemoteEntryUrl": "${MLRUN_NUCLIO_REMOTE_ENTRY_URL}"
```
Additive field. In IGZ3, `MLRUN_NUCLIO_REMOTE_ENTRY_URL` is unset so the value is an empty string — harmless because `loadRemoteConfig.js` only uses it when `nuclioRemoteEntryUrl` is non-empty.

#### `public/landing.html`
New file — the MF build's HTML entry point. When `IS_MF=true`, nginx's fallback route serves `landing.html` instead of `index.html`. The landing page loads the MF remote entry (`remoteEntry.js`) and waits for the host to call `mount()`. Has no effect on the IGZ3 build (nginx still serves `index.html`).

#### `README.md`
Documents the new `IS_MF` Docker build arg, the `MLRUN_IGZ_UI_ALLOWED_ORIGIN` env var (for CORS), and the `npm run preview:federation` command. Documentation only.

---

### 10. Change Owner Pop-Up

**File:** `src/elements/ChangeOwnerPopUp/ChangeOwnerPopUp.jsx`

#### What changed

**A. Apply changes: JSONAPI body → `updateProjectOwner()`**
```diff
// IGZ3: builds full JSONAPI relationship body
- const projectData = {
-   data: { type: 'project', attributes: {},
-     relationships: { owner: { data: { id: newOwnerId, type: USER_ROLE } } }
-   }
- }
- projectsIguazioApi.editProject(projectId, projectData).then(changeOwnerCallback)

// IGZ4: single direct call
+ projectsIguazioApi.updateProjectOwner(projectId, newOwnerId).then(changeOwnerCallback)
```

**B. User search: `getScrubbedUsers` → `searchUsersMetadata`**
```diff
// IGZ3: scrubbed_users endpoint with role filter + version-conditional search syntax
- if (isIgzVersionCompatible(requiredIgzVersion)) {
-   params['filter[username]'] = `[$contains_istr]${memberName}`
- }
- const response = await projectsIguazioApi.getScrubbedUsers({ params })
- formattedUsers = users.map(user => ({
-   name: `${user.attributes.first_name} ${user.attributes.last_name}`,
-   id: user.id,  // UUID
- }))

// IGZ4: search-users-metadata endpoint, flat response
+ const response = await projectsIguazioApi.searchUsersMetadata(memberName)
+ formattedUsers = users.map(user => ({
+   name: `${user.firstName} ${user.lastName}`,
+   id: user.username,  // username as ID
+ }))
```

Removed: `isIgzVersionCompatible` import, `USER_ROLE` import.

#### Why
IGZ4 has a new user search endpoint with a different response shape. Owner updates use a dedicated endpoint. Identity is username-based.

#### How to merge
Wrap both `applyChanges()` and `generateSuggestionList()` in `VITE_FEDERATION` conditionals:

```js
const applyChanges = () => {
  if (newOwnerId) {
    const apiCall = import.meta.env.VITE_FEDERATION === 'true'
      ? projectsIguazioApi.updateProjectOwner(projectId, newOwnerId)
      : projectsIguazioApi.editProject(projectId, { data: { ... } })
    apiCall.then(changeOwnerCallback).catch(...).finally(handleOnClose)
  }
}

const generateSuggestionList = async (memberName, resolve) => {
  if (import.meta.env.VITE_FEDERATION === 'true') {
    const response = await projectsIguazioApi.searchUsersMetadata(memberName)
    formattedUsers = (response.data.items || []).map(user => ({ ..., id: user.username }))
  } else {
    const response = await projectsIguazioApi.getScrubbedUsers({ params: { ... } })
    formattedUsers = response.data.data.map(user => ({ ..., id: user.id }))
  }
}
```

---

### 11. Project Authorization Utility

**Files:** `src/utils/projectAuth.util.js` (new), `src/components/Workflow/workflow.util.js`

#### What changed

**`projectAuth.util.js`** — new utility wrapping the IGZ4 policies endpoint:
```js
// IGZ4 only: checks if the active user has write access to a project
export const checkProjectWriteAccess = async projectName => {
  // calls GET /v1/authorization/projects/{name}/policies
  // returns true if active user is owner, admin, or editor
}
```

**`workflow.util.js`** — replaced two-step IGZ3 permission check with single call:
```diff
// IGZ3: try owner visibility, fall back to workflows update authorization
- await projectsIguazioApi.getProjectOwnerVisibility(projectName)
- // catch → try getProjectWorkflowsUpdateAuthorization(projectName)

// IGZ4: single call via new utility
+ const hasAccess = await checkProjectWriteAccess(projectName)
```

Both `fetchMissingProjectsPermissions()` and `fetchMissingProjectPermission()` were updated.

#### Why
IGZ4's new auth model provides a single policies endpoint that contains all permission information. The old two-endpoint chain (`getProjectOwnerVisibility` + `getProjectWorkflowsUpdateAuthorization`) is gone. The new utility centralizes this logic.

#### How to merge
**Option A** — Add IGZ3 fallback inside `projectAuth.util.js` (preferred — keeps `workflow.util.js` unchanged):
```js
export const checkProjectWriteAccess = async projectName => {
  if (import.meta.env.VITE_FEDERATION === 'true') {
    // IGZ4: GET /v1/authorization/projects/{name}/policies
    const activeUsername = await getActiveUsername()
    const policiesResponse = await projectsIguazioApi.getProjectPolicies(projectName)
    const policies = policiesResponse.data.items || []
    return policies.some(
      policy =>
        WRITE_ROLES.includes(policy.spec.displayName) &&
        policy.status?.assignedMembers?.some(member => member.id === activeUsername)
    )
  } else {
    // IGZ3: try getProjectOwnerVisibility, fall back to getProjectWorkflowsUpdateAuthorization
    return projectsIguazioApi
      .getProjectOwnerVisibility(projectName)
      .then(() => true)
      .catch(() => projectsIguazioApi
        .getProjectWorkflowsUpdateAuthorization(projectName)
        .then(() => true)
        .catch(() => false)
      )
  }
}
```

**Option B** — Branch in `workflow.util.js` directly, keeping `projectAuth.util.js` IGZ4-only.

---

### 12. Module Federation Build

**Files:** `vite.config.mjs`, `config/loadDevProxyConfig.js`, `src/utils/nuclio.remotes.utils.js`, `scripts/previewLocalBuildMF.mjs`, `.gitignore`, `eslint.config.mjs`, `eslint.mlrun-globals.mjs`, `package.json`

#### What changed

**`vite.config.mjs`** — three changes:
1. Added `@module-federation/vite` plugin, conditionally enabled:
   ```js
   const federationPlugin = env.VITE_FEDERATION === 'true'
     ? federation({ filename: 'remoteEntry.js', name: 'mlrun',
         exposes: { './loadRemoteConfig': './src/loadRemoteConfig.js', './app': './src/main.jsx' },
         shared: { react: { singleton: true }, 'react-dom': { singleton: true } }
       })
     : null
   ```
2. Dev proxy config moved to `loadDevProxyConfig.js` (replaces hardcoded proxy object)
3. Added `build.target: 'esnext'` (required for top-level `await` in MF entry points)

**`config/loadDevProxyConfig.js`** — reads proxy configuration from a DRC file, allowing dynamic proxy targets without rebuilding. Falls back to env vars.

**`src/utils/nuclio.remotes.utils.js`** — utilities for loading Nuclio as a Module Federation remote at runtime.

#### Why
Module Federation requires the MF Vite plugin to expose `remoteEntry.js`. The `build.target: 'esnext'` is needed because MF entry points use top-level `await`. Proxy config was externalized to support the DRC tooling used in IGZ4 development.

**`.gitignore`**
```diff
+ .__mf__temp/
+ *.tar
```
MF build outputs a temp directory and optionally a `.tar` archive. Both are build artifacts and should not be committed.

**`eslint.config.mjs`** — four changes: ignores `.__mf__temp/`; adds `.mjs` to linted extensions; imports and spreads `viteGlobals` from `eslint.mlrun-globals.mjs` (so `VITE_FEDERATION` etc. are recognized as globals); adds `sourceType: 'module'` (required for ESM entry points like `main.jsx`).

**`eslint.mlrun-globals.mjs`** — new file, exports `viteGlobals` object declaring all `VITE_*` env vars as ESLint globals (`readonly`). Prevents "undefined variable" lint errors in MF entry points.

**`package.json`**
- Added `@module-federation/runtime` and `@module-federation/vite` — the MF plugin and runtime
- Added `dotenv-cli` — needed by the `preview:federation` script to inject env vars at preview time
- Added `preview:federation` script — builds and serves in MF mode at `localhost:5179`
- `docker` script updated: uses `buildx` and passes `IS_MF` build arg

#### How to merge
**SAFE TO MERGE AS-IS.** The federation plugin is only instantiated when `VITE_FEDERATION=true`. When `false`, `federationPlugin` is `null` and Vite ignores it. The proxy config now comes from `loadDevProxyConfig.js` which falls back to env vars — same behavior as before for IGZ3 dev.

---

### 13. Bug Fixes

The following bug fixes are still present in this branch and safe to merge. Note: the majority of bug fixes from the original feature/ig4 branch (some 20+ files) are already in `development` after the rebase and are not listed here.

| File | Fix |
|------|-----|
| `src/hooks/nuclioMode.hook.js` | Optional chaining on `window?.mlrunConfig` |
| `src/api/jobs-api.js` | Stream via axios adapter instead of fetch |
| `src/utils/getJobLogs.util.js` | `res.body` → `res.data` (pairs with jobs-api.js) |
| `src/components/Datasets/datasets.util.jsx` | Optional chaining `artifact_limits?.max_download_size` |
| `src/components/LLMPrompts/llmPrompts.util.jsx` | Optional chaining `artifact_limits?.max_download_size` |
| `src/components/ProjectsPage/projects.util.jsx` | Optional chaining `window.mlrunConfig?.nuclioMode`, `project?.metadata?.name` |
| `src/common/Download/Download.jsx` | Optional chaining |
| `src/utils/getArtifactPreview.jsx` | Optional chaining |
| `src/elements/BreadcrumbsDropdown/breadcrumbsDropdown.scss` | z-index 7 → 100 (dropdown was hidden behind other elements in MF context) |

### Spurious {#spurious}

| File | Issue |
|------|-------|
| `src/common/ActionsMenu/ActionsMenu.jsx` | Empty 0-byte file was created — overwrites the real component. **Revert before PR**: `git checkout development -- src/common/ActionsMenu/ActionsMenu.jsx` |

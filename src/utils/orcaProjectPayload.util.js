/*
Copyright 2019 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

/*
 * Temporary shim: Orca does not accept MLRun's `{ metadata, spec }` project body. Its endpoints are
 * a gRPC-gateway proxy, so the MLRun body fails with `proto: unknown field "metadata"`. It expects
 * a flat message instead, which is what this module produces.
 *
 * Every MLRun -> Orca payload difference is confined to this file so that, once the leader accepts
 * the MLRun shape, this module can be deleted and `projects-orca-api.js` can pass its payloads
 * straight through.
 *
 * TODO: the flattening below forwards every `spec`/`metadata` key the UI holds, including the
 * MLRun-only settings (artifact path, source, goals, params, node selectors, default image) that
 * the leader has no field for. Whether it ignores or rejects them is a leader-side bug being fixed
 * on the backend; until that lands, Project Settings saves in ORIS mode are unverified. Link the
 * Orca ticket here once it is filed.
 */

import { PROJECT_ARCHIVED_STATE, PROJECT_ONLINE_STATUS } from '../constants'

// 0: creating, 1: online, 2: deleting, 3: archived
const ORCA_DESIRED_STATE_BY_MLRUN_STATE = {
  [PROJECT_ONLINE_STATUS]: 1,
  [PROJECT_ARCHIVED_STATE]: 3
}

const toOrcaProjectFields = (project = {}) => {
  const { metadata = {}, spec = {} } = project

  return {
    ...(spec && { ...spec }),
    ...(metadata && { ...metadata })
  }
}

const readOpId = project => project?.status?.opId ?? project?.status?.op_id

const toOrcaMutationBase = (project = {}) => {
  const prevOpId = readOpId(project)

  return {
    name: project.metadata?.name,
    owner: project.spec?.owner,
    ...(prevOpId && { prevOpId })
  }
}

export const toOrcaCreatePayload = project => toOrcaProjectFields(project)

export const toOrcaUpdatePayload = project => ({
  ...toOrcaMutationBase(project),
  ...toOrcaProjectFields(project)
})

export const toOrcaStatePayload = (state, project) => ({
  ...toOrcaMutationBase(project),
  desiredState: ORCA_DESIRED_STATE_BY_MLRUN_STATE[state]
})

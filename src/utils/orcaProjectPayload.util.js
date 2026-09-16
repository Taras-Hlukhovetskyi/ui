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
 * a gRPC-gateway proxy that rejects unknown fields outright, so sending the MLRun body fails with
 * `proto: unknown field "metadata"`. It expects a flat options message instead.
 *
 * Every MLRun -> Orca payload difference is confined to this file so that, once the leader accepts
 * the MLRun shape, this module can be deleted and `projects-orca-api.js` can pass its payloads
 * straight through.
 *
 * Known gap while this shim is needed: the flat update message only carries name, description,
 * labels, annotations, owner and desiredState, so MLRun-only settings (artifact path, source,
 * goals, params, node selectors, default image) have nowhere to go on the Orca body.
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
    ...(metadata.name && { name: metadata.name }),
    ...(spec.description != null && { description: spec.description }),
    ...(spec.owner && { owner: spec.owner }),
    // Despite the OpenAPI spec describing these as arrays of {key, value} entries, the gateway
    // rejects the array form and takes the same plain key/value map that MLRun uses.
    ...(metadata.labels && { labels: metadata.labels }),
    ...(metadata.annotations && { annotations: metadata.annotations })
  }
}

const readOpId = project => project?.status?.opId ?? project?.status?.op_id

const toOrcaMutationBase = (project = {}) => {
  const prevOpId = readOpId(project)

  return {
    name: project.metadata?.name,
    owner: project.spec?.owner,
    // PUT upserts when the project is absent and ignores prevOpId; omit it rather than send stale.
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

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
 * Reading a project's lifecycle state. Kept apart from `projectOperation.util` - which drives the
 * operations and therefore dispatches - so that the reducer and the components can derive what to
 * show without importing anything that imports the store back.
 */

import { isNil } from 'lodash'

import {
  IS_MF_MODE,
  PROJECT_ARCHIVED_STATE,
  PROJECT_CREATING_STATE,
  PROJECT_DELETING_STATE,
  PROJECT_UPDATING_STATE
} from '../constants'

/** The transition the leader itself reports for a project, ignoring anything started locally. */
export const getReportedTransition = project => {
  if (project?.status?.state === PROJECT_ARCHIVED_STATE) return null

  if ([PROJECT_CREATING_STATE, PROJECT_DELETING_STATE].includes(project?.status?.state)) {
    return project.status.state
  }

  return isNil(project?.status?.phase) ? null : PROJECT_UPDATING_STATE
}

/**
 * Which lifecycle operation a project is currently going through, or `null` when it is settled.
 * A locally started operation (still polling, or waiting on a later list read) takes precedence;
 * otherwise the leader-reported creating/deleting/phase is used.
 */
export const getProjectTransition = (project, projectsInTransition = {}) => {
  if (!IS_MF_MODE) return null

  // Archived is settled, but only as a leader-reported state - an unarchive stays `archived` until
  // the leader finishes it, so a locally recorded operation still has to win here.
  return projectsInTransition[project?.metadata?.name]?.operation ?? getReportedTransition(project)
}

export const isProjectTransitioning = (project, projectsInTransition) =>
  Boolean(getProjectTransition(project, projectsInTransition))

const TRANSITION_WORDING = {
  [PROJECT_CREATING_STATE]: { noun: 'creation', verb: 'creating' },
  [PROJECT_DELETING_STATE]: { noun: 'deletion', verb: 'deleting' },
  [PROJECT_UPDATING_STATE]: { noun: 'update', verb: 'updating' }
}

// TODO (ML-12526, next phase): the third scenario - a system-level sync issue read from
// `GET /api/v1/events/activations?class=Project&severity=major,critical`, worded "Project
// synchronization issues were detected. Contact the system admin." - is not covered here yet.
export const getProjectTransitionTooltip = (transition, hasSyncIssue) => {
  const { noun, verb } =
    TRANSITION_WORDING[transition] ?? TRANSITION_WORDING[PROJECT_UPDATING_STATE]

  return hasSyncIssue
    ? `Issues were detected while ${verb} the project. ` +
        'The system will automatically retry; no manual action is needed.'
    : `The project is in ${noun} process.`
}

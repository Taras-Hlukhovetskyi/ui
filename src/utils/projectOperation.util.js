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
import { isNil } from 'lodash'

import { CONFLICT_ERROR_STATUS_CODE } from 'igz-controls/constants'
import { setNotification } from 'igz-controls/reducers/notificationReducer'
import { showErrorNotification } from 'igz-controls/utils/notification.util'

import orcaProjectsApi from '../api/projects-orca-api'
import {
  removeProject,
  setProjectSyncIssue,
  setProjectTransition
} from '../reducers/projectReducer'
import { pollTask } from './poll.util'
import {
  FAILED_STATE,
  IS_MF_MODE,
  PROJECT_ARCHIVED_STATE,
  PROJECT_CREATING_STATE,
  PROJECT_DELETING_STATE,
  PROJECT_UPDATING_STATE,
  SUCCEEDED_STATE
} from '../constants'

const SYNC_PROJECT_ACTION_TYPE = 'sync-project'
const PROJECTS_SUBDOMAIN = 'projects'
const POLL_DELAY = 2000
const MINUTE = 60 * 1000
const POLL_TIMEOUT_BY_OPERATION = {
  [PROJECT_CREATING_STATE]: 2 * MINUTE,
  [PROJECT_DELETING_STATE]: 15 * MINUTE
}

// ML-12907 documents the execution state as a name, while the OpenAPI spec exposes it as an int
// enum because the endpoint is a gRPC proxy. Accept either form.
const EXECUTION_STATE_BY_CODE = {
  1: 'created',
  2: 'dispatched',
  3: 'running',
  4: SUCCEEDED_STATE,
  5: FAILED_STATE
}

const readOpId = project => project?.status?.opId ?? project?.status?.op_id

// Accepts either an axios response or a bare project body, since the thunks unwrap them differently.
export const getProjectOperationId = payload => readOpId(payload?.data ?? payload)

export const isProjectOperationConflict = error =>
  IS_MF_MODE && error?.response?.status === CONFLICT_ERROR_STATUS_CODE

/**
 * Which lifecycle operation a project is currently going through, or `null` when it is settled.
 * A locally started operation takes precedence: the leader only reports the project as
 * transitional once it has processed the request, so until then the client's own record is the
 * only evidence there is.
 */
export const getProjectTransition = (project, projectsInTransition = {}) => {
  // Archived is a settled state on its own tab; a leftover phase or local update flag must not
  // keep the card dimmed.
  if (project?.status?.state === PROJECT_ARCHIVED_STATE) return null

  const startedLocally = projectsInTransition[project?.metadata?.name]

  if (startedLocally) return startedLocally

  if ([PROJECT_CREATING_STATE, PROJECT_DELETING_STATE].includes(project?.status?.state)) {
    return project.status.state
  }

  return isNil(project?.status?.phase) ? null : PROJECT_UPDATING_STATE
}

export const isProjectTransitioning = (project, projectsInTransition) =>
  IS_MF_MODE && Boolean(getProjectTransition(project, projectsInTransition))

const TRANSITION_WORDING = {
  [PROJECT_CREATING_STATE]: { noun: 'creation', verb: 'creating' },
  [PROJECT_DELETING_STATE]: { noun: 'deletion', verb: 'deleting' },
  [PROJECT_UPDATING_STATE]: { noun: 'update', verb: 'updating' }
}

export const getProjectTransitionTooltip = (transition, hasSyncIssue) => {
  const { noun, verb } =
    TRANSITION_WORDING[transition] ?? TRANSITION_WORDING[PROJECT_UPDATING_STATE]

  return hasSyncIssue
    ? `Issues were detected while ${verb} the project. ` +
        'The system will automatically retry; no manual action is needed.'
    : `The project is in ${noun} process.`
}

/**
 * Records that a lifecycle operation has been requested for a project, so its card can be shown as
 * transitional from the moment the request leaves the client rather than only once a later read of
 * the leader reflects it.
 */
export const startProjectTransition = (dispatch, projectName, operation) => {
  if (IS_MF_MODE) {
    dispatch(setProjectTransition({ projectName, operation }))
  }
}

/** Releases the project back to its normal look, whether the operation completed or never began. */
export const endProjectTransition = (dispatch, projectName) => {
  if (IS_MF_MODE) {
    dispatch(setProjectTransition({ projectName, operation: null }))
  }
}

const readExecutionStatus = response => response?.data?.items?.[0]?.status

const getExecutionState = status => {
  const state = status?.state

  return typeof state === 'number' ? EXECUTION_STATE_BY_CODE[state] : state
}

// Previous attempts left a lastError or a non-empty attempts list, but the execution is still
// running: the driver is retrying. That is the issues tooltip, not a terminal outcome.
const executionHasRetrySignal = status =>
  Boolean(status?.lastError) || Boolean(status?.attempts?.length)

/**
 * Polls the trackable-action execution that carries out a project operation until it reaches a
 * terminal state. The driver dispatches a single `sync-project` action per operation using the
 * operation's id as the correlation id, so the execution state is an exact signal:
 * succeeded → done, failed → stop with an error, anything else (including an empty list) → poll.
 * @param {string} opId - the operation id taken from `status.opId` of the mutation's 202 response.
 * @param {Object} options
 * @param {string} options.projectName
 * @param {function} options.dispatch
 * @param {string} [options.successMessage] - notification shown once the execution succeeds.
 * @param {string} [options.failureMessage] - fallback notification when the execution fails.
 * @param {function} [options.onSettled] - invoked with the terminal state.
 * @param {boolean} [options.removeProjectOnSuccess] - drop the project from the list before undimming,
 *   so a deleted card cannot flash as online while the list refresh is still in flight.
 * @param {string} [options.operation] - lifecycle operation; selects the poll timeout
 *   (2 minutes for create, 15 minutes for delete).
 * @param {function} [options.onProgress] - invoked after each poll that found the operation still running.
 * @param {Object} [options.terminatePollRef] - ref that receives a terminate function.
 * @returns {Promise} resolved with the last polling cycle's result.
 */
export const trackProjectOperation = (
  opId,
  {
    projectName,
    dispatch,
    successMessage,
    failureMessage,
    onSettled,
    removeProjectOnSuccess,
    operation,
    onProgress,
    terminatePollRef
  }
) => {
  const deadline =
    Date.now() +
    (POLL_TIMEOUT_BY_OPERATION[operation] ?? POLL_TIMEOUT_BY_OPERATION[PROJECT_CREATING_STATE])
  let reportedIssue = false

  const markIssue = () => {
    if (reportedIssue) return

    reportedIssue = true
    dispatch(setProjectSyncIssue({ projectName, hasSyncIssue: true }))
  }

  const settle = (state, response) => {
    if (state === SUCCEEDED_STATE && removeProjectOnSuccess) {
      dispatch(removeProject(projectName))
    }

    endProjectTransition(dispatch, projectName)

    if (state === SUCCEEDED_STATE) {
      if (successMessage) {
        dispatch(setNotification({ status: 200, id: Math.random(), message: successMessage }))
      }
    } else {
      const lastError = response?.data?.items?.[0]?.status?.lastError

      showErrorNotification(dispatch, {}, '', lastError || failureMessage)
    }

    onSettled?.(state)
  }

  const isDone = response => {
    const status = readExecutionStatus(response)
    const state = getExecutionState(status)

    if ([SUCCEEDED_STATE, FAILED_STATE].includes(state)) {
      settle(state, response)

      return true
    }

    // created / dispatched / running, or an empty list (dispatch not yet visible). lastError or
    // attempts[] (and the operation-specific window) only switch the tooltip; polling continues.
    if (executionHasRetrySignal(status) || Date.now() >= deadline) {
      markIssue()
    }

    onProgress?.()

    return false
  }

  return pollTask(
    () =>
      orcaProjectsApi.getActionExecutions({
        correlationId: opId,
        actionType: SYNC_PROJECT_ACTION_TYPE,
        subdomain: PROJECTS_SUBDOMAIN,
        limit: 1
      }),
    isDone,
    { delay: POLL_DELAY, terminatePollRef }
  )
}

/**
 * Starts tracking a project mutation when the leader answered with an operation to follow. Returns
 * `false` when there is nothing to track — in ORIS the mutation is asynchronous and carries an
 * `opId`, while MLRun answers synchronously — so callers can keep their existing behaviour.
 * @param {Object} payload - the mutation's axios response or project body.
 * @param {Object} options - see `trackProjectOperation`.
 * @returns {boolean} whether an operation is being tracked.
 */
export const trackProjectMutation = (payload, options) => {
  if (!IS_MF_MODE) return false

  const opId = getProjectOperationId(payload)

  if (!opId) {
    // There is no operation to follow, so the card must not be left in its transitional look.
    endProjectTransition(options.dispatch, options.projectName)

    return false
  }

  // Giving up on the execution endpoint says nothing about the operation, which keeps converging on
  // its own, so the next list refresh is left to report the outcome.
  trackProjectOperation(opId, options).catch(() => {})

  return true
}

const trackedOperationIds = new Set()

const SUCCESS_MESSAGE_BY_STATE = {
  [PROJECT_CREATING_STATE]: name => `Project "${name}" was created successfully`,
  [PROJECT_DELETING_STATE]: name => `Project "${name}" was deleted successfully`
}

const FAILURE_MESSAGE_BY_STATE = {
  [PROJECT_CREATING_STATE]: name => `Failed to create the project "${name}"`,
  [PROJECT_DELETING_STATE]: name => `Failed to delete the project "${name}"`
}

/**
 * Starts execution polling for creating/deleting projects this client did not start (page reload,
 * another client, opening a project URL). Projects already in `projectsInTransition` are skipped.
 * Without an opId there is nothing to follow until a later list read carries one.
 */
export const trackUntrackedProjectOperations = (
  projects = [],
  projectsInTransition = {},
  dispatch,
  onSettled
) => {
  if (!IS_MF_MODE) return

  projects.forEach(project => {
    const projectName = project?.metadata?.name
    const operation = project?.status?.state

    if (
      project?.status?.createdOnUI ||
      !projectName ||
      projectName in projectsInTransition ||
      ![PROJECT_CREATING_STATE, PROJECT_DELETING_STATE].includes(operation)
    ) {
      return
    }

    const opId = getProjectOperationId(project)

    if (!opId || trackedOperationIds.has(opId)) return

    trackedOperationIds.add(opId)
    startProjectTransition(dispatch, projectName, operation)

    trackProjectOperation(opId, {
      projectName,
      dispatch,
      successMessage: SUCCESS_MESSAGE_BY_STATE[operation](projectName),
      failureMessage: FAILURE_MESSAGE_BY_STATE[operation](projectName),
      removeProjectOnSuccess: operation === PROJECT_DELETING_STATE,
      operation,
      onSettled: state => {
        trackedOperationIds.delete(opId)
        onSettled?.(state)
      }
    }).catch(() => {
      trackedOperationIds.delete(opId)
    })
  })
}

export const withLatestOpId = (project, latest) => ({
  ...project,
  status: {
    ...project?.status,
    opId: getProjectOperationId(latest)
  }
})

/**
 * Handles the compare-and-swap rejection the leader returns when another mutation raced ahead of
 * this one. Re-reads the project for a fresh opId, then lets the user retry.
 * @returns {boolean} whether the error was a conflict and has been reported.
 */
export const handleProjectOperationConflict = (error, projectName, dispatch, retry) => {
  if (!isProjectOperationConflict(error)) return false

  showErrorNotification(
    dispatch,
    error,
    '',
    `The project "${projectName}" was modified by another operation. Please review the latest state and retry.`,
    retry
      ? () =>
          orcaProjectsApi
            .getProject(projectName)
            .then(latest => retry(latest))
            .catch(readError =>
              showErrorNotification(
                dispatch,
                readError,
                '',
                `Failed to reload the project "${projectName}"`
              )
            )
      : undefined
  )

  return true
}

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
import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

import LogSection from './LogSection'
import { fetchFunctionLogs, fetchFunctionNuclioLogs } from '../../../../../reducers/functionReducer'
import { showErrorNotification } from 'igz-controls/utils/notification.util'
import {
  BUILD_LOGS_POLLING_INTERVAL_MS,
  COPY_RESET_TIMEOUT_MS,
  FUNCTION_STATUS_HEADER,
  LOGS_SECTION_KEY,
  TRANSIENT_FUNCTION_STATUSES
} from '../applicationDetails.constants'

/**
 * Extracts function deploy logs from the API response.
 * Handles all known response shapes:
 *   - { status: { logs: LogEntry[] } }  — standard Nuclio deploy status
 *   - { logs: LogEntry[] }              — short-form
 *   - LogEntry[]                        — bare array
 *   - string                            — pre-formatted text
 */
const extractFunctionLogs = data => {
  if (Array.isArray(data?.status?.logs)) return data.status.logs
  if (Array.isArray(data?.logs)) return data.logs
  if (Array.isArray(data)) return data
  if (typeof data === 'string' && data.trim().length > 0) return data

  return null
}

const isFunctionTransient = response =>
  TRANSIENT_FUNCTION_STATUSES.includes(response.headers?.[FUNCTION_STATUS_HEADER])

const formatFunctionLogsForClipboard = logs => {
  if (Array.isArray(logs)) {
    return logs
      .map(
        log => `[${new Date(log.time).toISOString()}] ${log.level?.toUpperCase()} ${log.message}`
      )
      .join('\n')
  }

  return logs ?? ''
}

const ApplicationBuildLogs = ({ application }) => {
  const dispatch = useDispatch()
  const { projectName } = useParams()

  const [applicationLogs, setApplicationLogs] = useState('')
  const [functionLogs, setFunctionLogs] = useState(null)
  const [copiedSection, setCopiedSection] = useState(null)
  const [isAppLogsLoading, setIsAppLogsLoading] = useState(true)
  const [isFunctionLogsLoading, setIsFunctionLogsLoading] = useState(true)

  const appLogsPollingRef = useRef(null)
  const functionLogsPollingRef = useRef(null)
  const copyResetRef = useRef(null)

  const clearPolling = useCallback(pollingRef => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const fetchAppLogs = useCallback(() => {
    dispatch(
      fetchFunctionLogs({ project: projectName, name: application.name, tag: application.tag })
    )
      .unwrap()
      .then(response => {
        setApplicationLogs(response.data || '')
        const isTransient = isFunctionTransient(response)
        setIsAppLogsLoading(isTransient)

        if (isTransient) {
          clearPolling(appLogsPollingRef)
          appLogsPollingRef.current = setTimeout(fetchAppLogs, BUILD_LOGS_POLLING_INTERVAL_MS)
        }
      })
      .catch(error => {
        setIsAppLogsLoading(false)
        showErrorNotification(dispatch, error, 'Application logs failed to load')
      })
  }, [application.name, application.tag, clearPolling, dispatch, projectName])

  const fetchFunctionDeployLogs = useCallback(() => {
    dispatch(
      fetchFunctionNuclioLogs({
        project: projectName,
        name: application.name,
        tag: application.tag
      })
    )
      .unwrap()
      .then(response => {
        setFunctionLogs(extractFunctionLogs(response.data))
        const isTransient = isFunctionTransient(response)
        setIsFunctionLogsLoading(isTransient)

        if (isTransient) {
          clearPolling(functionLogsPollingRef)
          functionLogsPollingRef.current = setTimeout(
            fetchFunctionDeployLogs,
            BUILD_LOGS_POLLING_INTERVAL_MS
          )
        }
      })
      .catch(error => {
        setIsFunctionLogsLoading(false)
        showErrorNotification(dispatch, error, 'Function logs failed to load')
      })
  }, [application.name, application.tag, clearPolling, dispatch, projectName])

  useEffect(() => {
    fetchAppLogs()
    fetchFunctionDeployLogs()

    return () => {
      clearPolling(appLogsPollingRef)
      clearPolling(functionLogsPollingRef)
    }
  }, [fetchAppLogs, fetchFunctionDeployLogs, clearPolling])

  const handleCopy = useCallback((text, sectionKey) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionKey)
    clearTimeout(copyResetRef.current)
    copyResetRef.current = setTimeout(() => setCopiedSection(null), COPY_RESET_TIMEOUT_MS)
  }, [])

  const handleCopyAppLogs = useCallback(
    () => handleCopy(applicationLogs, LOGS_SECTION_KEY.APPLICATION),
    [applicationLogs, handleCopy]
  )

  const handleCopyFunctionLogs = useCallback(
    () => handleCopy(formatFunctionLogsForClipboard(functionLogs), LOGS_SECTION_KEY.FUNCTION),
    [functionLogs, handleCopy]
  )

  return (
    <div className="flex flex-col gap-6 py-4" data-testid="application-build-logs">
      <LogSection
        title="Application"
        logs={applicationLogs}
        isLoading={isAppLogsLoading}
        isCopied={copiedSection === LOGS_SECTION_KEY.APPLICATION}
        onCopy={handleCopyAppLogs}
      />
      <LogSection
        title="Function"
        logs={functionLogs}
        isLoading={isFunctionLogsLoading}
        isCopied={copiedSection === LOGS_SECTION_KEY.FUNCTION}
        onCopy={handleCopyFunctionLogs}
      />
    </div>
  )
}

ApplicationBuildLogs.propTypes = {
  application: PropTypes.shape({
    name: PropTypes.string.isRequired,
    tag: PropTypes.string
  }).isRequired
}

export default ApplicationBuildLogs

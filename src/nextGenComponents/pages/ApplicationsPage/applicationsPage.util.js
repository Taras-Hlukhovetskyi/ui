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
import { debounce, isEqual } from 'lodash'

import { datePickerPastOptions } from '../../../utils/datePicker.util'
import { parseIdentifier } from '../../../utils/parseUri'
import { parseFunction } from '../../../utils/parseFunction'
import { showErrorNotification } from 'igz-controls/utils/notification.util'
import { fetchFunction } from '../../../reducers/functionReducer'
import { BE_PAGE, FE_PAGE, APPLICATIONS_PAGE_PATH, FUNCTIONS_PAGE } from '../../../constants'
import getState from '../../../utils/getState'
import {
  APPLICATION_STATUS,
  FAILED_API_STATES,
  FILTER_ALL_APPLICATIONS_STATUS,
  TIME_FILTER_CUSTOM_VALUE
} from './applications.constants'

export const getSinceDate = timeValue => {
  const option = datePickerPastOptions.find(o => o.id === timeValue)
  if (!option?.isPredefined || !option.handler) return undefined
  const [since] = option.handler()
  return since?.toISOString()
}

export const buildApiFilters = filters => {
  const apiFilters = {}

  if (filters.name) {
    apiFilters.name = `~${filters.name}`
  }

  if (filters.time === TIME_FILTER_CUSTOM_VALUE) {
    if (filters.customSince) {
      apiFilters.since = filters.customSince
    }
  } else {
    const since = getSinceDate(filters.time)
    if (since) {
      apiFilters.since = since
    }
  }

  const activeStatuses = Array.isArray(filters.status)
    ? filters.status.filter(s => s !== FILTER_ALL_APPLICATIONS_STATUS)
    : []

  if (activeStatuses.length > 0) {
    apiFilters.state = activeStatuses.flatMap(uiStatus => {
      if (uiStatus === APPLICATION_STATUS.RUNNING) return [APPLICATION_STATUS.READY]
      if (uiStatus === APPLICATION_STATUS.FAILED) return FAILED_API_STATES
      return [uiStatus]
    })
  }

  return apiFilters
}

export const filterApplications = (applications, { status }) => {
  const selectedStatuses = Array.isArray(status)
    ? status.filter(s => s !== FILTER_ALL_APPLICATIONS_STATUS)
    : []

  return applications.filter(app => {
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(app.state?.value)) {
      return false
    }
    return true
  })
}

const DEBOUNCE_DELAY_MS = 30

const fetchAndParseApplication = (dispatch, projectName, applicationName, hash, tag) => {
  return dispatch(fetchFunction({ project: projectName, name: applicationName, hash, tag }))
    .unwrap()
    .then(rawFunc => {
      if (!rawFunc) return null

      const application = parseFunction(rawFunc, projectName)
      const apiState = rawFunc.status?.state
      const normalizedState =
        apiState === APPLICATION_STATUS.READY ? APPLICATION_STATUS.RUNNING : apiState

      return {
        ...application,
        state: getState(normalizedState, FUNCTIONS_PAGE, 'nuclioFunctions')
      }
    })
}

export const checkForSelectedApplication = debounce(
  ({
    applicationName,
    applicationId,
    applications,
    paginatedApplications,
    paginationConfigRef,
    searchParams,
    setSearchParams,
    navigate,
    projectName,
    setSelectedApplication,
    dispatch,
    lastCheckedApplicationIdRef
  }) => {
    if (applicationId) {
      const searchBePage = parseInt(searchParams.get(BE_PAGE))
      const configBePage = paginationConfigRef.current[BE_PAGE]

      if (
        applications &&
        searchBePage === configBePage &&
        lastCheckedApplicationIdRef.current !== applicationId
      ) {
        const { tag, uid: hash } = parseIdentifier(applicationId)
        lastCheckedApplicationIdRef.current = applicationId

        fetchAndParseApplication(dispatch, projectName, applicationName, hash, tag)
          .then(selectedApplication => {
            if (!selectedApplication) {
              navigate(
                `/projects/${projectName}/${APPLICATIONS_PAGE_PATH}${window.location.search}`,
                { replace: true }
              )
            } else {
              const findApplicationIndex = list =>
                list.findIndex(app => {
                  const appData = app.data ?? app
                  return tag
                    ? isEqual(appData.tag, tag) && isEqual(appData.name, applicationName)
                    : isEqual(appData.hash, hash) && isEqual(appData.name, applicationName)
                })

              const indexInPaginatedList = findApplicationIndex(paginatedApplications)
              const indexInMainList =
                indexInPaginatedList !== -1 ? indexInPaginatedList : findApplicationIndex(applications)

              if (indexInPaginatedList === -1 && indexInMainList > -1) {
                const { fePageSize } = paginationConfigRef.current

                setSearchParams(prevSearchParams => {
                  prevSearchParams.set(FE_PAGE, Math.ceil((indexInMainList + 1) / fePageSize))
                  return prevSearchParams
                })
              }

              setSelectedApplication(prevState =>
                isEqual(prevState, selectedApplication) ? prevState : selectedApplication
              )
            }
          })
          .catch(error => {
            setSelectedApplication({})
            navigate(
              `/projects/${projectName}/${APPLICATIONS_PAGE_PATH}${window.location.search}`,
              { replace: true }
            )
            showErrorNotification(dispatch, error, '', 'Failed to retrieve application data')
          })
      }
    } else {
      setSelectedApplication({})
    }
  },
  DEBOUNCE_DELAY_MS
)

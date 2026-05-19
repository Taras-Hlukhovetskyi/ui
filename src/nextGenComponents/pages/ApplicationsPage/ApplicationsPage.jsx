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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { isEmpty, isEqual } from 'lodash'
import { Loader, TooltipProvider } from 'igz-controls/nextGenComponents'

import Breadcrumbs from '../../../common/Breadcrumbs/Breadcrumbs'
import ApplicationCounters from './ApplicationCounters/ApplicationCounters'
import ApplicationsFilters from './ApplicationsFilters/ApplicationsFilters'
import ActionBar from '../../shared/ActionBar/ActionBar'

import { useFiltersFromSearchParams } from '../../../hooks/useFiltersFromSearchParams.hook'
import { usePagination } from '../../../hooks/usePagination.hook'
import { fetchFunctions } from '../../../reducers/functionReducer'
import { parseFunction } from '../../../utils/parseFunction'
import getState from '../../../utils/getState'
import { BE_PAGE, BE_PAGE_SIZE, FUNCTIONS_PAGE } from '../../../constants'
import { APPLICATIONS_FILTERS_CONFIG, APPLICATION_STATUS } from './applications.constants'
import {
  buildApiFilters,
  filterApplications,
  parseApplicationsQueryParams
} from './applicationsPage.util'

const ApplicationsPage = () => {
  const params = useParams()
  const dispatch = useDispatch()
  const { functions, loading } = useSelector(store => store.functionsStore)
  const paginationConfigRef = useRef({})
  const [isDetailsReady, setIsDetailsReady] = useState(false)

  const urlFilters = useFiltersFromSearchParams(
    APPLICATIONS_FILTERS_CONFIG,
    parseApplicationsQueryParams
  )
  const [filters, setFilters] = useState(urlFilters)

  useEffect(() => {
    setFilters(prevFilters => (isEqual(prevFilters, urlFilters) ? prevFilters : urlFilters))
  }, [urlFilters])

  const applications = useMemo(
    () =>
      functions.map(rawFunc => {
        const application = parseFunction(rawFunc, params.projectName)
        const apiState = rawFunc.status?.state
        const normalizedState =
          apiState === APPLICATION_STATUS.READY ? APPLICATION_STATUS.RUNNING : apiState
        return {
          ...application,
          state: getState(normalizedState, FUNCTIONS_PAGE, 'nuclioFunctions')
        }
      }),
    [functions, params.projectName]
  )

  const handleRefresh = useCallback(
    currentFilters => {
      const apiFilters = buildApiFilters(currentFilters)
      const requestParams = { ...apiFilters, kind: 'application', tag: '*' }

      if (!isEmpty(paginationConfigRef.current)) {
        requestParams.page = paginationConfigRef.current[BE_PAGE]
        requestParams['page-size'] = paginationConfigRef.current[BE_PAGE_SIZE]
      }

      return dispatch(
        fetchFunctions({
          project: params.projectName,
          filters: {},
          config: { params: requestParams }
        })
      )
        .unwrap()
        .then(data => {
          paginationConfigRef.current.paginationResponse = data?.pagination ?? null
        })
    },
    [dispatch, params.projectName]
  )

  const filteredApplications = useMemo(
    () => filterApplications(applications, filters),
    [applications, filters]
  )

  const [handlePaginatedRefresh, paginatedApplications, searchParams, setSearchParams] =
    usePagination({
      content: filteredApplications,
      refreshContent: handleRefresh,
      filters,
      paginationConfigRef,
      resetPaginationTrigger: params.projectName
    })

  return (
    <div
      className="mlrun-tw-scope h-screen overflow-hidden bg-background flex flex-col w-full"
      data-testid="applications-page"
    >
      <TooltipProvider>
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <Breadcrumbs />
          </div>

          {!isDetailsReady && (
            <div className="px-6 shrink-0">
              <ActionBar
                filtersConfig={APPLICATIONS_FILTERS_CONFIG}
                filters={filters}
                setFilters={setFilters}
                onRefresh={handlePaginatedRefresh}
              >
                {({ filters: activeFilters, applyFilter }) => (
                  <ApplicationsFilters filters={activeFilters} applyFilter={applyFilter} />
                )}
              </ActionBar>
            </div>
          )}

          <div
            className={
              isDetailsReady
                ? 'flex flex-col flex-1 overflow-hidden'
                : 'flex flex-col flex-1 overflow-hidden px-6 pb-6 pt-0'
            }
          >
            {!isDetailsReady && <ApplicationCounters />}
            <div
              className={
                isDetailsReady
                  ? 'flex flex-col flex-1 overflow-hidden'
                  : 'flex flex-col flex-1 overflow-hidden mt-4 p-[20px] text-igz-secondary bg-background border rounded-lg shadow-card'
              }
            >
              {loading && !isDetailsReady ? (
                <Loader mode="fullscreen" />
              ) : (
                <Outlet
                  context={{
                    applications: filteredApplications,
                    filters,
                    filtersConfig: APPLICATIONS_FILTERS_CONFIG,
                    paginatedApplications,
                    paginationConfigRef,
                    searchParams,
                    setSearchParams,
                    setIsDetailsReady
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}

export default ApplicationsPage

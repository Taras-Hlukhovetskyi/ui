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
import { useCallback, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Loader, TooltipProvider } from 'igz-controls/nextGenComponents'

import Breadcrumbs from '../../../common/Breadcrumbs/Breadcrumbs'
import ApplicationCounters from './ApplicationCounters/ApplicationCounters'
import ApplicationsFilters from './ApplicationsFilters/ApplicationsFilters'
import ActionBar from '../../shared/ActionBar/ActionBar'

import { useFiltersFromSearchParams } from '../../../hooks/useFiltersFromSearchParams.hook'
import { useNuclioEnrichedFunctions } from '../../../hooks/useNuclioEnrichedFunctions.hook'
import {
  APPLICATION_KIND,
  APPLICATIONS_ERROR_MESSAGE,
  APPLICATIONS_FILTERS_CONFIG,
  TAG_WILDCARD
} from './applications.constants'
import {
  buildApiFilters,
  filterApplications,
  parseApplicationsQueryParams
} from './applicationsPage.util'

const ApplicationsPage = () => {
  const params = useParams()
  const [isDetailsReady, setIsDetailsReady] = useState(false)

  const filters = useFiltersFromSearchParams(
    APPLICATIONS_FILTERS_CONFIG,
    parseApplicationsQueryParams
  )

  const buildFetchConfig = useCallback(currentFilters => {
    const apiFilters = buildApiFilters(currentFilters)
    return {
      filters: {},
      config: { params: { ...apiFilters, kind: APPLICATION_KIND, tag: TAG_WILDCARD } }
    }
  }, [])

  const {
    fetchData,
    fetchSingleEnrichedFunction,
    filteredData: filteredApplications,
    counters,
    isLoading
  } = useNuclioEnrichedFunctions({
    projectName: params.projectName,
    filters,
    filterFn: filterApplications,
    buildFetchConfig,
    errorMessage: APPLICATIONS_ERROR_MESSAGE
  })

  const handleRefresh = useCallback(
    currentFilters => fetchData(buildFetchConfig(currentFilters)),
    [fetchData, buildFetchConfig]
  )

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
                onRefresh={handleRefresh}
              >
                {({ filters: activeFilters, applyFilter, applyMultipleFilters }) => (
                  <ApplicationsFilters
                    filters={activeFilters}
                    applyFilter={applyFilter}
                    applyMultipleFilters={applyMultipleFilters}
                  />
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
            {!isDetailsReady && (
              <ApplicationCounters counters={counters} isLoading={isLoading} />
            )}
            <div
              className={
                isDetailsReady
                  ? 'flex flex-col flex-1 overflow-hidden'
                  : 'flex flex-col flex-1 overflow-hidden mt-4 p-[20px] text-igz-secondary bg-background border rounded-lg shadow-card'
              }
            >
              {isLoading && !isDetailsReady ? (
                <Loader mode="fullscreen" />
              ) : (
                <Outlet
                  context={{
                    applications: filteredApplications,
                    filters,
                    filtersConfig: APPLICATIONS_FILTERS_CONFIG,
                    fetchSingleEnrichedFunction,
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

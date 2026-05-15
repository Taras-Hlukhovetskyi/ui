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
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { isEmpty } from 'lodash'
import { Input, TooltipProvider, TimeFilterDropdown, FilterPopover } from 'igz-controls/nextGenComponents'
import { Loader } from 'igz-controls/components'
import { Search } from 'lucide-react'

import Breadcrumbs from '../../../common/Breadcrumbs/Breadcrumbs'
import ApplicationCounters from './ApplicationCounters/ApplicationCounters'
import ActionBar from '../../shared/ActionBar/ActionBar'

import { useFiltersFromSearchParams } from '../../../hooks/useFiltersFromSearchParams.hook'
import { usePagination } from '../../../hooks/usePagination.hook'
import { fetchApplications } from '../../../reducers/applicationsReducer'
import { BE_PAGE, BE_PAGE_SIZE } from '../../../constants'
import { APPLICATIONS_FILTERS_CONFIG, TIME_FILTER_OPTIONS } from './applications.constants'
import { buildApiFilters, buildFilterPopoverSchema, filterApplications } from './applicationsPage.util'

const ApplicationsPage = () => {
  const params = useParams()
  const dispatch = useDispatch()
  const { applications, loading } = useSelector(store => store.applicationsStore)
  const paginationConfigRef = useRef({})
  const [isDetailsReady, setIsDetailsReady] = useState(false)

  const urlFilters = useFiltersFromSearchParams(APPLICATIONS_FILTERS_CONFIG)
  const [filters, setFilters] = useState(urlFilters)

  const handleRefresh = useCallback(
    currentFilters => {
      const requestParams = {}

      if (!isEmpty(paginationConfigRef.current)) {
        requestParams.page = paginationConfigRef.current[BE_PAGE]
        requestParams['page-size'] = paginationConfigRef.current[BE_PAGE_SIZE]
      }

      return dispatch(
        fetchApplications({
          project: params.projectName,
          filters: buildApiFilters(currentFilters),
          config: { params: requestParams }
        })
      )
        .unwrap()
        .then(({ pagination }) => {
          paginationConfigRef.current.paginationResponse = pagination
        })
    },
    [dispatch, params.projectName]
  )

  const filteredApplications = useMemo(
    () => filterApplications(applications, filters),
    [applications, filters]
  )

  const [
    handlePaginatedRefresh,
    paginatedApplications,
    searchParams,
    setSearchParams
  ] = usePagination({
    content: filteredApplications,
    refreshContent: handleRefresh,
    filters,
    paginationConfigRef,
    resetPaginationTrigger: params.projectName
  })

  const filterPopoverSchema = useMemo(
    () => buildFilterPopoverSchema(filters.owner, filters.status),
    [filters.owner, filters.status]
  )

  const handlePopoverApply = useCallback((draft, applyMultiple) => {
    applyMultiple({
      status: Array.isArray(draft?.status) ? draft.status : [],
      owner: draft?.owner ?? ''
    })
  }, [])

  const handlePopoverClear = useCallback(applyMultiple => {
    applyMultiple({ status: [], owner: '' })
  }, [])

  return (
    <div className="mlrun-tw-scope h-screen overflow-hidden bg-background flex flex-col w-full">
      <TooltipProvider>
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 flex items-center justify-between shrink-0">
            <Breadcrumbs />
          </div>

          {!isDetailsReady && (
            <>
              <div className="px-6 shrink-0 [&_[data-testid='entity-table-refresh-button']_svg]:!size-5 [&_[data-testid='filter-popover-button']_svg]:!size-5">
                <ActionBar
                  filtersConfig={APPLICATIONS_FILTERS_CONFIG}
                  filters={filters}
                  setFilters={setFilters}
                  onRefresh={handlePaginatedRefresh}
                >
                  {({ filters: activeFilters, setFilterValue, applyFilter, applyMultipleFilters }) => (
                    <>
                      <div className="relative w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-igz-gray pointer-events-none z-10" />
                        <Input
                          placeholder="Search by name..."
                          className="pl-9 h-10"
                          value={activeFilters.name}
                          onChange={e => setFilterValue('name', e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') applyFilter('name', e.target.value)
                          }}
                        />
                      </div>

                      <TimeFilterDropdown
                        value={activeFilters.time}
                        options={TIME_FILTER_OPTIONS}
                        onChange={value => applyFilter('time', value)}
                        onCustomRange={range =>
                          applyMultipleFilters({
                            time: 'custom',
                            customSince: range.since,
                            customUntil: range.until
                          })
                        }
                        initialCustomRange={
                          activeFilters.time === 'custom' && activeFilters.customSince
                            ? { since: activeFilters.customSince, until: activeFilters.customUntil }
                            : undefined
                        }
                      />

                      <FilterPopover
                        schema={filterPopoverSchema}
                        title="Filter by"
                        onApply={draft => handlePopoverApply(draft, applyMultipleFilters)}
                        onClear={() => handlePopoverClear(applyMultipleFilters)}
                      />
                    </>
                  )}
                </ActionBar>
              </div>

            </>
          )}

          <div className={isDetailsReady
            ? 'flex flex-col flex-1 overflow-hidden'
            : 'flex flex-col flex-1 overflow-hidden px-6 pb-6 pt-0'
          }>
            {!isDetailsReady && <ApplicationCounters />}
            <div className={isDetailsReady
              ? 'flex flex-col flex-1 overflow-hidden'
              : 'flex flex-col flex-1 overflow-hidden mt-4 p-[20px] text-igz-secondary bg-background border rounded-lg shadow-card'
            }>
              {loading && !isDetailsReady ? (
                <Loader />
              ) : (
                <Outlet
                  context={{
                    applications: filteredApplications,
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

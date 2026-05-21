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
import { useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Input, FilterPopover } from 'igz-controls/nextGenComponents'

import SearchIcon from 'igz-controls/images/search2-icon.svg?react'
import DetailsDataTab from '../../../shared/DetailsDataTab/DetailsDataTab'
import { apiGatewaysColumns } from './apiGatewaysColumns'
import {
  filterGatewaysByFunction,
  filterApiGatewaysBySearchFields
} from './applicationApiGateways.util'
import {
  API_GATEWAYS_FILTER_CONFIG,
  API_GATEWAYS_NO_DATA_MESSAGE
} from './applicationDetails.constants'
import {
  fetchProjectApiGateways,
  clearProjectApiGateways
} from '../../../../reducers/nuclioReducer'

const ALL_OPTION_VALUE = 'all'
const ALL_OPTION = { value: ALL_OPTION_VALUE, label: 'All' }
const INITIAL_SORTING = [{ id: 'name', desc: false }]

const ApplicationApiGateways = ({ application }) => {
  const dispatch = useDispatch()
  const { projectName } = useParams()
  const projectApiGateways = useSelector(store => store.nuclioStore.projectApiGateways)
  const isLoading = useSelector(store => store.nuclioStore.projectApiGatewaysLoading)

  const applicationGateways = useMemo(
    () => filterGatewaysByFunction(projectApiGateways, projectName, application.name, application.tag),
    [projectApiGateways, projectName, application.name, application.tag]
  )

  const authModeOptions = useMemo(() => {
    const modes = new Set(
      applicationGateways.map(gw => gw.spec?.authenticationMode).filter(Boolean)
    )

    return [
      ALL_OPTION,
      ...[...modes].sort().map(mode => ({ value: mode, label: mode }))
    ]
  }, [applicationGateways])

  const fetchGateways = useCallback(() => {
    const controller = new AbortController()
    dispatch(fetchProjectApiGateways({ project: projectName, signal: controller.signal }))
    return controller
  }, [dispatch, projectName])

  useEffect(() => {
    const controller = fetchGateways()

    return () => {
      controller.abort()
      dispatch(clearProjectApiGateways())
    }
  }, [dispatch, fetchGateways])

  const handleRefresh = useCallback(() => {
    fetchGateways()
  }, [fetchGateways])

  const renderFilters = useCallback(
    ({ filters, setFilterValue, applyFilter, applyMultipleFilters }) => (
      <ApiGatewaysFilters
        filters={filters}
        setFilterValue={setFilterValue}
        applyFilter={applyFilter}
        applyMultipleFilters={applyMultipleFilters}
        authModeOptions={authModeOptions}
      />
    ),
    [authModeOptions]
  )

  return (
    <DetailsDataTab
      data={applicationGateways}
      columns={apiGatewaysColumns}
      isLoading={isLoading}
      filtersConfig={API_GATEWAYS_FILTER_CONFIG}
      filterFn={filterApiGatewaysBySearchFields}
      renderFilters={renderFilters}
      onRefresh={handleRefresh}
      showRefreshButton={false}
      initialSorting={INITIAL_SORTING}
      noDataMessage={API_GATEWAYS_NO_DATA_MESSAGE}
    />
  )
}

const ApiGatewaysFilters = ({ filters, setFilterValue, applyFilter, applyMultipleFilters, authModeOptions }) => {
  const popoverSchema = useMemo(
    () => ({
      owner: {
        key: 'owner',
        label: 'Owner',
        kind: 'text',
        placeholder: 'Search by owner...',
        defaultValue: filters.owner ?? ''
      },
      authenticationMode: {
        key: 'authenticationMode',
        label: 'Auth Mode',
        kind: 'select',
        placeholder: 'Select auth mode...',
        options: authModeOptions,
        defaultValue: filters.authenticationMode || ALL_OPTION_VALUE
      }
    }),
    [filters.owner, filters.authenticationMode, authModeOptions]
  )

  const handlePopoverApply = useCallback(
    values => {
      const authMode = values?.authenticationMode
      applyMultipleFilters({
        owner: values?.owner ?? '',
        authenticationMode: authMode === ALL_OPTION_VALUE ? '' : (authMode ?? '')
      })
    },
    [applyMultipleFilters]
  )

  const handlePopoverClear = useCallback(() => {
    applyMultipleFilters({ owner: '', authenticationMode: '' })
  }, [applyMultipleFilters])

  return (
    <>
      <div className="relative w-[280px]" data-testid="gateway-name-filter">
        <Input
          placeholder="Search by name..."
          className="pl-3 pr-9 h-10"
          data-testid="gateway-name-filter-input"
          value={filters.name ?? ''}
          onChange={e => setFilterValue('name', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') applyFilter('name', e.target.value)
          }}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-igz-accent-hover transition-colors cursor-pointer"
          onClick={() => applyFilter('name', filters.name ?? '')}
          data-testid="gateway-name-filter-search-button"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>

      <FilterPopover
        schema={popoverSchema}
        onApply={handlePopoverApply}
        onClear={handlePopoverClear}
      />
    </>
  )
}

ApiGatewaysFilters.propTypes = {
  applyFilter: PropTypes.func.isRequired,
  applyMultipleFilters: PropTypes.func.isRequired,
  authModeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  filters: PropTypes.shape({
    authenticationMode: PropTypes.string,
    name: PropTypes.string,
    owner: PropTypes.string
  }).isRequired,
  setFilterValue: PropTypes.func.isRequired
}

ApplicationApiGateways.propTypes = {
  application: PropTypes.shape({
    name: PropTypes.string.isRequired,
    tag: PropTypes.string
  }).isRequired
}

export default ApplicationApiGateways

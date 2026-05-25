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
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import DetailsDataTab from '../../../../shared/DetailsDataTab/DetailsDataTab'
import MonitoringEndpointsFilters from './MonitoringEndpointsFilters'
import EndpointDetailsPopup from './EndpointDetailsPopup'
import { getMonitoringEndpointsColumns } from './monitoringEndpointsColumns'
import {
  MONITORING_ENDPOINTS_FILTER_CONFIG,
  MONITORING_ENDPOINTS_NO_DATA_MESSAGE
} from './monitoringEndpoints.constants'
import {
  fetchModelEndpoints,
  removeModelEndpoints
} from '../../../../../reducers/artifactsReducer'
import { FUNCTION_NAME_FILTER } from '../../../../../constants'

const ALL_OPTION = { value: 'all', label: 'All' }
const INITIAL_SORTING = [{ id: 'name', desc: false }]

const filterEndpointsBySearchFields = (endpoints, filters) => {
  let filtered = endpoints

  if (filters.name) {
    const search = filters.name.toLowerCase()
    filtered = filtered.filter(endpoint =>
      (endpoint.metadata?.name ?? '').toLowerCase().includes(search)
    )
  }

  if (filters.label) {
    filtered = filtered.filter(endpoint => {
      const labels = endpoint.metadata?.labels ?? {}
      return Object.keys(labels).some(key => key === filters.label)
    })
  }

  return filtered
}

const ApplicationMonitoringEndpoints = ({ application }) => {
  const dispatch = useDispatch()
  const { projectName } = useParams()
  const abortControllerRef = useRef(null)
  const modelEndpoints = useSelector(store => store.artifactsStore.modelEndpoints.allData)
  const isLoading = useSelector(store => store.artifactsStore.modelEndpoints.loading)

  const [selectedEndpoint, setSelectedEndpoint] = useState(null)

  const labelOptions = useMemo(() => {
    const labelKeys = new Set()
    modelEndpoints.forEach(endpoint => {
      Object.keys(endpoint.metadata?.labels ?? {}).forEach(key => labelKeys.add(key))
    })

    return [
      ALL_OPTION,
      ...[...labelKeys].sort().map(key => ({ value: key, label: key }))
    ]
  }, [modelEndpoints])

  const fetchEndpoints = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    dispatch(
      fetchModelEndpoints({
        project: projectName,
        filters: {
          [FUNCTION_NAME_FILTER]: application.name
        },
        config: {
          ui: { controller: abortControllerRef.current }
        },
        params: {
          latest_only: 'True',
          'function-tag': application.tag
        }
      })
    )
  }, [dispatch, projectName, application.name, application.tag])

  useEffect(() => {
    fetchEndpoints()

    return () => {
      abortControllerRef.current?.abort()
      dispatch(removeModelEndpoints())
    }
  }, [dispatch, fetchEndpoints])

  const handleRefresh = useCallback(() => {
    fetchEndpoints()
  }, [fetchEndpoints])

  const handleEndpointClick = useCallback(({ uid, name }) => {
    setSelectedEndpoint({ uid, name })
  }, [])

  const handleClosePopup = useCallback(() => {
    setSelectedEndpoint(null)
  }, [])

  const columns = useMemo(
    () => getMonitoringEndpointsColumns(handleEndpointClick),
    [handleEndpointClick]
  )

  const renderFilters = useCallback(
    ({ filters, setFilterValue, applyFilter, applyMultipleFilters }) => (
      <MonitoringEndpointsFilters
        filters={filters}
        setFilterValue={setFilterValue}
        applyFilter={applyFilter}
        applyMultipleFilters={applyMultipleFilters}
        labelOptions={labelOptions}
      />
    ),
    [labelOptions]
  )

  return (
    <>
      <DetailsDataTab
        data={modelEndpoints}
        columns={columns}
        isLoading={isLoading}
        filtersConfig={MONITORING_ENDPOINTS_FILTER_CONFIG}
        filterFn={filterEndpointsBySearchFields}
        renderFilters={renderFilters}
        onRefresh={handleRefresh}
        showRefreshButton={false}
        initialSorting={INITIAL_SORTING}
        noDataMessage={MONITORING_ENDPOINTS_NO_DATA_MESSAGE}
      />
      <EndpointDetailsPopup
        open={!!selectedEndpoint}
        onClose={handleClosePopup}
        endpointUid={selectedEndpoint?.uid}
        endpointName={selectedEndpoint?.name}
      />
    </>
  )
}

ApplicationMonitoringEndpoints.propTypes = {
  application: PropTypes.shape({
    name: PropTypes.string.isRequired,
    tag: PropTypes.string
  }).isRequired
}

export default ApplicationMonitoringEndpoints

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
import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { FileCode2 } from 'lucide-react'

import DetailsDataTab from '../../../../shared/DetailsDataTab/DetailsDataTab'
import YamlModal from '../../../../shared/YamlModal/YamlModal'
import ApiGatewaysFilters from './ApiGatewaysFilters'
import { apiGatewaysColumns } from './apiGatewaysColumns'
import {
  filterGatewaysByFunction,
  filterApiGatewaysBySearchFields
} from './applicationApiGateways.util'
import {
  API_GATEWAYS_FILTER_CONFIG,
  API_GATEWAYS_NO_DATA_MESSAGE
} from '../applicationDetails.constants'
import {
  fetchProjectApiGateways,
  clearProjectApiGateways
} from '../../../../../reducers/nuclioReducer'

const ALL_OPTION = { value: 'all', label: 'All' }
const INITIAL_SORTING = [{ id: 'name', desc: false }]

const ApplicationApiGateways = ({ application }) => {
  const dispatch = useDispatch()
  const { projectName } = useParams()
  const projectApiGateways = useSelector(store => store.nuclioStore.projectApiGateways)
  const isLoading = useSelector(store => store.nuclioStore.projectApiGatewaysLoading)
  const [yamlGateway, setYamlGateway] = useState(null)

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

  const rowActions = useCallback(
    ({ relationship, matchedUpstream, ...originalGateway }) => [
      { label: 'View YAML', icon: FileCode2, onClick: () => setYamlGateway(originalGateway) }
    ],
    []
  )

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
    <>
      <DetailsDataTab
        data={applicationGateways}
        columns={apiGatewaysColumns}
        isLoading={isLoading}
        filtersConfig={API_GATEWAYS_FILTER_CONFIG}
        filterFn={filterApiGatewaysBySearchFields}
        renderFilters={renderFilters}
        rowActions={rowActions}
        onRefresh={handleRefresh}
        showRefreshButton={false}
        initialSorting={INITIAL_SORTING}
        noDataMessage={API_GATEWAYS_NO_DATA_MESSAGE}
      />
      <YamlModal
        open={!!yamlGateway}
        data={yamlGateway}
        onClose={() => setYamlGateway(null)}
      />
    </>
  )
}

ApplicationApiGateways.propTypes = {
  application: PropTypes.shape({
    name: PropTypes.string.isRequired,
    tag: PropTypes.string
  }).isRequired
}

export default ApplicationApiGateways

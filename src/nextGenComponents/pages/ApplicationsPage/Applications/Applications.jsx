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
import {
  DataTable,
  Loader,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from 'igz-controls/nextGenComponents'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { isEmpty } from 'lodash'
import { HelpCircle, FileCode2 } from 'lucide-react'

import ApplicationDetails from '../ApplicationDetails/ApplicationDetails'
import NoData from '../../../shared/NoData/NoData'
import YamlModal from '../../../shared/YamlModal/YamlModal'
import { getApplicationsColumns } from './applicationsColumns'
import { APPLICATIONS_PAGE, APPLICATIONS_PAGE_PATH } from '../../../../constants'
import { checkForSelectedApplication } from '../applicationsPage.util'
import { DEFAULT_APPLICATION_DETAILS_TAB } from '../ApplicationDetails/applicationDetails.constants'
import { getNoDataMessage } from '../../../../utils/getNoDataMessage'

const Applications = () => {
  const {
    applications,
    filters,
    filtersConfig,
    fetchSingleEnrichedFunction,
    setIsDetailsReady
  } = useOutletContext()
  const params = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const funcLoading = useSelector(
    store => store.functionsStore.funcLoading || store.nuclioStore.nuclioFunctionLoading
  )
  const lastCheckedApplicationIdRef = useRef(null)
  const [selectedApplication, setSelectedApplication] = useState({})
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(Date.now())
  const [yamlData, setYamlData] = useState(null)

  const isDetailsOpen = !isEmpty(selectedApplication)

  const handleCloseDetails = useCallback(() => {
    setSelectedApplication({})
    navigate(`/projects/${params.projectName}/${APPLICATIONS_PAGE_PATH}${window.location.search}`, {
      replace: true
    })
  }, [navigate, params.projectName])

  const handleTabChange = useCallback(
    tabId => {
      if (params.name && params.id) {
        navigate(
          `/projects/${params.projectName}/${APPLICATIONS_PAGE_PATH}/${params.name}/${params.id}/${tabId}${window.location.search}`,
          { replace: true }
        )
      }
    },
    [navigate, params.projectName, params.name, params.id]
  )

  const handleRefreshDetails = useCallback(() => {
    setDetailsRefreshKey(Date.now())
    lastCheckedApplicationIdRef.current = null

    checkForSelectedApplication({
      applicationName: params.name,
      applicationId: params.id,
      applications,
      navigate,
      projectName: params.projectName,
      setSelectedApplication,
      fetchSingleEnrichedFunction,
      dispatch,
      lastCheckedApplicationIdRef
    })
  }, [applications, dispatch, fetchSingleEnrichedFunction, navigate, params.id, params.name, params.projectName])

  const handleViewYaml = useCallback(application => {
    setYamlData(application.ui?.originalContent ?? application)
  }, [])

  const rowActions = useCallback(
    application => [
      {
        label: 'View YAML',
        icon: FileCode2,
        onClick: () => handleViewYaml(application)
      }
    ],
    [handleViewYaml]
  )

  useEffect(() => {
    checkForSelectedApplication({
      applicationName: params.name,
      applicationId: params.id,
      applications,
      navigate,
      projectName: params.projectName,
      setSelectedApplication,
      fetchSingleEnrichedFunction,
      dispatch,
      lastCheckedApplicationIdRef
    })
  }, [applications, dispatch, fetchSingleEnrichedFunction, navigate, params.id, params.name, params.projectName])

  useEffect(() => {
    if (isEmpty(selectedApplication)) {
      lastCheckedApplicationIdRef.current = null
      setIsDetailsReady(false)
    } else {
      setIsDetailsReady(true)
    }
  }, [selectedApplication, setIsDetailsReady])

  const columns = useMemo(() => getApplicationsColumns(params.projectName), [params.projectName])

  if (isDetailsOpen) {
    return (
      <div className="relative h-full">
        <ApplicationDetails
          key={detailsRefreshKey}
          application={selectedApplication}
          activeTab={params.tab ?? DEFAULT_APPLICATION_DETAILS_TAB}
          onTabChange={handleTabChange}
          onClose={handleCloseDetails}
          onRefresh={handleRefreshDetails}
        />
        {funcLoading && <Loader mode="fullscreen" />}
      </div>
    )
  }

  if (funcLoading && !isDetailsOpen) {
    return <Loader mode="fullscreen" />
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-background relative"
      data-testid="applications-list"
    >
      <div className="flex items-center gap-1.5 mb-3 shrink-0">
        <h2 className="text-base font-medium text-igz-primary" data-testid="applications-heading">
          All Applications
        </h2>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <HelpCircle className="h-4 w-4 text-igz-gray cursor-default" data-testid="help-icon" />
          </TooltipTrigger>
          <TooltipContent side="top">
            List of all deployed applications in the project
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 min-h-[200px] flex flex-col [&_thead_tr]:z-[1]">
        {applications.length === 0 ? (
          <NoData message={getNoDataMessage(filters, filtersConfig, null, APPLICATIONS_PAGE)} />
        ) : (
          <DataTable
            data={applications}
            columns={columns}
            rowActions={rowActions}
            initialSorting={[{ id: 'name', desc: false }]}
          />
        )}
      </div>
      <YamlModal
        open={!!yamlData}
        data={yamlData}
        onClose={() => setYamlData(null)}
      />
    </div>
  )
}

export default Applications

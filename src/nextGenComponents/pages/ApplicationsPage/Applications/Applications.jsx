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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DataTable, Tooltip, TooltipContent, TooltipTrigger } from 'igz-controls/nextGenComponents'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { isEmpty } from 'lodash'
import { formatDatetime } from 'igz-controls/utils/datetime.util'
import { HelpCircle, FileCode2 } from 'lucide-react'

import { Loader } from 'igz-controls/nextGenComponents'
import ApplicationDetails from '../ApplicationDetails/ApplicationDetails'
import Pagination from '../../../../common/Pagination/Pagination'
import UrlCell, { buildUrlItems } from '../../../shared/UrlCell'
import { APPLICATIONS_PAGE_PATH } from '../../../../constants'
import { toggleYaml } from '../../../../reducers/appReducer'
import { fetchFunction } from '../../../../reducers/functionReducer'
import { checkForSelectedApplication } from '../applicationsPage.util'
import { DEFAULT_APPLICATION_DETAILS_TAB } from '../ApplicationDetails/applicationDetails.constants'

const Applications = () => {
  const { applications, paginatedApplications, paginationConfigRef, searchParams, setSearchParams, setIsDetailsReady } =
    useOutletContext()
  const params = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { funcLoading } = useSelector(store => store.functionsStore)
  const lastCheckedApplicationIdRef = useRef(null)
  const [selectedApplication, setSelectedApplication] = useState({})
  const [detailsRefreshKey, setDetailsRefreshKey] = useState(Date.now())

  const isDetailsOpen = !isEmpty(selectedApplication)

  const handleCloseDetails = useCallback(() => {
    setSelectedApplication({})
    navigate(
      `/projects/${params.projectName}/${APPLICATIONS_PAGE_PATH}${window.location.search}`,
      { replace: true }
    )
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
      paginatedApplications,
      paginationConfigRef,
      searchParams,
      setSearchParams,
      navigate,
      projectName: params.projectName,
      setSelectedApplication,
      dispatch,
      lastCheckedApplicationIdRef
    })
  }, [
    applications,
    dispatch,
    navigate,
    paginatedApplications,
    paginationConfigRef,
    params.id,
    params.name,
    params.projectName,
    searchParams,
    setSearchParams
  ])

  const handleViewYaml = useCallback(
    application => {
      if (application.ui?.originalContent) {
        dispatch(toggleYaml(application.ui.originalContent))
      } else {
        dispatch(
          fetchFunction({
            project: params.projectName,
            name: application.name,
            hash: application.hash,
            tag: application.tag
          })
        )
          .unwrap()
          .then(func => {
            if (func) {
              dispatch(toggleYaml(func))
            }
          })
      }
    },
    [dispatch, params.projectName]
  )

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
      paginatedApplications,
      paginationConfigRef,
      searchParams,
      setSearchParams,
      navigate,
      projectName: params.projectName,
      setSelectedApplication,
      dispatch,
      lastCheckedApplicationIdRef
    })
  }, [
    applications,
    dispatch,
    navigate,
    paginatedApplications,
    paginationConfigRef,
    params.id,
    params.name,
    params.projectName,
    searchParams,
    setSearchParams
  ])

  useEffect(() => {
    if (isEmpty(selectedApplication)) {
      lastCheckedApplicationIdRef.current = null
      setIsDetailsReady(false)
    } else {
      setIsDetailsReady(true)
    }
  }, [selectedApplication, setIsDetailsReady])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 15,
        cell: ({ row }) => {
          const state = row.original.state ?? {}
          const stateLabel = state.label ?? state.value ?? 'Unknown'
          const tag = row.original.tag || ''
          const hash = row.original.hash || ''
          const identifier = tag ? `:${tag}@${hash}` : `@${hash}`

          return (
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${params.projectName}/${APPLICATIONS_PAGE_PATH}/${row.original.name}/${identifier}/${DEFAULT_APPLICATION_DETAILS_TAB}`}
                className="text-igz-primary font-medium hover:underline"
              >
                {row.original.name}
              </Link>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <i
                    className={`${state.className ?? 'state-unknown-function'} cursor-default`}
                    data-testid="status-dot"
                  />
                </TooltipTrigger>
                <TooltipContent side="top">{stateLabel}</TooltipContent>
              </Tooltip>
            </div>
          )
        }
      },
      {
        accessorKey: 'external_invocation_urls',
        header: 'URLs',
        size: 50,
        meta: { skipEllipsisTooltip: true },
        cell: ({ row }) => (
          <UrlCell
            items={buildUrlItems(
              row.original.external_invocation_urls ?? [],
              row.original.internal_invocation_urls ?? []
            )}
          />
        )
      },
      {
        accessorKey: 'external_invocation_urls',
        id: 'endpoints',
        header: 'Endpoints',
        size: 10,
        cell: ({ row }) => (
          <span className="text-igz-light-purple font-medium">
            {row.original.external_invocation_urls?.length ?? 0}
          </span>
        )
      },
      {
        accessorKey: 'updated',
        size: 17,
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-igz-secondary">
            {formatDatetime(row.original.updated, 'N/A')}
          </span>
        )
      },
    ],
    [params.projectName]
  )

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
        {funcLoading && isDetailsOpen && <Loader mode="fullscreen" />}
      </div>
    )
  }

  if (funcLoading && !isDetailsOpen) {
    return <Loader mode="fullscreen" />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      <div className="flex items-center gap-1.5 mb-3 shrink-0">
        <h2 className="text-base font-medium text-igz-primary">All Applications</h2>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
                <HelpCircle
                  className="h-4 w-4 text-igz-gray cursor-default"
              data-testid="help-icon"
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            List of all deployed applications in the project
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 min-h-[200px] flex flex-col [&_thead_tr]:z-[1]">
        <DataTable
          data={paginatedApplications}
          columns={columns}
          rowActions={rowActions}
        />
      </div>
      <Pagination
        paginationConfig={paginationConfigRef.current}
        closeParamName={APPLICATIONS_PAGE_PATH}
      />
    </div>
  )
}

export default Applications

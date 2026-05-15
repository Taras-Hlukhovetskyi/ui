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
import React, { useMemo } from 'react'
import { DataTable, Tooltip, TooltipContent, TooltipTrigger } from 'igz-controls/nextGenComponents'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { HelpCircle } from 'lucide-react'

import Pagination from '../../../../common/Pagination/Pagination'
import UrlCell, { buildUrlItems } from '../../../shared/UrlCell'
import { APPLICATIONS_PAGE_PATH } from '../../../../constants'

const Applications = () => {
  const { applications, paginationConfigRef } = useOutletContext()
  const params = useParams()

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 15,
        cell: ({ row }) => {
          const state = row.original.state ?? {}
          const stateLabel = state.label ?? state.value ?? 'Unknown'

          return (
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${params.projectName}/applications/${row.original.name}/overview`}
                className="text-slate-900 font-medium hover:text-blue-600 transition-colors"
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
                <TooltipContent side="top">
                  {stateLabel}
                </TooltipContent>
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
          <Link to="#" className="text-blue-600 font-medium hover:underline text-[13px]">
            {row.original.external_invocation_urls?.length ?? 0}
          </Link>
        )
      },
      {
        accessorKey: 'updated',
        size: 17,
        header: () => (
          <div className="flex items-center gap-1">
            <span>Updated</span>
          </div>
        ),
        cell: ({ row }) => (
          <span className="text-slate-600 text-[13px]">
            {row.original.updated
              ? format(row.original.updated, 'MMM d, yyyy, HH:mm:ss aa')
              : 'N/A'}
          </span>
        )
      },
      {
        accessorKey: 'labels',
        header: 'Owner',
        size: 12,
        cell: ({ row }) => (
          <span className="text-slate-700 text-[13px]">
            {row.original.labels?.owner || 'N/A'}
          </span>
        )
      }
    ],
    [params.projectName]
  )

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 mb-3 shrink-0">
        <h2 className="text-base font-semibold text-slate-900">All Applications</h2>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <HelpCircle
              className="h-4 w-4 text-slate-400 cursor-default"
              data-testid="help-icon"
            />
          </TooltipTrigger>
          <TooltipContent side="top">
            List of all deployed applications in the project
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1 min-h-0 flex flex-col [&_thead_tr]:z-[1]">
        <DataTable data={applications} columns={columns} />
      </div>
      <Pagination
        paginationConfig={paginationConfigRef.current}
        closeParamName={APPLICATIONS_PAGE_PATH}
      />
    </div>
  )
}

export default Applications

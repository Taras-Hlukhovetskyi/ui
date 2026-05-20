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
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from 'igz-controls/nextGenComponents'
import { formatDatetime } from 'igz-controls/utils/datetime.util'

import UrlCell, { buildUrlItems } from '../../../shared/UrlCell'
import { APPLICATIONS_PAGE_PATH } from '../../../../constants'
import { DEFAULT_APPLICATION_DETAILS_TAB } from '../ApplicationDetails/applicationDetails.constants'

export const getApplicationsColumns = projectName => [
  {
    accessorKey: 'name',
    header: 'Name',
    id: 'name',
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
            to={`/projects/${projectName}/${APPLICATIONS_PAGE_PATH}/${row.original.name}/${identifier}/${DEFAULT_APPLICATION_DETAILS_TAB}`}
            className="text-igz-primary font-medium hover:underline"
            data-testid="application-name-link"
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
    id: 'urls',
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
    id: 'endpoints',
    header: 'Endpoints',
    size: 10,
    accessorFn: row => row.external_invocation_urls?.length ?? 0,
    cell: ({ row }) => (
      <span className="text-igz-light-purple font-medium" data-testid="endpoints-count">
        {row.original.external_invocation_urls?.length ?? 0}
      </span>
    )
  },
  {
    accessorKey: 'updated',
    id: 'updated',
    size: 17,
    header: 'Updated',
    cell: ({ row }) => (
      <span className="text-igz-secondary">{formatDatetime(row.original.updated, 'N/A')}</span>
    )
  },
  {
    id: 'owner',
    header: 'Owner',
    size: 12,
    accessorFn: row => row.owner ?? '',
    cell: ({ row }) => (
      <span className="text-igz-secondary" data-testid="owner-cell">
        {row.original.owner || '-'}
      </span>
    )
  }
]

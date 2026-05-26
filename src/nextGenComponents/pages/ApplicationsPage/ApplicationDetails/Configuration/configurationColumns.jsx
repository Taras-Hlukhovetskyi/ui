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
import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip, TooltipContent, TooltipTrigger } from 'igz-controls/nextGenComponents'
import { HelpCircle } from 'lucide-react'

import {
  KEY_TOOLTIP_TEXT,
  ANNOTATION_KEY_TOOLTIP_TEXT,
  TOOLTIP_DELAY_MS,
  TOOLTIP_COLLISION_PADDING
} from './applicationConfiguration.constants'

const KeyHeaderWithTooltip = ({ tooltipText }) => (
  <div className="flex items-center gap-1">
    <span>Key</span>
    <Tooltip delayDuration={TOOLTIP_DELAY_MS}>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3 h-3 text-igz-secondary cursor-default" aria-label="Help" data-testid="key-column-help-icon" />
      </TooltipTrigger>
      <TooltipContent side="top" collisionPadding={TOOLTIP_COLLISION_PADDING} className="max-w-md whitespace-normal">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  </div>
)

KeyHeaderWithTooltip.propTypes = {
  tooltipText: PropTypes.string.isRequired
}

export const environmentVariablesColumns = [
  {
    accessorKey: 'type',
    header: 'Type',
    id: 'type',
    size: 14,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body-sm" data-testid={`env-var-type-${row.index}`}>{row.original.type}</span>
    )
  },
  {
    accessorKey: 'key',
    header: 'Key',
    id: 'key',
    size: 25,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body truncate" data-testid={`env-var-key-${row.index}`}>{row.original.key}</span>
    )
  },
  {
    accessorKey: 'value',
    header: 'Value',
    id: 'value',
    size: 61,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body-sm truncate" data-testid={`env-var-value-${row.index}`}>{row.original.value || ''}</span>
    )
  }
]

export const labelsColumns = [
  {
    accessorKey: 'key',
    id: 'key',
    size: 40,
    enableSorting: false,
    header: () => <KeyHeaderWithTooltip tooltipText={KEY_TOOLTIP_TEXT} />,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body-sm" data-testid={`label-key-${row.index}`}>{row.original.key}</span>
    )
  },
  {
    accessorKey: 'value',
    header: 'Value',
    id: 'value',
    size: 60,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body-sm truncate" data-testid={`label-value-${row.index}`}>{row.original.value || ''}</span>
    )
  }
]

export const annotationsColumns = [
  {
    accessorKey: 'key',
    id: 'key',
    size: 40,
    enableSorting: false,
    header: () => <KeyHeaderWithTooltip tooltipText={ANNOTATION_KEY_TOOLTIP_TEXT} />,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body-sm" data-testid={`annotation-key-${row.index}`}>{row.original.key}</span>
    )
  },
  {
    accessorKey: 'value',
    header: 'Value',
    id: 'value',
    size: 60,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-igz-primary text-body-sm truncate" data-testid={`annotation-value-${row.index}`}>{row.original.value || ''}</span>
    )
  }
]

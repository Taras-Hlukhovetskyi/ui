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
import React, { useCallback, useMemo } from 'react'
import { cn } from 'igz-controls/nextGenComponents'

import ExpandableSectionTable from './ExpandableSectionTable'
import {
  PROBE_COLUMN,
  PROBE_COLUMN_FLEX,
  EXPANDED_DETAIL_FIELD,
  LABEL_WIDTH,
  ROW_MIN_HEIGHT_LG
} from './applicationConfiguration.constants'
import { getProbesData } from './applicationConfiguration.util'
import { applicationShape } from './applicationConfiguration.propTypes'

const COLUMNS = [
  { id: 'name', label: PROBE_COLUMN.NAME, flex: PROBE_COLUMN_FLEX.NAME },
  { id: 'handlerType', label: PROBE_COLUMN.TYPE, flex: PROBE_COLUMN_FLEX.TYPE }
]

const buildRowCells = probe => [
  { id: 'name', value: probe.name, flex: PROBE_COLUMN_FLEX.NAME },
  { id: 'handlerType', value: probe.handlerType, flex: PROBE_COLUMN_FLEX.TYPE }
]

const getRowKey = probe => probe.name

const ProbesSection = ({ application }) => {
  const data = useMemo(() => getProbesData(application), [application])

  const renderExpandedProbe = useCallback(
    probe => (
      <div className="flex flex-col">
        {probe.details.map((item, index) => (
          <div key={item.label} className="flex flex-col">
            <div className={cn('flex py-2 pl-1', ROW_MIN_HEIGHT_LG)}>
              <span className={cn(LABEL_WIDTH, 'shrink-0 text-body text-igz-primary')}>
                {item.label}
              </span>
              <span className="text-body text-igz-secondary">{item.value}</span>
            </div>
            {index < probe.details.length - 1 && <div className="bg-igz-gray-light h-px w-full" />}
          </div>
        ))}
        {probe.additionalSettings?.length > 0 && (
          <>
            <div className="bg-igz-gray-light h-px w-full my-2" />
            <h4 className="text-body text-igz-primary font-semibold mb-1">
              {EXPANDED_DETAIL_FIELD.ADDITIONAL_SETTINGS}
            </h4>
            {probe.additionalSettings.map((item, index) => (
              <div key={item.label} className="flex flex-col">
                <div className={cn('flex py-2 pl-1', ROW_MIN_HEIGHT_LG)}>
                  <span className={cn(LABEL_WIDTH, 'shrink-0 text-body text-igz-primary')}>
                    {item.label}
                  </span>
                  <span className="text-body text-igz-secondary">{item.value}</span>
                </div>
                {index < probe.additionalSettings.length - 1 && (
                  <div className="bg-igz-gray-light h-px w-full" />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    ),
    []
  )

  return (
    <ExpandableSectionTable
      testId="probes-section"
      columns={COLUMNS}
      rows={data}
      getRowKey={getRowKey}
      buildRowCells={buildRowCells}
      renderExpanded={renderExpandedProbe}
    />
  )
}

ProbesSection.propTypes = {
  application: applicationShape.isRequired
}

export default ProbesSection

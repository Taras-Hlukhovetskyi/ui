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

import NoData from '../../../../shared/NoData/NoData'
import ExpandableRow from './ExpandableRow'
import {
  VOLUME_COLUMN,
  VOLUME_COLUMN_FLEX,
  EXPANDED_DETAIL_FIELD,
  LABEL_WIDTH,
  ROW_MIN_HEIGHT
} from './applicationConfiguration.constants'
import { getVolumesData } from './applicationConfiguration.util'
import { applicationShape } from './applicationConfiguration.propTypes'

const NO_DATA_MESSAGE = 'No data available'

const VolumesSection = ({ application }) => {
  const data = useMemo(() => getVolumesData(application), [application])

  const renderExpandedVolume = useCallback(volume => (
    <div className="flex flex-col gap-1.5">
      {Object.entries(volume.details).map(([key, value]) => (
        <div key={key} className={cn('flex py-1 pl-1', ROW_MIN_HEIGHT)}>
          <span className={cn(LABEL_WIDTH, 'shrink-0 text-body text-igz-primary')}>{key}</span>
          <span className="text-body text-igz-secondary">{value || '-'}</span>
        </div>
      ))}
      <div className={cn('flex py-1 pl-1', ROW_MIN_HEIGHT)}>
        <span className={cn(LABEL_WIDTH, 'shrink-0 text-body text-igz-primary')}>{EXPANDED_DETAIL_FIELD.MOUNT_PATH}</span>
        <span className="text-body text-igz-secondary">{volume.mountPath || '-'}</span>
      </div>
      <div className={cn('flex py-1 pl-1', ROW_MIN_HEIGHT)}>
        <span className={cn(LABEL_WIDTH, 'shrink-0 text-body text-igz-primary')}>{EXPANDED_DETAIL_FIELD.READ_ONLY}</span>
        <span className="text-body text-igz-secondary">{volume.readOnly}</span>
      </div>
    </div>
  ), [])

  if (data.length === 0) {
    return <NoData message={NO_DATA_MESSAGE} />
  }

  return (
    <div data-testid="volumes-section" className="rounded-lg border border-igz-gray-light overflow-hidden">
      <div className="flex py-2.5 px-1 border-b border-igz-gray-light">
        <span className="text-sm font-medium text-igz-primary pl-6" style={{ flex: VOLUME_COLUMN_FLEX.NAME }}>{VOLUME_COLUMN.NAME}</span>
        <span className="text-sm font-medium text-igz-primary" style={{ flex: VOLUME_COLUMN_FLEX.TYPE }}>{VOLUME_COLUMN.TYPE}</span>
        <span className="text-sm font-medium text-igz-primary" style={{ flex: VOLUME_COLUMN_FLEX.MOUNT_PATH_PARAMS }}>{VOLUME_COLUMN.MOUNT_PATH_PARAMS}</span>
      </div>
      {data.map(volume => (
        <ExpandableRow
          key={volume.name}
          row={{
            name: volume.name,
            cells: [
              { id: 'name', value: volume.name, flex: VOLUME_COLUMN_FLEX.NAME },
              { id: 'type', value: volume.type, flex: VOLUME_COLUMN_FLEX.TYPE },
              { id: 'mountPath', value: volume.mountPath, flex: VOLUME_COLUMN_FLEX.MOUNT_PATH_PARAMS }
            ],
            ...volume
          }}
          renderExpanded={renderExpandedVolume}
        />
      ))}
    </div>
  )
}

VolumesSection.propTypes = {
  application: applicationShape.isRequired
}

export default VolumesSection

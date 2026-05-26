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
import { DataTable } from 'igz-controls/nextGenComponents'

import NoData from '../../../../shared/NoData/NoData'
import { getAnnotationsData } from './applicationConfiguration.util'
import { annotationsColumns } from './configurationColumns'
import { applicationShape } from './applicationConfiguration.propTypes'

const NO_DATA_MESSAGE = 'No data available'
const TABLE_CLASS =
  '[&_th_button]:text-igz-primary [&_th_button]:font-medium [&_th_button:disabled]:opacity-100'

const AnnotationsSection = ({ application }) => {
  const data = useMemo(() => getAnnotationsData(application), [application])

  if (data.length === 0) {
    return <NoData message={NO_DATA_MESSAGE} />
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" data-testid="annotations-section">
      <DataTable
        data={data}
        columns={annotationsColumns}
        className={`${TABLE_CLASS} flex-1 min-h-0`}
      />
    </div>
  )
}

AnnotationsSection.propTypes = {
  application: applicationShape.isRequired
}

export default AnnotationsSection

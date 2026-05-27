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
import PropTypes from 'prop-types'
import { cn } from 'igz-controls/nextGenComponents'

import NoData from '../../../../shared/NoData/NoData'
import ExpandableRow from './ExpandableRow'

const NO_DATA_MESSAGE = 'No data available'

const ExpandableSectionTable = ({
  testId,
  columns,
  rows,
  getRowKey,
  buildRowCells,
  renderExpanded,
  noDataMessage = NO_DATA_MESSAGE
}) => {
  if (rows.length === 0) {
    return <NoData message={noDataMessage} />
  }

  return (
    <div data-testid={testId} className="rounded-lg border border-igz-gray-light">
      <div
        className="flex py-2.5 px-1 border-b border-igz-gray-light sticky top-0 z-10 bg-background rounded-t-lg"
        data-testid={`${testId}-header`}
      >
        {columns.map((col, index) => (
          <span
            key={col.id}
            className={cn('text-sm font-medium text-igz-primary', index === 0 && 'pl-6')}
            style={{ flex: col.flex }}
            data-testid={`${testId}-header-${col.id}`}
          >
            {col.label}
          </span>
        ))}
      </div>
      {rows.map((item, index) => (
        <ExpandableRow
          key={getRowKey(item)}
          defaultExpanded={index === 0}
          row={{
            name: getRowKey(item),
            cells: buildRowCells(item),
            ...item
          }}
          renderExpanded={renderExpanded}
        />
      ))}
    </div>
  )
}

ExpandableSectionTable.propTypes = {
  buildRowCells: PropTypes.func.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      flex: PropTypes.number.isRequired,
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  getRowKey: PropTypes.func.isRequired,
  noDataMessage: PropTypes.string,
  renderExpanded: PropTypes.func.isRequired,
  rows: PropTypes.array.isRequired,
  testId: PropTypes.string.isRequired
}

export default ExpandableSectionTable

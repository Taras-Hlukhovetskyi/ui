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
import { Separator } from 'igz-controls/nextGenComponents'

const EMPTY_VALUE_PLACEHOLDER = '-'

const DetailsInfoTable = ({ className = '', items }) => {
  const visibleItems = items.filter(item => !item.hidden)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-col ${className}`} data-testid="details-info-table">
      {visibleItems.map((item, index) => (
        <React.Fragment key={item.label}>
          <div
            className="flex py-2 min-h-[38px]"
            data-testid={item.testId ?? `info-row-${item.label}`}
          >
            <span className="w-[140px] shrink-0 text-igz-secondary">
              {item.label}
            </span>
            <div className="flex-1 text-igz-primary break-words min-w-0">
              {item.value ?? EMPTY_VALUE_PLACEHOLDER}
            </div>
          </div>
          {index < visibleItems.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  )
}

DetailsInfoTable.propTypes = {
  className: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
      hidden: PropTypes.bool,
      testId: PropTypes.string
    })
  ).isRequired
}

export default DetailsInfoTable

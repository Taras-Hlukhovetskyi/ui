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
import { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Input, FilterPopover } from 'igz-controls/nextGenComponents'

import SearchIcon from 'igz-controls/images/search2-icon.svg?react'

const ALL_OPTION_VALUE = 'all'

const MonitoringEndpointsFilters = ({
  filters,
  setFilterValue,
  applyFilter,
  applyMultipleFilters,
  labelOptions
}) => {
  const popoverSchema = useMemo(
    () => ({
      label: {
        key: 'label',
        label: 'Label',
        kind: 'select',
        placeholder: 'Select label...',
        options: labelOptions,
        defaultValue: filters.label || ALL_OPTION_VALUE
      }
    }),
    [filters.label, labelOptions]
  )

  const handlePopoverApply = useCallback(
    values => {
      const label = values?.label
      applyMultipleFilters({
        label: label === ALL_OPTION_VALUE ? '' : (label ?? '')
      })
    },
    [applyMultipleFilters]
  )

  const handlePopoverClear = useCallback(() => {
    applyMultipleFilters({ label: '' })
  }, [applyMultipleFilters])

  return (
    <>
      <div className="relative w-[280px]" data-testid="monitoring-endpoints-name-filter">
        <Input
          placeholder="Search by name..."
          className="pl-3 pr-9 h-10"
          data-testid="monitoring-endpoints-name-filter-input"
          value={filters.name ?? ''}
          onChange={event => setFilterValue('name', event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') applyFilter('name', event.target.value)
          }}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-igz-accent-hover transition-colors cursor-pointer"
          onClick={() => applyFilter('name', filters.name ?? '')}
          data-testid="monitoring-endpoints-name-filter-search-button"
        >
          <SearchIcon className="h-4 w-4" />
        </button>
      </div>

      <FilterPopover
        scopeId="monitoring-endpoints"
        schema={popoverSchema}
        onApply={handlePopoverApply}
        onClear={handlePopoverClear}
      />
    </>
  )
}

MonitoringEndpointsFilters.propTypes = {
  applyFilter: PropTypes.func.isRequired,
  applyMultipleFilters: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    label: PropTypes.string,
    name: PropTypes.string
  }).isRequired,
  labelOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })
  ).isRequired,
  setFilterValue: PropTypes.func.isRequired
}

export default MonitoringEndpointsFilters

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
import { datePickerPastOptions } from '../../../utils/datePicker.util'

import {
  APPLICATION_STATUS,
  FAILED_API_STATES,
  STATUS_POPOVER_OPTIONS,
  TIME_FILTER_CUSTOM_VALUE
} from './applications.constants'

export const getSinceDate = timeValue => {
  const option = datePickerPastOptions.find(o => o.id === timeValue)
  if (!option?.isPredefined || !option.handler) return undefined
  const [since] = option.handler()
  return since?.toISOString()
}

export const buildApiFilters = filters => {
  const apiFilters = {}

  if (filters.name) {
    apiFilters.name = filters.name
  }

  if (filters.time === TIME_FILTER_CUSTOM_VALUE) {
    if (filters.customSince) {
      apiFilters.since = filters.customSince
    }
  } else {
    const since = getSinceDate(filters.time)
    if (since) {
      apiFilters.since = since
    }
  }

  if (Array.isArray(filters.status) && filters.status.length > 0) {
    apiFilters.state = filters.status.flatMap(uiStatus => {
      if (uiStatus === APPLICATION_STATUS.RUNNING) return [APPLICATION_STATUS.READY]
      if (uiStatus === APPLICATION_STATUS.FAILED) return FAILED_API_STATES
      return [uiStatus]
    })
  }

  return apiFilters
}

export const buildFilterPopoverSchema = (currentOwner, currentStatus) => ({
  status: {
    key: 'status',
    label: 'Status',
    kind: 'multi-select',
    placeholder: 'All statuses',
    defaultValue: Array.isArray(currentStatus) ? currentStatus : [],
    options: STATUS_POPOVER_OPTIONS
  },
  owner: {
    key: 'owner',
    label: 'Owner',
    kind: 'text',
    placeholder: 'Search owner name...',
    defaultValue: currentOwner ?? ''
  }
})

export const filterApplications = (applications, { status, owner }) => {
  const selectedStatuses = Array.isArray(status) ? status : []

  return applications.filter(app => {
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(app.state?.value)) {
      return false
    }
    if (owner && !app.labels?.owner?.toLowerCase().includes(owner.toLowerCase())) {
      return false
    }
    return true
  })
}

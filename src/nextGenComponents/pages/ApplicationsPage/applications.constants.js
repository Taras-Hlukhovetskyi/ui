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
import {
  ANY_TIME_DATE_OPTION,
  CUSTOM_RANGE_DATE_OPTION,
  datePickerPastOptions
} from '../../../utils/datePicker.util'

export const APPLICATION_STATUS = {
  READY: 'ready',
  RUNNING: 'running',
  BUILDING: 'building',
  FAILED: 'failed',
  ERROR: 'error',
  UNHEALTHY: 'unhealthy'
}

export const FILTER_ALL_APPLICATIONS_STATUS = 'all'

export const FAILED_API_STATES = [APPLICATION_STATUS.ERROR, APPLICATION_STATUS.UNHEALTHY]

export const APPLICATION_STATUS_OPTIONS = [
  { value: APPLICATION_STATUS.RUNNING, label: 'Running', color: 'var(--igz-status-running)' },
  { value: APPLICATION_STATUS.BUILDING, label: 'Deploying', color: 'var(--igz-status-deploying)' },
  { value: APPLICATION_STATUS.FAILED, label: 'Failed', color: 'var(--igz-status-failed)' }
]

export const STATUS_POPOVER_OPTIONS = [
  { value: FILTER_ALL_APPLICATIONS_STATUS, label: 'All', meta: {} },
  ...APPLICATION_STATUS_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
    meta: { color: option.color }
  }))
]

export const TIME_FILTER_CUSTOM_VALUE = 'custom'

export const DEFAULT_TIME_FILTER = ANY_TIME_DATE_OPTION

export const TIME_FILTER_OPTIONS = [
  ...datePickerPastOptions
    .filter(option => option.id !== CUSTOM_RANGE_DATE_OPTION)
    .map(option => ({ value: option.id, label: option.label })),
  { value: TIME_FILTER_CUSTOM_VALUE, label: 'Custom range', rightIcon: 'chevron' }
]

export const APPLICATIONS_FILTERS_CONFIG = {
  name: {
    defaultValue: '',
    initialValue: ''
  },
  time: {
    defaultValue: DEFAULT_TIME_FILTER,
    initialValue: DEFAULT_TIME_FILTER
  },
  status: {
    defaultValue: [FILTER_ALL_APPLICATIONS_STATUS],
    initialValue: [FILTER_ALL_APPLICATIONS_STATUS],
    serializeUrl: values => (Array.isArray(values) ? values.join(',') : ''),
    parseUrl: str => (str ? str.split(',') : [FILTER_ALL_APPLICATIONS_STATUS])
  },
  customSince: {
    defaultValue: '',
    initialValue: ''
  },
  customUntil: {
    defaultValue: '',
    initialValue: ''
  }
}

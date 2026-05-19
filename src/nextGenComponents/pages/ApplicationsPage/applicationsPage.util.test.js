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
import { vi, describe, it, expect, beforeEach } from 'vitest'

import { APPLICATION_STATUS, APPLICATION_STATUS_OPTIONS } from './applications.constants'
import { buildApiFilters, filterApplications } from './applicationsPage.util'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../utils/datePicker.util', () => {
  const options = [
    {
      id: 'anyTime',
      label: 'Any time',
      isPredefined: false,
      handler: () => [null]
    },
    {
      id: 'past24hours',
      label: 'Past 24 hours',
      isPredefined: true,
      handler: () => [new Date('2026-05-12T15:00:00.000Z'), new Date('2026-05-13T15:00:00.000Z')]
    },
    {
      id: 'pastWeek',
      label: 'Past week',
      isPredefined: true,
      handler: () => [new Date('2026-05-06T15:00:00.000Z'), new Date('2026-05-13T15:00:00.000Z')]
    },
    {
      id: 'customRange',
      label: 'Custom range'
    }
  ]

  return {
    ANY_TIME_DATE_OPTION: 'anyTime',
    CUSTOM_RANGE_DATE_OPTION: 'customRange',
    datePickerPastOptions: options,
    getDatePickerFilterValue: (opts, optionId) => {
      const match = opts.find(o => o.id === optionId)
      return {
        value: match?.handler?.() ?? [null],
        isPredefined: match?.isPredefined ?? false,
        initialSelectedOptionId: optionId
      }
    }
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeApp = stateValue => ({
  state: { value: stateValue }
})

const makeDateFilter = (dates, isPredefined = true) => ({
  value: dates,
  isPredefined,
  initialSelectedOptionId: isPredefined ? 'past24hours' : 'customRange'
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('applicationsPage.util', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── APPLICATION_STATUS ─────────────────────────────────────────────────────

  describe('APPLICATION_STATUS', () => {
    it('has a RUNNING key with value "running"', () => {
      expect(APPLICATION_STATUS.RUNNING).toBe('running')
    })

    it('has a READY key with value "ready"', () => {
      expect(APPLICATION_STATUS.READY).toBe('ready')
    })

    it('has a BUILDING key with value "building"', () => {
      expect(APPLICATION_STATUS.BUILDING).toBe('building')
    })

    it('has a FAILED key with value "failed"', () => {
      expect(APPLICATION_STATUS.FAILED).toBe('failed')
    })

    it('has an ERROR key with value "error"', () => {
      expect(APPLICATION_STATUS.ERROR).toBe('error')
    })
  })

  // ── APPLICATION_STATUS_OPTIONS ──────────────────────────────────────────────

  describe('APPLICATION_STATUS_OPTIONS', () => {
    it('does not include a separate "ready" option (ready is grouped with running)', () => {
      const optionValues = APPLICATION_STATUS_OPTIONS.map(o => o.value)
      expect(optionValues).not.toContain(APPLICATION_STATUS.READY)
    })

    it('includes running, building, failed and error options', () => {
      const optionValues = APPLICATION_STATUS_OPTIONS.map(o => o.value)
      expect(optionValues).toContain(APPLICATION_STATUS.RUNNING)
      expect(optionValues).toContain(APPLICATION_STATUS.BUILDING)
      expect(optionValues).toContain(APPLICATION_STATUS.FAILED)
    })

    it('each option has value, label and color', () => {
      APPLICATION_STATUS_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('color')
      })
    })
  })

  // ── APPLICATION_STATUS_OPTIONS colors ─────────────────────────────────────

  describe('APPLICATION_STATUS_OPTIONS colors', () => {
    it('uses CSS variable for running color', () => {
      const opt = APPLICATION_STATUS_OPTIONS.find(o => o.value === APPLICATION_STATUS.RUNNING)
      expect(opt.color).toBe('var(--igz-status-running)')
    })

    it('uses CSS variable for building/deploying color', () => {
      const opt = APPLICATION_STATUS_OPTIONS.find(o => o.value === APPLICATION_STATUS.BUILDING)
      expect(opt.color).toBe('var(--igz-status-deploying)')
    })

    it('uses CSS variable for failed color', () => {
      const opt = APPLICATION_STATUS_OPTIONS.find(o => o.value === APPLICATION_STATUS.FAILED)
      expect(opt.color).toBe('var(--igz-status-failed)')
    })
  })

  // ── buildApiFilters ────────────────────────────────────────────────────────

  describe('buildApiFilters', () => {
    it('returns an empty object when no filters are active', () => {
      expect(buildApiFilters({ name: '', dates: { value: [null], isPredefined: false } })).toEqual(
        {}
      )
    })

    it('includes name with ~ prefix when provided', () => {
      const result = buildApiFilters({
        name: 'my-app',
        dates: { value: [null], isPredefined: false }
      })
      expect(result.name).toBe('~my-app')
    })

    it('does not include name when empty', () => {
      const result = buildApiFilters({ name: '', dates: { value: [null], isPredefined: false } })
      expect(result).not.toHaveProperty('name')
    })

    it('includes since for a predefined date filter', () => {
      const sinceDate = new Date('2026-05-12T15:00:00.000Z')
      const untilDate = new Date('2026-05-13T15:00:00.000Z')
      const result = buildApiFilters({
        name: '',
        dates: makeDateFilter([sinceDate, untilDate], true)
      })
      expect(result.since).toBe('2026-05-12T15:00:00.000Z')
    })

    it('does not include until for predefined date filters', () => {
      const sinceDate = new Date('2026-05-12T15:00:00.000Z')
      const untilDate = new Date('2026-05-13T15:00:00.000Z')
      const result = buildApiFilters({
        name: '',
        dates: makeDateFilter([sinceDate, untilDate], true)
      })
      expect(result).not.toHaveProperty('until')
    })

    it('includes both since and until for custom range', () => {
      const sinceDate = new Date('2026-01-01T00:00:00.000Z')
      const untilDate = new Date('2026-01-02T00:00:00.000Z')
      const result = buildApiFilters({
        name: '',
        dates: makeDateFilter([sinceDate, untilDate], false)
      })
      expect(result.since).toBe('2026-01-01T00:00:00.000Z')
      expect(result.until).toBe('2026-01-02T00:00:00.000Z')
    })

    it('does not include since when date value is null', () => {
      const result = buildApiFilters({ name: '', dates: { value: [null], isPredefined: false } })
      expect(result).not.toHaveProperty('since')
    })

    it('includes both name and since when both are set', () => {
      const sinceDate = new Date('2026-05-12T15:00:00.000Z')
      const result = buildApiFilters({
        name: 'app',
        dates: makeDateFilter([sinceDate], true)
      })
      expect(result.name).toBe('~app')
      expect(result.since).toBe('2026-05-12T15:00:00.000Z')
    })

    it('maps running status to ready for the API', () => {
      const result = buildApiFilters({
        name: '',
        dates: { value: [null], isPredefined: false },
        state: ['running']
      })
      expect(result.state).toEqual(['ready'])
    })

    it('excludes "all" from status filter', () => {
      const result = buildApiFilters({
        name: '',
        dates: { value: [null], isPredefined: false },
        state: ['all', 'building']
      })
      expect(result.state).toEqual(['building'])
    })
  })

  // ── filterApplications ─────────────────────────────────────────────────────

  describe('filterApplications', () => {
    const apps = [makeApp('running'), makeApp('failed'), makeApp('building'), makeApp('error')]

    it('returns all apps when status filter is "all"', () => {
      expect(filterApplications(apps, { state: ['all'] })).toHaveLength(4)
    })

    it('returns all apps when status filter is empty', () => {
      expect(filterApplications(apps, { state: [] })).toHaveLength(4)
    })

    it('filters by a single status', () => {
      const result = filterApplications(apps, { state: ['running'] })
      expect(result).toHaveLength(1)
      expect(result[0].state.value).toBe('running')
    })

    it('filters by multiple statuses', () => {
      const result = filterApplications(apps, { state: ['running', 'failed'] })
      expect(result).toHaveLength(2)
    })

    it('returns no apps when the selected status matches nothing', () => {
      const result = filterApplications(apps, { state: ['ready'] })
      expect(result).toHaveLength(0)
    })

    it('handles undefined status gracefully (treats as empty)', () => {
      const result = filterApplications(apps, { state: undefined })
      expect(result).toHaveLength(4)
    })

    it('returns empty array for empty applications list', () => {
      expect(filterApplications([], { state: ['running'] })).toHaveLength(0)
    })
  })
})

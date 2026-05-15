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

import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_OPTIONS,
  TIME_FILTER_CUSTOM_VALUE
} from './applications.constants'
import { buildApiFilters, buildFilterPopoverSchema, filterApplications } from './applicationsPage.util'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../utils/datePicker.util', () => ({
  ANY_TIME_DATE_OPTION: 'anyTime',
  CUSTOM_RANGE_DATE_OPTION: 'customRange',
  datePickerPastOptions: [
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
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeApp = (stateValue, owner = '') => ({
  state: { value: stateValue },
  labels: { owner }
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
      expect(buildApiFilters({ name: '', time: 'anyTime' })).toEqual({})
    })

    it('includes name when provided', () => {
      const result = buildApiFilters({ name: 'my-app', time: 'anyTime' })
      expect(result.name).toBe('my-app')
    })

    it('does not include name when empty', () => {
      const result = buildApiFilters({ name: '', time: 'anyTime' })
      expect(result).not.toHaveProperty('name')
    })

    it('includes since for a predefined time filter', () => {
      const result = buildApiFilters({ name: '', time: 'past24hours' })
      expect(result.since).toBe('2026-05-12T15:00:00.000Z')
    })

    it('does not include since for anyTime', () => {
      const result = buildApiFilters({ name: '', time: 'anyTime' })
      expect(result).not.toHaveProperty('since')
    })

    it('uses customSince when time is "custom"', () => {
      const result = buildApiFilters({
        name: '',
        time: TIME_FILTER_CUSTOM_VALUE,
        customSince: '2026-01-01T00:00:00.000Z'
      })
      expect(result.since).toBe('2026-01-01T00:00:00.000Z')
    })

    it('does not include since when time is "custom" but customSince is empty', () => {
      const result = buildApiFilters({
        name: '',
        time: TIME_FILTER_CUSTOM_VALUE,
        customSince: ''
      })
      expect(result).not.toHaveProperty('since')
    })

    it('includes both name and since when both are set', () => {
      const result = buildApiFilters({ name: 'app', time: 'past24hours' })
      expect(result.name).toBe('app')
      expect(result.since).toBe('2026-05-12T15:00:00.000Z')
    })
  })

  // ── filterApplications ─────────────────────────────────────────────────────

  describe('filterApplications', () => {
    // Note: the reducer maps 'ready' → 'running' before data reaches the store,
    // so 'ready' never appears as state.value in real app data.
    const apps = [
      makeApp('running', 'alice'),
      makeApp('failed', 'bob'),
      makeApp('building', 'alice'),
      makeApp('error', 'carol')
    ]

    it('returns all apps when status and owner are empty', () => {
      expect(filterApplications(apps, { status: [], owner: '' })).toHaveLength(4)
    })

    it('filters by a single status', () => {
      const result = filterApplications(apps, { status: ['running'], owner: '' })
      expect(result).toHaveLength(1)
      expect(result[0].state.value).toBe('running')
    })

    it('filters by multiple statuses', () => {
      const result = filterApplications(apps, { status: ['running', 'failed'], owner: '' })
      expect(result).toHaveLength(2)
    })

    it('returns no apps when the selected status matches nothing', () => {
      const result = filterApplications(apps, { status: ['ready'], owner: '' })
      expect(result).toHaveLength(0)
    })

    it('filters by owner (case-insensitive)', () => {
      const result = filterApplications(apps, { status: [], owner: 'ALICE' })
      expect(result).toHaveLength(2)
    })

    it('filters by partial owner match', () => {
      const result = filterApplications(apps, { status: [], owner: 'ali' })
      expect(result).toHaveLength(2)
    })

    it('combines status and owner filters', () => {
      const result = filterApplications(apps, { status: ['running'], owner: 'alice' })
      expect(result).toHaveLength(1)
      expect(result[0].state.value).toBe('running')
    })

    it('returns empty array when nothing matches combined filters', () => {
      const result = filterApplications(apps, { status: ['failed'], owner: 'alice' })
      expect(result).toHaveLength(0)
    })

    it('handles undefined status gracefully (treats as empty)', () => {
      const result = filterApplications(apps, { status: undefined, owner: '' })
      expect(result).toHaveLength(4)
    })

    it('returns empty array for empty applications list', () => {
      expect(filterApplications([], { status: ['running'], owner: '' })).toHaveLength(0)
    })
  })

  // ── buildFilterPopoverSchema ───────────────────────────────────────────────

  describe('buildFilterPopoverSchema', () => {
    it('returns a schema with status and owner fields', () => {
      const schema = buildFilterPopoverSchema('', [])
      expect(schema).toHaveProperty('status')
      expect(schema).toHaveProperty('owner')
    })

    it('status field has kind multi-select', () => {
      const { status } = buildFilterPopoverSchema('', [])
      expect(status.kind).toBe('multi-select')
    })

    it('owner field has kind text', () => {
      const { owner } = buildFilterPopoverSchema('', [])
      expect(owner.kind).toBe('text')
    })

    it('populates status defaultValue from currentStatus', () => {
      const { status } = buildFilterPopoverSchema('', ['running', 'failed'])
      expect(status.defaultValue).toEqual(['running', 'failed'])
    })

    it('populates owner defaultValue from currentOwner', () => {
      const { owner } = buildFilterPopoverSchema('alice', [])
      expect(owner.defaultValue).toBe('alice')
    })

    it('defaults status to empty array when currentStatus is not an array', () => {
      const { status } = buildFilterPopoverSchema('', null)
      expect(status.defaultValue).toEqual([])
    })

    it('defaults owner to empty string when currentOwner is undefined', () => {
      const { owner } = buildFilterPopoverSchema(undefined, [])
      expect(owner.defaultValue).toBe('')
    })

    it('includes the full list of status options', () => {
      const { status } = buildFilterPopoverSchema('', [])
      expect(status.options).toHaveLength(APPLICATION_STATUS_OPTIONS.length)
    })
  })
})

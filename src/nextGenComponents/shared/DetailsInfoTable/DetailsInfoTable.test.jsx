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
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import DetailsInfoTable from './DetailsInfoTable'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('igz-controls/nextGenComponents', () => ({
  Separator: () => <hr data-testid="separator" />
}))

// ── Test data ─────────────────────────────────────────────────────────────────

const SAMPLE_ITEMS = [
  { label: 'Name', value: 'app-alpha', testId: 'info-name' },
  { label: 'Description', value: 'A sample application' },
  { label: 'Owner', value: 'alice' },
  { label: 'Hidden Field', value: 'should not appear', hidden: true }
]

const ITEMS_WITH_NULL_VALUE = [
  { label: 'Name', value: 'app-alpha' },
  { label: 'Description', value: null }
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderInfoTable = (items = SAMPLE_ITEMS) => render(<DetailsInfoTable items={items} />)

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('DetailsInfoTable', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('rendering', () => {
    it('renders the table container', () => {
      renderInfoTable()
      expect(screen.getByTestId('details-info-table')).toBeInTheDocument()
    })

    it('renders visible items only', () => {
      renderInfoTable()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Owner')).toBeInTheDocument()
      expect(screen.queryByText('Hidden Field')).not.toBeInTheDocument()
    })

    it('renders item values', () => {
      renderInfoTable()
      expect(screen.getByText('app-alpha')).toBeInTheDocument()
      expect(screen.getByText('A sample application')).toBeInTheDocument()
      expect(screen.getByText('alice')).toBeInTheDocument()
    })

    it('renders separators between visible items', () => {
      renderInfoTable()
      const separators = screen.getAllByTestId('separator')
      const visibleItemCount = SAMPLE_ITEMS.filter(i => !i.hidden).length
      expect(separators).toHaveLength(visibleItemCount - 1)
    })

    it('uses custom testId when provided', () => {
      renderInfoTable()
      expect(screen.getByTestId('info-name')).toBeInTheDocument()
    })

    it('renders placeholder for null values', () => {
      renderInfoTable(ITEMS_WITH_NULL_VALUE)
      expect(screen.getByText('-')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('returns null when all items are hidden', () => {
      const { container } = render(
        <DetailsInfoTable items={[{ label: 'X', value: 'Y', hidden: true }]} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null for an empty items array', () => {
      const { container } = render(<DetailsInfoTable items={[]} />)
      expect(container.firstChild).toBeNull()
    })
  })
})

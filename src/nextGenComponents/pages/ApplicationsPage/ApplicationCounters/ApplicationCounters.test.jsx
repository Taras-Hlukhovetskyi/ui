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
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'

import ApplicationCounters from './ApplicationCounters'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('igz-controls/nextGenComponents', () => ({
  StatsCard: ({ children, className }) => (
    <div data-testid="stats-card" className={className}>
      {children}
    </div>
  )
}))

// ── Store factory ─────────────────────────────────────────────────────────────

const makeStore = (applicationsStore) =>
  configureStore({
    reducer: { applicationsStore: () => applicationsStore }
  })

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_SUMMARY = { total: 12, running: 7, failed: 3, building: 2 }

const renderCounters = (storeOverrides = {}) => {
  const storeState = {
    loading: false,
    summary: DEFAULT_SUMMARY,
    ...storeOverrides
  }
  const store = makeStore(storeState)
  return render(
    <Provider store={store}>
      <ApplicationCounters />
    </Provider>
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ApplicationCounters', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders two stats cards', () => {
      renderCounters()
      expect(screen.getAllByTestId('stats-card')).toHaveLength(2)
    })

    it('renders the total applications count', () => {
      renderCounters()
      expect(screen.getByText('12')).toBeInTheDocument()
    })

    it('renders the running count', () => {
      renderCounters()
      expect(screen.getByText('7')).toBeInTheDocument()
    })

    it('renders the failed count', () => {
      renderCounters()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('renders the building count', () => {
      renderCounters()
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('renders the "Applications" label', () => {
      renderCounters()
      expect(screen.getByText('Applications')).toBeInTheDocument()
    })

    it('renders the "Applications status" label', () => {
      renderCounters()
      expect(screen.getByText('Applications status')).toBeInTheDocument()
    })

    it('renders "Running" status label', () => {
      renderCounters()
      expect(screen.getByText('Running')).toBeInTheDocument()
    })

    it('renders "Failed" status label', () => {
      renderCounters()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('renders "Deploying" status label', () => {
      renderCounters()
      expect(screen.getByText('Deploying')).toBeInTheDocument()
    })
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows "..." placeholders while loading', () => {
      renderCounters({ loading: true })
      expect(screen.getAllByText('...')).toHaveLength(4)
    })

    it('does not show numeric counts while loading', () => {
      renderCounters({ loading: true, summary: DEFAULT_SUMMARY })
      expect(screen.queryByText('12')).not.toBeInTheDocument()
    })
  })

  // ── Zero counts ────────────────────────────────────────────────────────────

  describe('zero counts', () => {
    it('renders 0 for building when summary.building is 0', () => {
      renderCounters({ summary: { total: 10, running: 5, failed: 3, building: 0 } })
      expect(screen.getAllByText('0')).toHaveLength(1)
    })
  })
})

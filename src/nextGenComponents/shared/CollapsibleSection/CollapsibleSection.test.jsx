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
/* eslint-disable react/prop-types */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import CollapsibleSection from './CollapsibleSection'

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockOpen = false
let mockOnOpenChange = vi.fn()

vi.mock('igz-controls/nextGenComponents', () => ({
  Collapsible: ({ children, open, onOpenChange }) => {
    mockOpen = open
    mockOnOpenChange = onOpenChange
    return <div data-testid="collapsible" data-open={open}>{children}</div>
  },
  CollapsibleTrigger: ({ children, ...props }) => (
    <button
      {...props}
      onClick={() => mockOnOpenChange(!mockOpen)}
    >
      {children}
    </button>
  ),
  CollapsibleContent: ({ children, ...props }) => (
    mockOpen ? <div {...props}>{children}</div> : null
  )
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderCollapsible = (overrides = {}) => {
  const props = {
    title: 'Test Section',
    children: <div data-testid="section-content">Content here</div>,
    ...overrides
  }
  return render(<CollapsibleSection {...props} />)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CollapsibleSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOpen = false
  })
  afterEach(() => vi.restoreAllMocks())

  describe('rendering', () => {
    it('renders the trigger with title', () => {
      renderCollapsible()
      expect(screen.getByTestId('collapsible-trigger-Test Section')).toBeInTheDocument()
      expect(screen.getByText('Test Section')).toBeInTheDocument()
    })

    it('renders the collapsible container', () => {
      renderCollapsible()
      expect(screen.getByTestId('collapsible')).toBeInTheDocument()
    })
  })

  describe('default closed', () => {
    it('starts closed by default', () => {
      renderCollapsible()
      expect(screen.queryByTestId('section-content')).not.toBeInTheDocument()
    })

    it('opens on click', () => {
      renderCollapsible()
      const trigger = screen.getByTestId('collapsible-trigger-Test Section')
      fireEvent.click(trigger)
      expect(screen.getByTestId('section-content')).toBeInTheDocument()
    })
  })

  describe('default open', () => {
    it('starts open when defaultOpen is true', () => {
      renderCollapsible({ defaultOpen: true })
      expect(screen.getByTestId('section-content')).toBeInTheDocument()
    })
  })

  describe('toggle behavior', () => {
    it('toggles open and closed', () => {
      renderCollapsible()
      const trigger = screen.getByTestId('collapsible-trigger-Test Section')

      fireEvent.click(trigger)
      expect(screen.getByTestId('section-content')).toBeInTheDocument()

      fireEvent.click(trigger)
      expect(screen.queryByTestId('section-content')).not.toBeInTheDocument()
    })
  })
})

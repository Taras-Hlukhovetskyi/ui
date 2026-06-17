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

import FilterSelect from './FilterSelect'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('igz-controls/nextGenComponents', () => ({
  Checkbox: ({ checked, onCheckedChange, onClick, className }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onCheckedChange}
      onClick={onClick}
      className={className}
      data-testid="checkbox"
      readOnly={!onCheckedChange}
    />
  ),
  DropdownMenu: ({ children, open, onOpenChange }) => (
    <div data-testid="dropdown-menu" data-open={open} onClick={() => onOpenChange(!open)}>
      {children}
    </div>
  ),
  DropdownMenuContent: ({ children, onInteractOutside }) => (
    <div data-testid="dropdown-content" onClickCapture={onInteractOutside}>
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onSelect, className, 'data-testid': testId }) => (
    <div role="menuitem" data-testid={testId} className={className} onClick={e => onSelect?.(e)}>
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({ children, className, 'data-testid': testId }) => (
    <button data-testid={testId} className={className}>
      {children}
    </button>
  )
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'running', label: 'Running', color: '#10b981' },
  { value: 'failed', label: 'Failed', color: '#ef4444' },
  { value: 'building', label: 'Building', color: '#f59e0b' }
]

const renderSingle = (overrides = {}) => {
  const props = {
    value: '',
    onChange: vi.fn(),
    options: STATUS_OPTIONS,
    placeholder: 'All statuses',
    ...overrides
  }
  return { ...render(<FilterSelect {...props} />), props }
}

const renderMulti = (overrides = {}) => {
  const props = {
    value: [],
    onChange: vi.fn(),
    options: STATUS_OPTIONS,
    isMultiple: true,
    placeholder: 'All statuses',
    testId: 'status',
    ...overrides
  }
  return { ...render(<FilterSelect {...props} />), props }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('FilterSelect', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the trigger button', () => {
      renderSingle()
      expect(screen.getByTestId('filter-select-trigger')).toBeInTheDocument()
    })

    it('shows placeholder when no value is selected (single)', () => {
      renderSingle({ value: '' })
      expect(screen.getByTestId('filter-select-trigger')).toHaveTextContent('All statuses')
    })

    it('shows the selected option label (single)', () => {
      renderSingle({ value: 'running' })
      expect(screen.getByTestId('filter-select-trigger')).toHaveTextContent('Running')
    })

    it('renders one menu item per option (single)', () => {
      renderSingle()
      STATUS_OPTIONS.forEach(opt => {
        expect(screen.getByTestId(`filter-select-option-${opt.value}`)).toBeInTheDocument()
      })
    })

    it('uses custom testId prefix when provided', () => {
      renderSingle({ testId: 'my-filter' })
      expect(screen.getByTestId('my-filter-trigger')).toBeInTheDocument()
    })
  })

  // ── Single-select interactions ──────────────────────────────────────────────

  describe('single-select', () => {
    it('calls onChange with the selected value', () => {
      const onChange = vi.fn()
      renderSingle({ onChange })
      fireEvent.click(screen.getByTestId('filter-select-option-running'))
      expect(onChange).toHaveBeenCalledWith('running')
    })

    it('calls onChange exactly once per click', () => {
      const onChange = vi.fn()
      renderSingle({ onChange })
      fireEvent.click(screen.getByTestId('filter-select-option-failed'))
      expect(onChange).toHaveBeenCalledTimes(1)
    })
  })

  // ── Multi-select rendering ──────────────────────────────────────────────────

  describe('multi-select rendering', () => {
    it('renders an "All" toggle item', () => {
      renderMulti()
      expect(screen.getByTestId('status-option-all')).toBeInTheDocument()
    })

    it('shows placeholder when nothing selected', () => {
      renderMulti({ value: [] })
      expect(screen.getByTestId('status-trigger')).toHaveTextContent('All statuses')
    })

    it('shows comma-separated labels for 1–2 selected items', () => {
      renderMulti({ value: ['running', 'failed'] })
      expect(screen.getByTestId('status-trigger')).toHaveTextContent('Running, Failed')
    })

    it('shows "N items selected" when more than 2 are selected', () => {
      renderMulti({ value: ['running', 'failed', 'building'] })
      expect(screen.getByTestId('status-trigger')).toHaveTextContent('3 items selected')
    })

    it('renders checkboxes for each option', () => {
      renderMulti()
      expect(screen.getAllByTestId('checkbox')).toHaveLength(STATUS_OPTIONS.length + 1)
    })
  })

  // ── Multi-select interactions ───────────────────────────────────────────────

  describe('multi-select interactions', () => {
    it('toggles an item on', () => {
      const onChange = vi.fn()
      renderMulti({ value: [], onChange })
      fireEvent.click(screen.getByTestId('status-option-running'))
      expect(onChange).toHaveBeenCalledWith(['running'])
    })

    it('toggles an item off when already selected', () => {
      const onChange = vi.fn()
      renderMulti({ value: ['running'], onChange })
      fireEvent.click(screen.getByTestId('status-option-running'))
      expect(onChange).toHaveBeenCalledWith([])
    })

    it('selects all items when "All" is clicked and nothing selected', () => {
      const onChange = vi.fn()
      renderMulti({ value: [], onChange })
      fireEvent.click(screen.getByTestId('status-option-all'))
      expect(onChange).toHaveBeenCalledWith(STATUS_OPTIONS.map(o => o.value))
    })

    it('deselects all items when "All" is clicked and everything is selected', () => {
      const onChange = vi.fn()
      renderMulti({ value: STATUS_OPTIONS.map(o => o.value), onChange })
      fireEvent.click(screen.getByTestId('status-option-all'))
      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  // ── Default props ──────────────────────────────────────────────────────────

  describe('default props', () => {
    it('renders without throwing when optional props are omitted', () => {
      expect(() =>
        render(<FilterSelect value="" onChange={vi.fn()} options={STATUS_OPTIONS} />)
      ).not.toThrow()
    })
  })
})

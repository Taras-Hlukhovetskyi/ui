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

import Applications from './Applications'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
const mockDispatch = vi.fn(() => ({ unwrap: () => Promise.resolve(null) }))
const mockSetSearchParams = vi.fn()

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useOutletContext: () => ({
    applications: SAMPLE_APPLICATIONS,
    paginatedApplications: SAMPLE_APPLICATIONS,
    paginationConfigRef: { current: {} },
    searchParams: new URLSearchParams(),
    setSearchParams: mockSetSearchParams,
    setIsDetailsReady: vi.fn()
  }),
  useParams: () => ({ projectName: 'my-project' }),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), mockSetSearchParams]
}))

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: vi.fn(selector => selector({ applicationsStore: { applications: SAMPLE_APPLICATIONS, loading: false } }))
}))

vi.mock('igz-controls/nextGenComponents', () => ({
  DataTable: ({ data, columns }) => (
    <table data-testid="data-table">
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} data-testid="table-row">
            {columns.map(col => (
              <td key={col.id ?? col.accessorKey} data-testid={`cell-${col.id ?? col.accessorKey}`}>
                {typeof col.cell === 'function'
                  ? col.cell({ row: { original: row } })
                  : row[col.accessorKey]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  Tooltip: ({ children }) => <>{children}</>,
  TooltipTrigger: ({ children }) => <>{children}</>,
  TooltipContent: ({ children }) => (
    <div data-testid="tooltip-content">{children}</div>
  )
}))

vi.mock('../../../../common/Pagination/Pagination', () => ({
  default: () => <div data-testid="pagination" />
}))

vi.mock('../../../shared/UrlCell', () => ({
  default: ({ items }) => (
    <div data-testid="url-cell">{items.map(i => i.url).join(', ')}</div>
  ),
  buildUrlItems: (external = [], internal = []) => [
    ...external.map(url => ({ url, isExternal: true })),
    ...internal.map(url => ({ url, isExternal: false }))
  ]
}))

vi.mock('../ApplicationDetails/ApplicationDetails', () => ({
  default: ({ application, onClose }) => (
    <div data-testid="application-details">
      <span data-testid="details-app-name">{application.name}</span>
      <button data-testid="details-close" onClick={onClose}>Close</button>
    </div>
  )
}))

vi.mock('../../../../reducers/appReducer', () => ({
  toggleYaml: vi.fn(data => ({ type: 'toggleYaml', payload: data }))
}))

vi.mock('../../../../reducers/functionReducer', () => ({
  fetchFunction: vi.fn(() => ({ type: 'fetchFunction' }))
}))

vi.mock('../applicationsPage.util', () => ({
  checkForSelectedApplication: vi.fn()
}))

// ── Test data ─────────────────────────────────────────────────────────────────

const SAMPLE_APPLICATIONS = [
  {
    name: 'app-alpha',
    hash: 'abc123',
    tag: 'latest',
    state: { value: 'running', label: 'Running', className: 'state-running-nuclioFunctions' },
    external_invocation_urls: ['host-a.example.com:8080'],
    internal_invocation_urls: [],
    updated: '2026-05-10T12:00:00.000Z',
    labels: { owner: 'alice' }
  },
  {
    name: 'app-beta',
    hash: 'def456',
    tag: '',
    state: { value: 'failed', label: 'Error', className: 'state-failed-nuclioFunctions' },
    external_invocation_urls: [],
    internal_invocation_urls: [],
    updated: null,
    labels: {}
  }
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderApplications = () => render(<Applications />)

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Applications', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the data table', () => {
      renderApplications()
      expect(screen.getByTestId('data-table')).toBeInTheDocument()
    })

    it('renders one row per application', () => {
      renderApplications()
      expect(screen.getAllByTestId('table-row')).toHaveLength(SAMPLE_APPLICATIONS.length)
    })

    it('renders "All Applications" heading', () => {
      renderApplications()
      expect(screen.getByText('All Applications')).toBeInTheDocument()
    })

    it('renders the pagination component', () => {
      renderApplications()
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })
  })

  // ── Name cell ──────────────────────────────────────────────────────────────

  describe('name cell', () => {
    it('renders application names as links', () => {
      renderApplications()
      expect(screen.getByText('app-alpha')).toBeInTheDocument()
      expect(screen.getByText('app-beta')).toBeInTheDocument()
    })

    it('links to the application detail page with tag and hash identifier', () => {
      renderApplications()
      const link = screen.getByText('app-alpha').closest('a')
      expect(link).toHaveAttribute(
        'href',
        '/projects/my-project/applications/app-alpha/:latest@abc123/overview'
      )
    })

    it('links with hash-only identifier when tag is empty', () => {
      renderApplications()
      const link = screen.getByText('app-beta').closest('a')
      expect(link).toHaveAttribute(
        'href',
        '/projects/my-project/applications/app-beta/@def456/overview'
      )
    })

    it('renders a status dot for each row', () => {
      renderApplications()
      expect(screen.getAllByTestId('status-dot')).toHaveLength(SAMPLE_APPLICATIONS.length)
    })
  })

  // ── Updated cell ───────────────────────────────────────────────────────────

  describe('updated cell', () => {
    it('renders a formatted date when updated is provided', () => {
      renderApplications()
      expect(screen.getByText(/May 10, 2026/)).toBeInTheDocument()
    })

    it('renders "N/A" in the updated cell when updated is null', () => {
      renderApplications()
      const updatedCell = screen.getAllByTestId('cell-updated')[1]
      expect(updatedCell).toHaveTextContent('N/A')
    })
  })

  // ── Owner cell ─────────────────────────────────────────────────────────────

  describe('owner cell', () => {
    it('renders the owner label when present', () => {
      renderApplications()
      expect(screen.getByText('alice')).toBeInTheDocument()
    })
  })

  // ── Status dot class ───────────────────────────────────────────────────────

  describe('status dot class', () => {
    it('applies the nuclioFunctions state className for the running app', () => {
      renderApplications()
      const dots = screen.getAllByTestId('status-dot')
      expect(dots[0]).toHaveClass('state-running-nuclioFunctions')
    })

    it('applies the nuclioFunctions state className for the failed app', () => {
      renderApplications()
      const dots = screen.getAllByTestId('status-dot')
      expect(dots[1]).toHaveClass('state-failed-nuclioFunctions')
    })

    it('renders dots as <i> elements styled by main.scss state classes', () => {
      renderApplications()
      const dots = screen.getAllByTestId('status-dot')
      dots.forEach(dot => expect(dot.tagName).toBe('I'))
    })
  })

  // ── Status tooltip ─────────────────────────────────────────────────────────

  describe('status tooltip', () => {
    it('renders the state label as tooltip content for the running app', () => {
      renderApplications()
      const tooltipContents = screen.getAllByTestId('tooltip-content')
      const labels = tooltipContents.map(el => el.textContent)
      expect(labels).toContain('Running')
    })

    it('renders the state label as tooltip content for the failed app', () => {
      renderApplications()
      const tooltipContents = screen.getAllByTestId('tooltip-content')
      const labels = tooltipContents.map(el => el.textContent)
      expect(labels).toContain('Error')
    })
  })

  // ── Help icon tooltip ──────────────────────────────────────────────────────

  describe('help icon tooltip', () => {
    it('renders the help icon', () => {
      renderApplications()
      expect(screen.getByTestId('help-icon')).toBeInTheDocument()
    })

    it('renders the help tooltip description text', () => {
      renderApplications()
      const tooltipContents = screen.getAllByTestId('tooltip-content')
      const descriptions = tooltipContents.map(el => el.textContent)
      expect(descriptions).toContain('List of all deployed applications in the project')
    })
  })
})

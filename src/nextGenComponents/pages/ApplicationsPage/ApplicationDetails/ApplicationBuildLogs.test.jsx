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
import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import ApplicationBuildLogs from './ApplicationBuildLogs'
import {
  BUILD_LOGS_POLLING_INTERVAL_MS,
  COPY_RESET_TIMEOUT_MS,
  LOGS_SECTION_KEY
} from './applicationDetails.constants'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockDispatch = vi.fn()

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ projectName: 'my-project' })
}))

vi.mock('../../../../reducers/functionReducer', () => ({
  fetchFunctionLogs: vi.fn(params => ({ type: 'fetchFunctionLogs', ...params })),
  fetchFunctionNuclioLogs: vi.fn(params => ({ type: 'fetchFunctionNuclioLogs', ...params }))
}))

vi.mock('igz-controls/utils/notification.util', () => ({
  showErrorNotification: vi.fn()
}))

vi.mock('igz-controls/nextGenComponents', () => ({
  Loader: function MockLoader(props) {
    return (
      <div
        data-testid={props['data-testid'] || 'loader'}
        role="status"
        aria-label={props['aria-label'] || 'Loading'}
      />
    )
  }
}))

vi.mock('../../../shared/LogsBlock/LogsBlock', () => ({
  default: ({ logs }) => (
    <div data-testid="logs-block">
      {typeof logs === 'string' ? logs : JSON.stringify(logs ?? null)}
    </div>
  )
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const SAMPLE_APPLICATION = { name: 'test-app', tag: 'latest' }

const makeDispatchResponse = ({ data, headers = {} } = {}) => {
  const result = { data, headers }
  const unwrap = vi.fn().mockResolvedValue(result)
  return Object.assign(Promise.resolve(result), { unwrap })
}

const renderComponent = (overrides = {}) => {
  const props = { application: SAMPLE_APPLICATION, ...overrides }
  return { ...render(<ApplicationBuildLogs {...props} />), props }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ApplicationBuildLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.clearAllTimers()

    mockDispatch.mockImplementation(() => makeDispatchResponse({ data: '', headers: {} }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders the build logs container', async () => {
      await act(async () => renderComponent())
      expect(screen.getByTestId('application-build-logs')).toBeInTheDocument()
    })

    it('renders the Application section', async () => {
      await act(async () => renderComponent())
      expect(
        screen.getByTestId(`build-logs-section-${LOGS_SECTION_KEY.APPLICATION}`)
      ).toBeInTheDocument()
    })

    it('renders the Function section', async () => {
      await act(async () => renderComponent())
      expect(
        screen.getByTestId(`build-logs-section-${LOGS_SECTION_KEY.FUNCTION}`)
      ).toBeInTheDocument()
    })

    it('renders two LogsBlock components', async () => {
      await act(async () => renderComponent())
      expect(screen.getAllByTestId('logs-block')).toHaveLength(2)
    })

    it('renders copy buttons for both sections', async () => {
      await act(async () => renderComponent())
      expect(screen.getByTestId(`copy-logs-${LOGS_SECTION_KEY.APPLICATION}`)).toBeInTheDocument()
      expect(screen.getByTestId(`copy-logs-${LOGS_SECTION_KEY.FUNCTION}`)).toBeInTheDocument()
    })
  })

  describe('data fetching', () => {
    it('dispatches fetchFunctionLogs on mount', async () => {
      await act(async () => renderComponent())
      const { fetchFunctionLogs } = await import('../../../../reducers/functionReducer')
      expect(fetchFunctionLogs).toHaveBeenCalledWith({
        project: 'my-project',
        name: SAMPLE_APPLICATION.name,
        tag: SAMPLE_APPLICATION.tag
      })
    })

    it('dispatches fetchFunctionNuclioLogs on mount', async () => {
      await act(async () => renderComponent())
      const { fetchFunctionNuclioLogs } = await import('../../../../reducers/functionReducer')
      expect(fetchFunctionNuclioLogs).toHaveBeenCalledWith({
        project: 'my-project',
        name: SAMPLE_APPLICATION.name,
        tag: SAMPLE_APPLICATION.tag
      })
    })

    it('displays application logs returned from the API', async () => {
      mockDispatch.mockImplementation(action =>
        action?.type === 'fetchFunctionLogs'
          ? makeDispatchResponse({ data: 'Build started...', headers: {} })
          : makeDispatchResponse({ data: { status: { logs: [] } }, headers: {} })
      )

      await act(async () => renderComponent())
      expect(screen.getAllByTestId('logs-block')[0]).toHaveTextContent('Build started...')
    })

    it('displays structured function logs returned from the API', async () => {
      const sampleLogs = [{ level: 'info', message: 'Deploying', time: 1000, name: 'nuclio' }]

      mockDispatch.mockImplementation(action =>
        action?.type === 'fetchFunctionNuclioLogs'
          ? makeDispatchResponse({ data: { status: { logs: sampleLogs } }, headers: {} })
          : makeDispatchResponse({ data: '', headers: {} })
      )

      await act(async () => renderComponent())
      expect(screen.getAllByTestId('logs-block')[1]).toHaveTextContent('"Deploying"')
    })
  })

  describe('loading state', () => {
    it('hides the loader in both sections after a non-transient fetch completes', async () => {
      await act(async () => renderComponent())

      expect(
        screen.queryByTestId(`logs-loading-${LOGS_SECTION_KEY.APPLICATION}`)
      ).not.toBeInTheDocument()
      expect(
        screen.queryByTestId(`logs-loading-${LOGS_SECTION_KEY.FUNCTION}`)
      ).not.toBeInTheDocument()
    })

    it('keeps the loader visible while the function status is transient', async () => {
      mockDispatch.mockImplementation(() =>
        makeDispatchResponse({
          data: 'building...',
          headers: { 'x-mlrun-function-status': 'running' }
        })
      )

      await act(async () => renderComponent())

      expect(screen.getByTestId(`logs-loading-${LOGS_SECTION_KEY.APPLICATION}`)).toBeInTheDocument()
      expect(screen.getByTestId(`logs-loading-${LOGS_SECTION_KEY.FUNCTION}`)).toBeInTheDocument()
    })
  })

  describe('polling', () => {
    it('polls again when the function status header indicates a transient state', async () => {
      const { fetchFunctionLogs } = await import('../../../../reducers/functionReducer')

      mockDispatch.mockImplementation(() =>
        makeDispatchResponse({
          data: 'building...',
          headers: { 'x-mlrun-function-status': 'running' }
        })
      )

      await act(async () => renderComponent())
      const callCountAfterMount = fetchFunctionLogs.mock.calls.length

      await act(async () => {
        vi.advanceTimersByTime(BUILD_LOGS_POLLING_INTERVAL_MS)
      })

      expect(fetchFunctionLogs.mock.calls.length).toBeGreaterThan(callCountAfterMount)
    })

    it('does not poll when the function status is not transient', async () => {
      const { fetchFunctionLogs } = await import('../../../../reducers/functionReducer')

      mockDispatch.mockImplementation(() => makeDispatchResponse({ data: 'done', headers: {} }))

      await act(async () => renderComponent())
      const callCountAfterMount = fetchFunctionLogs.mock.calls.length

      await act(async () => {
        vi.advanceTimersByTime(BUILD_LOGS_POLLING_INTERVAL_MS * 2)
      })

      expect(fetchFunctionLogs.mock.calls.length).toBe(callCountAfterMount)
    })

    it('clears polling timers on unmount', async () => {
      mockDispatch.mockImplementation(() =>
        makeDispatchResponse({
          data: 'building...',
          headers: { 'x-mlrun-function-status': 'running' }
        })
      )

      const { unmount } = await act(async () => renderComponent())
      const { fetchFunctionLogs } = await import('../../../../reducers/functionReducer')

      unmount()
      const callCountAfterUnmount = fetchFunctionLogs.mock.calls.length

      await act(async () => {
        vi.advanceTimersByTime(BUILD_LOGS_POLLING_INTERVAL_MS * 3)
      })

      expect(fetchFunctionLogs.mock.calls.length).toBe(callCountAfterUnmount)
    })
  })

  describe('copy to clipboard', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true
      })
    })

    it('calls clipboard.writeText with the application logs text', async () => {
      mockDispatch.mockImplementation(() =>
        makeDispatchResponse({ data: 'app log text', headers: {} })
      )

      await act(async () => renderComponent())

      await act(async () => {
        fireEvent.click(screen.getByTestId(`copy-logs-${LOGS_SECTION_KEY.APPLICATION}`))
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('app log text')
    })

    it('calls clipboard.writeText with formatted function logs text', async () => {
      const logTime = 1_000_000_000_000
      const sampleLogs = [{ level: 'info', message: 'Deploying', time: logTime }]

      mockDispatch.mockImplementation(action =>
        action?.type === 'fetchFunctionNuclioLogs'
          ? makeDispatchResponse({ data: { status: { logs: sampleLogs } }, headers: {} })
          : makeDispatchResponse({ data: '', headers: {} })
      )

      await act(async () => renderComponent())

      await act(async () => {
        fireEvent.click(screen.getByTestId(`copy-logs-${LOGS_SECTION_KEY.FUNCTION}`))
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('INFO Deploying')
      )
    })

    it('shows the check icon after copying and reverts to copy icon after timeout', async () => {
      await act(async () => renderComponent())

      expect(screen.getByTestId(`copy-icon-${LOGS_SECTION_KEY.APPLICATION}`)).toBeInTheDocument()
      expect(
        screen.queryByTestId(`check-icon-${LOGS_SECTION_KEY.APPLICATION}`)
      ).not.toBeInTheDocument()

      await act(async () => {
        fireEvent.click(screen.getByTestId(`copy-logs-${LOGS_SECTION_KEY.APPLICATION}`))
      })

      expect(screen.getByTestId(`check-icon-${LOGS_SECTION_KEY.APPLICATION}`)).toBeInTheDocument()
      expect(
        screen.queryByTestId(`copy-icon-${LOGS_SECTION_KEY.APPLICATION}`)
      ).not.toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(COPY_RESET_TIMEOUT_MS)
      })

      expect(
        screen.queryByTestId(`check-icon-${LOGS_SECTION_KEY.APPLICATION}`)
      ).not.toBeInTheDocument()
      expect(screen.getByTestId(`copy-icon-${LOGS_SECTION_KEY.APPLICATION}`)).toBeInTheDocument()
    })

    it('only marks the clicked section as copied, not the other', async () => {
      await act(async () => renderComponent())

      await act(async () => {
        fireEvent.click(screen.getByTestId(`copy-logs-${LOGS_SECTION_KEY.APPLICATION}`))
      })

      expect(screen.getByTestId(`check-icon-${LOGS_SECTION_KEY.APPLICATION}`)).toBeInTheDocument()
      expect(
        screen.queryByTestId(`check-icon-${LOGS_SECTION_KEY.FUNCTION}`)
      ).not.toBeInTheDocument()
      expect(screen.getByTestId(`copy-icon-${LOGS_SECTION_KEY.FUNCTION}`)).toBeInTheDocument()
    })
  })
})

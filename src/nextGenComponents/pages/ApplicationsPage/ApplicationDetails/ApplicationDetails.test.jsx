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
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import ApplicationDetails from './ApplicationDetails'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../../shared/DetailsTabs/DetailsTabs', () => ({
  default: ({ title, tabs, activeTabId, onTabChange, onClose, actionsMenu }) => (
    <div data-testid="details-tabs">
      <span data-testid="details-title">{title}</span>
      <span data-testid="details-active-tab">{activeTabId}</span>
      <button data-testid="details-close" onClick={onClose}>
        Close
      </button>
      <button data-testid="details-tab-change" onClick={() => onTabChange('configuration')}>
        Change tab
      </button>
      {tabs.map(tab => (
        <span key={tab.id} data-testid={`tab-${tab.id}`}>
          {tab.label}
        </span>
      ))}
      {actionsMenu?.map(action => (
        <button key={action.label} data-testid={`action-${action.label}`} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  )
}))

vi.mock('./Overview/ApplicationOverview', () => ({
  default: ({ application }) => <div data-testid="application-overview">{application.name}</div>
}))

vi.mock('./Configuration/ApplicationConfiguration', () => ({
  default: ({ application }) => (
    <div data-testid="application-configuration">{application.name}</div>
  )
}))

vi.mock('./BuildLogs/ApplicationBuildLogs', () => ({
  default: ({ application }) => <div data-testid="application-build-logs">{application.name}</div>
}))

vi.mock('./ApiGateways/ApplicationApiGateways', () => ({
  default: ({ application }) => <div data-testid="application-api-gateways">{application.name}</div>
}))

vi.mock('../../../shared/YamlModal/YamlModal', () => ({
  default: ({ open }) => (open ? <div data-testid="yaml-modal" /> : null)
}))

// ── Test data ─────────────────────────────────────────────────────────────────

const SAMPLE_APPLICATION = {
  name: 'Application_1',
  state: { value: 'running', label: 'Running' },
  ui: { originalContent: { metadata: { name: 'Application_1' }, spec: {} } }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  application: SAMPLE_APPLICATION,
  activeTab: 'overview',
  onTabChange: vi.fn(),
  onClose: vi.fn()
}

const renderDetails = (overrides = {}) => {
  const props = { ...defaultProps, ...overrides }
  return { ...render(<ApplicationDetails {...props} />), props }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ApplicationDetails', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('rendering', () => {
    it('renders the DetailsTabs component', () => {
      renderDetails()
      expect(screen.getByTestId('details-tabs')).toBeInTheDocument()
    })

    it('passes the application name as title', () => {
      renderDetails()
      expect(screen.getByTestId('details-title')).toHaveTextContent('Application_1')
    })

    it('passes the active tab id', () => {
      renderDetails()
      expect(screen.getByTestId('details-active-tab')).toHaveTextContent('overview')
    })

    it('renders all five tabs', () => {
      renderDetails()
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument()
      expect(screen.getByTestId('tab-configuration')).toBeInTheDocument()
      expect(screen.getByTestId('tab-monitoring-endpoints')).toBeInTheDocument()
      expect(screen.getByTestId('tab-build-logs')).toBeInTheDocument()
      expect(screen.getByTestId('tab-api-gateways')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClose when close is clicked', () => {
      const { props } = renderDetails()
      fireEvent.click(screen.getByTestId('details-close'))
      expect(props.onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onTabChange with the new tab id', () => {
      const { props } = renderDetails()
      fireEvent.click(screen.getByTestId('details-tab-change'))
      expect(props.onTabChange).toHaveBeenCalledWith('configuration')
    })
  })

  describe('actions menu', () => {
    it('renders "View YAML" action', () => {
      renderDetails()
      expect(screen.getByTestId('action-View YAML')).toBeInTheDocument()
    })

    it('opens YamlModal when "View YAML" is clicked', () => {
      renderDetails()
      expect(screen.queryByTestId('yaml-modal')).not.toBeInTheDocument()
      fireEvent.click(screen.getByTestId('action-View YAML'))
      expect(screen.getByTestId('yaml-modal')).toBeInTheDocument()
    })
  })
})

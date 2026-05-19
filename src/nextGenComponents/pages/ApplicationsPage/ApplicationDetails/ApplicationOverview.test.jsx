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
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

import ApplicationOverview from './ApplicationOverview'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('igz-controls/nextGenComponents', () => ({
  Separator: () => <hr data-testid="separator" />,
  Tooltip: props => <>{props.children}</>,
  TooltipTrigger: props => <>{props.children}</>,
  TooltipContent: props => <div data-testid="tooltip-content">{props.children}</div>
}))

vi.mock('../../../shared/DetailsInfoTable/DetailsInfoTable', () => ({
  default: ({ items }) => (
    <div data-testid="details-info-table">
      {items
        .filter(i => !i.hidden)
        .map(item => (
          <div key={item.label} data-testid={`info-row-${item.label}`}>
            <span data-testid="info-label">{item.label}</span>
            <span data-testid="info-value">{item.value}</span>
          </div>
        ))}
    </div>
  )
}))

vi.mock('../../../shared/UrlItem/UrlItem', () => ({
  default: ({ url }) => (
    <a data-testid="url-item" href={url}>
      {url}
    </a>
  )
}))

// ── Test data ─────────────────────────────────────────────────────────────────

const SAMPLE_APPLICATION = {
  name: 'Application_1',
  state: { value: 'running', label: 'Running', className: 'state-running-nuclioFunctions' },
  external_invocation_urls: ['https://api-gateway.example.com/v1/project3-name'],
  internal_invocation_urls: ['tutorial-amitk-iris-streamlit-app.example.com'],
  description: 'description',
  application_image: '',
  image: '',
  build: { source: 'projects/tutorial-amitk/artifacts/streamlit-app-source.tar.gz' },
  labels: { owner: 'John Driller' },
  tag: '',
  updated: new Date('2024-10-29T06:46:10.000Z'),
  command: ['https://api-gateway.example.com/v1/project3-name'],
  args: ['app:server --bind', '0.0.0.0:8050 --workers 4'],
  ui: {
    originalContent: {
      spec: {
        command: 'streamlit run'
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const renderOverview = (application = SAMPLE_APPLICATION) =>
  render(<ApplicationOverview application={application} />)

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('ApplicationOverview', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  describe('rendering', () => {
    it('renders the DetailsInfoTable', () => {
      renderOverview()
      expect(screen.getByTestId('details-info-table')).toBeInTheDocument()
    })

    it('renders the Name row', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Name')).toBeInTheDocument()
    })

    it('renders the Description row', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Description')).toBeInTheDocument()
    })

    it('renders the Source row', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Source')).toBeInTheDocument()
    })

    it('renders the Updated row', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Updated')).toBeInTheDocument()
    })

    it('renders the Commands row', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Commands')).toBeInTheDocument()
    })

    it('renders the Arguments row', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Arguments')).toBeInTheDocument()
    })

    it('renders Direct URLs when external URLs are present', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Direct URLs')).toBeInTheDocument()
    })

    it('renders Indirect URLs when internal URLs are present', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Indirect URLs')).toBeInTheDocument()
    })

    it('renders Internal URLs when internal URLs are present', () => {
      renderOverview()
      expect(screen.getByTestId('info-row-Internal URLs')).toBeInTheDocument()
    })
  })

  describe('hidden fields', () => {
    it('hides Direct URLs when external_invocation_urls is empty', () => {
      renderOverview({ ...SAMPLE_APPLICATION, external_invocation_urls: [] })
      expect(screen.queryByTestId('info-row-Direct URLs')).not.toBeInTheDocument()
    })

    it('hides Indirect URLs when internal_invocation_urls is empty', () => {
      renderOverview({ ...SAMPLE_APPLICATION, internal_invocation_urls: [] })
      expect(screen.queryByTestId('info-row-Indirect URLs')).not.toBeInTheDocument()
    })

    it('hides Internal URLs when internal_invocation_urls is empty', () => {
      renderOverview({ ...SAMPLE_APPLICATION, internal_invocation_urls: [] })
      expect(screen.queryByTestId('info-row-Internal URLs')).not.toBeInTheDocument()
    })
  })
})

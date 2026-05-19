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

import UrlItem from './UrlItem'
import { URL_ITEM_VARIANT } from './urlItem.constants'

// ── Helpers ──────────────────────────────────────────────────────────────────

const renderUrlItem = (overrides = {}) => {
  const props = {
    url: 'example.com:8080',
    allowCopy: true,
    openInNewTab: true,
    isCopied: false,
    onCopy: vi.fn(),
    ...overrides
  }
  return { ...render(<UrlItem {...props} />), props }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UrlItem', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the url-item wrapper', () => {
      renderUrlItem()
      expect(screen.getByTestId('url-item')).toBeInTheDocument()
    })

    it('renders the link with the url text', () => {
      renderUrlItem({ url: 'host.example.com:9090' })
      expect(screen.getByTestId('url-link')).toHaveTextContent('host.example.com:9090')
    })

    it('renders the copy button when allowCopy is true', () => {
      renderUrlItem({ allowCopy: true })
      expect(screen.getByTestId('copy-button')).toBeInTheDocument()
    })

    it('does not render the copy button when allowCopy is false', () => {
      renderUrlItem({ allowCopy: false })
      expect(screen.queryByTestId('copy-button')).not.toBeInTheDocument()
    })

    it('shows the Copy icon when not yet copied', () => {
      renderUrlItem({ isCopied: false })
      expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
    })

    it('shows the Check icon when isCopied is true', () => {
      renderUrlItem({ isCopied: true })
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })
  })

  // ── Link href ──────────────────────────────────────────────────────────────

  describe('link href', () => {
    it('prepends https:// for bare hostnames when openInNewTab is true', () => {
      renderUrlItem({ url: 'host.example.com:8080', openInNewTab: true })
      expect(screen.getByTestId('url-link')).toHaveAttribute(
        'href',
        'https://host.example.com:8080'
      )
    })

    it('preserves existing https:// prefix', () => {
      renderUrlItem({ url: 'https://host.example.com/path', openInNewTab: true })
      expect(screen.getByTestId('url-link')).toHaveAttribute(
        'href',
        'https://host.example.com/path'
      )
    })

    it('preserves existing http:// prefix', () => {
      renderUrlItem({ url: 'http://internal.local/api', openInNewTab: true })
      expect(screen.getByTestId('url-link')).toHaveAttribute('href', 'http://internal.local/api')
    })

    it('uses the url as-is when openInNewTab is false', () => {
      renderUrlItem({ url: '/projects/my-project', openInNewTab: false })
      expect(screen.getByTestId('url-link')).toHaveAttribute('href', '/projects/my-project')
    })
  })

  // ── Link target ────────────────────────────────────────────────────────────

  describe('link target', () => {
    it('opens in a new tab when openInNewTab is true', () => {
      renderUrlItem({ openInNewTab: true })
      expect(screen.getByTestId('url-link')).toHaveAttribute('target', '_blank')
    })

    it('adds rel="noopener noreferrer" when openInNewTab is true', () => {
      renderUrlItem({ openInNewTab: true })
      expect(screen.getByTestId('url-link')).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not set target when openInNewTab is false', () => {
      renderUrlItem({ openInNewTab: false })
      expect(screen.getByTestId('url-link')).not.toHaveAttribute('target')
    })
  })

  // ── Copy button interaction ────────────────────────────────────────────────

  describe('copy button', () => {
    it('calls onCopy with the url when clicked', () => {
      const onCopy = vi.fn()
      renderUrlItem({ url: 'host.example.com', allowCopy: true, onCopy })
      fireEvent.click(screen.getByTestId('copy-button'))
      expect(onCopy).toHaveBeenCalledWith('host.example.com')
    })

    it('calls onCopy exactly once per click', () => {
      const onCopy = vi.fn()
      renderUrlItem({ allowCopy: true, onCopy })
      fireEvent.click(screen.getByTestId('copy-button'))
      expect(onCopy).toHaveBeenCalledTimes(1)
    })

    it('has aria-label "Copy URL" when not yet copied', () => {
      renderUrlItem({ allowCopy: true, isCopied: false })
      expect(screen.getByTestId('copy-button')).toHaveAttribute('aria-label', 'Copy URL')
    })

    it('has aria-label "Copied!" when isCopied is true', () => {
      renderUrlItem({ allowCopy: true, isCopied: true })
      expect(screen.getByTestId('copy-button')).toHaveAttribute('aria-label', 'Copied!')
    })
  })

  // ── Hover behaviour ────────────────────────────────────────────────────────

  describe('hover behaviour', () => {
    it('shows the copy button (inline-flex) when the item is hovered — default variant', () => {
      renderUrlItem({ allowCopy: true, variant: URL_ITEM_VARIANT.DEFAULT })
      fireEvent.mouseEnter(screen.getByTestId('url-item'))
      expect(screen.getByTestId('copy-button')).toHaveClass('inline-flex')
    })

    it('hides the copy button when the item is not hovered — default variant', () => {
      renderUrlItem({ allowCopy: true, variant: URL_ITEM_VARIANT.DEFAULT })
      expect(screen.getByTestId('copy-button')).toHaveClass('hidden')
    })

    it('hides the copy button again after mouse leaves — default variant', () => {
      renderUrlItem({ allowCopy: true, variant: URL_ITEM_VARIANT.DEFAULT })
      fireEvent.mouseEnter(screen.getByTestId('url-item'))
      fireEvent.mouseLeave(screen.getByTestId('url-item'))
      expect(screen.getByTestId('copy-button')).toHaveClass('hidden')
    })

    it('makes the copy button fully opaque when hovered — dark variant', () => {
      renderUrlItem({ allowCopy: true, variant: URL_ITEM_VARIANT.DARK })
      fireEvent.mouseEnter(screen.getByTestId('url-item'))
      expect(screen.getByTestId('copy-button')).toHaveClass('opacity-100')
    })

    it('makes the copy button transparent when not hovered — dark variant', () => {
      renderUrlItem({ allowCopy: true, variant: URL_ITEM_VARIANT.DARK })
      expect(screen.getByTestId('copy-button')).toHaveClass('opacity-0')
    })
  })

  // ── Variant ────────────────────────────────────────────────────────────────

  describe('variant', () => {
    it('applies the default variant without throwing', () => {
      expect(() => renderUrlItem({ variant: URL_ITEM_VARIANT.DEFAULT })).not.toThrow()
    })

    it('applies the dark variant without throwing', () => {
      expect(() => renderUrlItem({ variant: URL_ITEM_VARIANT.DARK })).not.toThrow()
    })
  })
})

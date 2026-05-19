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

let _measureCanvas = null

export const measureTextWidth = (text, font) => {
  if (typeof document === 'undefined') return 0
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas')
  const ctx = _measureCanvas.getContext('2d')
  if (!ctx) return 0
  ctx.font = font
  return ctx.measureText(text).width
}

export const calculateVisibleCount = (containerWidth, itemWidths, badgeWidth) => {
  let used = 0
  let count = 0

  for (let i = 0; i < itemWidths.length; i++) {
    const remainingAfter = itemWidths.length - (i + 1)
    const badgeReserve = remainingAfter > 0 ? badgeWidth : 0

    if (used + itemWidths[i] + badgeReserve <= containerWidth) {
      used += itemWidths[i]
      count = i + 1
    } else {
      break
    }
  }

  return Math.max(1, count)
}

export const buildUrlItems = (externalUrls = [], internalUrls = []) => [
  ...externalUrls.map(url => ({ url, allowCopy: true, openInNewTab: true })),
  ...internalUrls.map(url => ({ url }))
]

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
import { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

import UrlItem from '../UrlItem'
import { COPY_SUCCESS_DURATION_MS } from '../UrlCell/urlCell.constants'

const UrlList = ({ urls, allowCopy = false, openInNewTab = false, asPlainText = false }) => {
  const [copiedUrl, setCopiedUrl] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  const handleCopy = useCallback(url => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setCopiedUrl(null), COPY_SUCCESS_DURATION_MS)
  }, [])

  if (!urls || urls.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1" data-testid="url-list">
      {urls.map(url => (
        <UrlItem
          key={url}
          url={url}
          allowCopy={allowCopy}
          openInNewTab={openInNewTab}
          asPlainText={asPlainText}
          isCopied={copiedUrl === url}
          onCopy={handleCopy}
        />
      ))}
    </div>
  )
}

UrlList.propTypes = {
  allowCopy: PropTypes.bool,
  asPlainText: PropTypes.bool,
  openInNewTab: PropTypes.bool,
  urls: PropTypes.arrayOf(PropTypes.string)
}

export default UrlList

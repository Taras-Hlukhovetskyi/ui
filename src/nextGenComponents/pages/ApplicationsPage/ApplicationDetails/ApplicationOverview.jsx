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
import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { Tooltip, TooltipContent, TooltipTrigger } from 'igz-controls/nextGenComponents'
import { formatDatetime } from 'igz-controls/utils/datetime.util'

import DetailsInfoTable from '../../../shared/DetailsInfoTable/DetailsInfoTable'
import UrlList from '../../../shared/UrlList'
import { OVERVIEW_FIELD } from './applicationDetails.constants'

const ApplicationOverview = ({ application }) => {
  const overviewItems = useMemo(() => {
    const stateLabel = application.state?.label ?? application.state?.value ?? 'Unknown'
    const stateClassName = application.state?.className ?? 'state-unknown-function'

    return [
      {
        label: OVERVIEW_FIELD.NAME,
        value: (
          <div className="flex items-center gap-2">
            <span>{application.name}</span>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <i
                  className={`${stateClassName} cursor-default`}
                  data-testid={`overview-status-dot-${stateLabel.toLowerCase()}`}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                data-testid={`overview-status-tooltip-${stateLabel.toLowerCase()}`}
              >
                {stateLabel}
              </TooltipContent>
            </Tooltip>
          </div>
        )
      },
      {
        label: OVERVIEW_FIELD.DIRECT_URLS,
        value: <UrlList urls={application.external_invocation_urls} allowCopy openInNewTab />,
        hidden: !application.external_invocation_urls?.length
      },
      {
        label: OVERVIEW_FIELD.INDIRECT_URLS,
        value: <UrlList urls={application.internal_invocation_urls} />,
        hidden: !application.internal_invocation_urls?.length
      },
      {
        label: OVERVIEW_FIELD.DESCRIPTION,
        value: application.description || null
      },
      {
        label: OVERVIEW_FIELD.IMAGE,
        value: application.application_image || application.image || null
      },
      {
        label: OVERVIEW_FIELD.SOURCE,
        value: application.build?.source || null
      },
      {
        label: OVERVIEW_FIELD.OWNER,
        value: application.owner || null
      },
      {
        label: OVERVIEW_FIELD.TAG,
        value: application.tag || null
      },
      {
        label: OVERVIEW_FIELD.UPDATED,
        value: formatDatetime(application.updated, null)
      },
      {
        label: OVERVIEW_FIELD.INTERNAL_URLS,
        value: <UrlList urls={application.internal_invocation_urls} allowCopy asPlainText />,
        hidden: !application.internal_invocation_urls?.length
      },
      {
        label: OVERVIEW_FIELD.COMMANDS,
        value: application.ui?.originalContent?.spec?.command || null
      },
      {
        label: OVERVIEW_FIELD.ARGUMENTS,
        value:
          application.args?.length > 0 ? (
            <span className="whitespace-pre-wrap">{application.args.join('\n')}</span>
          ) : null
      }
    ]
  }, [application])

  return <DetailsInfoTable items={overviewItems} />
}

ApplicationOverview.propTypes = {
  application: PropTypes.shape({
    application_image: PropTypes.string,
    args: PropTypes.arrayOf(PropTypes.string),
    build: PropTypes.shape({
      source: PropTypes.string
    }),
    description: PropTypes.string,
    external_invocation_urls: PropTypes.arrayOf(PropTypes.string),
    image: PropTypes.string,
    internal_invocation_urls: PropTypes.arrayOf(PropTypes.string),
    name: PropTypes.string,
    owner: PropTypes.string,
    state: PropTypes.shape({
      className: PropTypes.string,
      label: PropTypes.string,
      value: PropTypes.string
    }),
    tag: PropTypes.string,
    ui: PropTypes.shape({
      originalContent: PropTypes.shape({
        spec: PropTypes.shape({
          command: PropTypes.string
        })
      })
    }),
    updated: PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string])
  }).isRequired
}

export default ApplicationOverview

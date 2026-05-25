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
import { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { BadgeCell } from 'igz-controls/nextGenComponents'
import { formatDatetime } from 'igz-controls/utils/datetime.util'

import DetailsPopup from '../../../../shared/DetailsPopup/DetailsPopup'
import { fetchModelEndpoint } from '../../../../../reducers/artifactsReducer'
import { DRIFT_STATUS_LABEL, DRIFT_RESULT_NO_DATA } from './monitoringEndpoints.constants'

const parseLabelsToBadges = (labels = {}) => {
  return Object.entries(labels).map(([key, value]) => ({
    key,
    value: value === '' ? undefined : String(value)
  }))
}

const InfoRow = ({ label, value, testId }) => (
  <div className="flex py-2 border-b border-[#eee] last:border-b-0" data-testid={testId}>
    <span className="w-[180px] shrink-0 text-igz-secondary text-body-sm">{label}</span>
    <span className="text-igz-primary text-body-sm min-w-0">{value}</span>
  </div>
)

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  testId: PropTypes.string,
  value: PropTypes.node
}

const EndpointDetailsPopup = ({ open, onClose, endpointUid, endpointName }) => {
  const dispatch = useDispatch()
  const { projectName } = useParams()
  const [endpoint, setEndpoint] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchEndpoint = useCallback(async () => {
    if (!endpointUid || !endpointName) return

    setIsLoading(true)
    try {
      const result = await dispatch(
        fetchModelEndpoint({ project: projectName, name: endpointName, uid: endpointUid })
      ).unwrap()
      setEndpoint(result)
    } catch {
      setEndpoint(null)
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, projectName, endpointUid, endpointName])

  useEffect(() => {
    if (open) {
      fetchEndpoint()
    } else {
      setEndpoint(null)
    }
  }, [open, fetchEndpoint])

  const driftLabel =
    DRIFT_STATUS_LABEL[endpoint?.status?.result_status ?? DRIFT_RESULT_NO_DATA] ?? 'N/A'

  const labelBadges = parseLabelsToBadges(endpoint?.metadata?.labels)

  return (
    <DetailsPopup
      open={open}
      onClose={onClose}
      title={endpointName || 'Endpoint Details'}
      isLoading={isLoading}
    >
      {endpoint && (
        <div className="flex flex-col" data-testid="endpoint-details-content">
          <InfoRow
            label="Name"
            value={endpoint.metadata?.name ?? '-'}
            testId="endpoint-detail-name"
          />
          <InfoRow
            label="Function"
            value={endpoint.spec?.function_name ?? '-'}
            testId="endpoint-detail-function"
          />
          <InfoRow
            label="Function tag"
            value={endpoint.spec?.function_tag ?? '-'}
            testId="endpoint-detail-function-tag"
          />
          <InfoRow
            label="Model class"
            value={endpoint.spec?.model_class ?? '-'}
            testId="endpoint-detail-class"
          />
          <InfoRow
            label="Model URI"
            value={endpoint.spec?.model_uri ?? '-'}
            testId="endpoint-detail-model-uri"
          />
          <InfoRow
            label="Labels"
            value={
              labelBadges.length > 0 ? (
                <BadgeCell badges={labelBadges} />
              ) : (
                '-'
              )
            }
            testId="endpoint-detail-labels"
          />
          <InfoRow
            label="First invocation"
            value={formatDatetime(endpoint.status?.first_request, '-')}
            testId="endpoint-detail-first-invocation"
          />
          <InfoRow
            label="Last invocation"
            value={formatDatetime(endpoint.status?.last_request, '-')}
            testId="endpoint-detail-last-invocation"
          />
          <InfoRow
            label="Error count"
            value={endpoint.status?.error_count ?? 0}
            testId="endpoint-detail-error-count"
          />
          <InfoRow
            label="Drift status"
            value={driftLabel}
            testId="endpoint-detail-drift-status"
          />
          <InfoRow
            label="Monitoring mode"
            value={endpoint.status?.monitoring_mode ?? '-'}
            testId="endpoint-detail-monitoring-mode"
          />
        </div>
      )}
    </DetailsPopup>
  )
}

EndpointDetailsPopup.propTypes = {
  endpointName: PropTypes.string,
  endpointUid: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
}

export default EndpointDetailsPopup

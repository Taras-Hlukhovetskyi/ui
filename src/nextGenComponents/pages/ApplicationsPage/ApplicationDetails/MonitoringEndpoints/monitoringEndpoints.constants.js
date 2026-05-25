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

export const DRIFT_RESULT_NO_DATA = -1
export const DRIFT_RESULT_NO_DRIFT = 0
export const DRIFT_RESULT_POSSIBLE_DRIFT = 1
export const DRIFT_RESULT_DRIFT_DETECTED = 2

export const DRIFT_STATUS_LABEL = {
  [DRIFT_RESULT_NO_DATA]: 'N/A',
  [DRIFT_RESULT_NO_DRIFT]: 'No drift',
  [DRIFT_RESULT_POSSIBLE_DRIFT]: 'Possible drift',
  [DRIFT_RESULT_DRIFT_DETECTED]: 'Drift detected'
}

export const MONITORING_ENDPOINTS_FILTER_CONFIG = {
  name: { initialValue: '', label: 'Name' },
  label: { initialValue: '', label: 'Label' }
}

export const MONITORING_ENDPOINTS_NO_DATA_MESSAGE = 'No monitoring endpoints found for this application'

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
import PropTypes from 'prop-types'

export const applicationShape = PropTypes.shape({
  application_image: PropTypes.string,
  build: PropTypes.object,
  description: PropTypes.string,
  env: PropTypes.array,
  image: PropTypes.string,
  labels: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  max_replicas: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min_replicas: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  nuclioFunc: PropTypes.shape({
    metadata: PropTypes.shape({
      annotations: PropTypes.object,
      labels: PropTypes.object
    }),
    spec: PropTypes.object
  }),
  preemption_mode: PropTypes.string,
  priority_class_name: PropTypes.string,
  resources: PropTypes.object,
  ui: PropTypes.shape({
    originalContent: PropTypes.shape({
      spec: PropTypes.object
    })
  }),
  volume_mounts: PropTypes.array,
  volumes: PropTypes.array
})

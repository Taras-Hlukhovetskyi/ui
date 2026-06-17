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

export const CONFIGURATION_SECTION = {
  BASIC_SETTINGS: 'basic-settings',
  RESOURCES: 'resources',
  ENVIRONMENT_VARIABLES: 'environment-variables',
  LABELS: 'labels',
  ANNOTATIONS: 'annotations',
  VOLUMES: 'volumes',
  BUILD: 'build',
  PROBES: 'probes'
}

export const CONFIGURATION_SECTIONS = [
  { id: CONFIGURATION_SECTION.BASIC_SETTINGS, label: 'Basic settings', title: 'Basic Settings' },
  { id: CONFIGURATION_SECTION.RESOURCES, label: 'Resources' },
  { id: CONFIGURATION_SECTION.ENVIRONMENT_VARIABLES, label: 'Environment Variables' },
  { id: CONFIGURATION_SECTION.LABELS, label: 'Labels' },
  { id: CONFIGURATION_SECTION.ANNOTATIONS, label: 'Annotations' },
  { id: CONFIGURATION_SECTION.VOLUMES, label: 'Volumes' },
  { id: CONFIGURATION_SECTION.BUILD, label: 'Build' },
  { id: CONFIGURATION_SECTION.PROBES, label: 'Probes' }
]

export const BASIC_SETTINGS_FIELD = {
  ENABLED: 'Enabled',
  DESCRIPTION: 'Description',
  SERVICE_ACCOUNT: 'Service Account',
  RUN_AS_USER: 'Run as user',
  RUN_AS_GROUP: 'Run as group',
  LOGGER_LEVEL: 'Logger level'
}

export const RESOURCES_FIELD = {
  RUN_ON_SPOT_NODES: 'Run on spot nodes',
  PODS_PRIORITY: 'Pods priority',
  MEMORY_REQUEST: 'Memory (request)',
  MEMORY_LIMIT: 'Memory (limit)',
  CPU_REQUEST: 'CPU (request)',
  CPU_LIMIT: 'CPU (limit)',
  GPU_LIMIT: 'GPU (limit)',
  REPLICAS_MIN: 'Replicas (Min)',
  REPLICAS_MAX: 'Replicas (Max)',
  INACTIVITY_WINDOW: 'Inactivity window',
  TARGET_CPU: 'Target CPU'
}

export const BUILD_FIELD = {
  IMAGE_NAME: 'Image name',
  BASE_IMAGE: 'Base image',
  BUILD_COMMANDS: 'Build commands',
  PULL_AT_RUNTIME: 'Pull at runtime'
}

export const ENV_VAR_TYPE = {
  VALUE: 'Value',
  SECRET: 'Secret'
}

export const PREEMPTION_MODE_LABEL = {
  prevent: 'Prevent',
  constrain: 'Constrain',
  allow: 'Allow',
  none: 'None'
}

export const KEY_TOOLTIP_TEXT =
  'Label keys are composed of an optional prefix and a name, separated by a forward slash (/) — <key prefix>/<key name>'

export const ANNOTATION_KEY_TOOLTIP_TEXT =
  'Annotation keys are composed of an optional prefix and a name, separated by a forward slash (/) — <key prefix>/<key name>'

export const DESCRIPTION_TOOLTIP_TEXT = 'The description of the application function'

export const SPOT_NODES_TOOLTIP_TEXT = 'Disallow function pods from running on Spot nodes'

export const IMAGE_NAME_TOOLTIP_TEXT =
  'The name of the container image used for the application function'

export const BASE_IMAGE_TOOLTIP_TEXT =
  'The base Docker image used to build the application function'

export const PROBE_TYPE = {
  READINESS: 'Readiness',
  LIVENESS: 'Liveness',
  STARTUP: 'Startup'
}

export const PROBE_HANDLER_TYPE = {
  HTTP: 'HTTP',
  TCP: 'TCP',
  GRPC: 'gRPC',
  EXEC: 'Exec'
}

export const PROBE_FIELD = {
  INITIAL_DELAY_SECONDS: 'Initial delay seconds',
  PERIOD_SECONDS: 'Period seconds',
  FAILURE_THRESHOLD: 'Failure threshold',
  TIMEOUT_SECONDS: 'Timeout seconds',
  HTTP_PATH: 'HTTP path',
  HTTP_PORT: 'HTTP port',
  TCP_PORT: 'TCP port',
  GRPC_PORT: 'gRPC port'
}

export const CONFIGURATION_ITEM_ID = {
  DESCRIPTION: 'description',
  RUN_ON_SPOT_NODES: 'run-on-spot-nodes',
  IMAGE_NAME: 'image-name',
  BASE_IMAGE: 'base-image'
}

export const EXPANDED_DETAIL_FIELD = {
  MOUNT_PATH: 'Mount path',
  READ_ONLY: 'Read only',
  ADDITIONAL_SETTINGS: 'Additional Settings'
}

export const VOLUME_COLUMN = {
  NAME: 'Name',
  TYPE: 'Type',
  MOUNT_PATH_PARAMS: 'Mount path & Params'
}

export const TOOLTIP_DELAY_MS = 200
export const TOOLTIP_COLLISION_PADDING = 16

export const LABEL_WIDTH = 'w-[200px]'
export const ROW_MIN_HEIGHT = 'min-h-[28px]'
export const ROW_MIN_HEIGHT_LG = 'min-h-[32px]'

export const PROBE_COLUMN = {
  NAME: 'Name',
  TYPE: 'Type'
}

export const VOLUME_COLUMN_FLEX = {
  NAME: 3,
  TYPE: 2.5,
  MOUNT_PATH_PARAMS: 4.5
}

export const PROBE_COLUMN_FLEX = {
  NAME: 1,
  TYPE: 1
}

export const VOLUME_TYPE_LABEL = {
  configMap: 'Config map',
  secret: 'Secret',
  persistentVolumeClaim: 'PVC',
  hostPath: 'Host path',
  emptyDir: 'Empty dir',
  flexVolume: 'Flex volume'
}

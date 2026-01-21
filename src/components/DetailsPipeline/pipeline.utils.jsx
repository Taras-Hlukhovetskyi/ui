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

import {
  ML_NODE_WITH_SUB_ITEMS,
  ML_QUEUE_NODE,
  ML_COMMON_NODE,
  MODEL_RUNNER_STEP_KIND,
  QUEUE_STEP_KIND,
  ERROR_STEP_KIND,
  HUB_STEP_KIND,
  ROUTER_STEP_KIND
} from '../../constants'

import RemoteStepIcon from 'igz-controls/images/remote-step-badge.svg?react'
import EventsStepIcon from 'igz-controls/images/events-step-badge.svg?react'
import ChoiceStepIcon from 'igz-controls/images/choice-step-badge.svg?react'
import BatchStepIcon from 'igz-controls/images/batch-step-badge.svg?react'
import FilterStepIcon from 'igz-controls/images/filter-step-badge.svg?react'
import CustomStepIcon from 'igz-controls/images/custom-step-badge.svg?react'
import ErrorStepIcon from 'igz-controls/images/error-step-badge.svg?react'
import HubStepIcon from 'igz-controls/images/mlrun-hub-step-badge.svg?react'
import ConnectionIcon from 'igz-controls/images/connections-icon.svg?react'
import RouterStepIcon from 'igz-controls/images/router-step-badge.svg?react'
import { mapValues } from 'lodash'

export const STEPS_TYPES = {
  MODEL_RUNNER: 'ModelRunner',
  QUEUE: 'Queue',
  ERROR_STEP: 'ErrorStep',
  HUB_STEP: 'MLRunHub',
  EXTEND: 'Extend',
  FLAT_MAP: 'FlatMap',
  FLATTEN: 'Flatten',
  MAP_WITH_STATE: 'MapWithState',
  CHOICE: 'Choice',
  CHOICE_BY_FIELD: 'ChoiceByField',
  BATCH: 'Batch',
  FOR_EACH: 'ForEach',
  FILTER: 'Filter',
  SAMPLE_WINDOW: 'SampleWindow',
  REMOTE_HTTP_STEP: 'RemoteHttpStep',
  CUSTOM_STEP: 'CustomStep',
  ROUTER_STEP: 'Router'
}

export const STEP_FIELD_TYPES = {
  CODE_BLOCK: 'codeblock',
  COPY: 'copy',
  POP_UP: 'pop-up'
}

const NODE_TYPE_DATA_BY_KIND_MAP = {
  [MODEL_RUNNER_STEP_KIND]: {
    nodeType: ML_NODE_WITH_SUB_ITEMS,
    badgeIcon: <ConnectionIcon />,
    subLabel: 'Model Runner Step',
    stepType: STEPS_TYPES.MODEL_RUNNER,
    subItemsTitle: 'Running models',
    getSubItems: data => Object.keys(data?.class_args?.monitoring_data || {}),
    getInMonitoring: data => Boolean(data?.track_models)
  },
  [ROUTER_STEP_KIND]: {
    nodeType: ML_NODE_WITH_SUB_ITEMS,
    badgeIcon: <RouterStepIcon />,
    subLabel: 'Router',
    stepType: STEPS_TYPES.ROUTER_STEP,
    subItemsTitle: 'Routes',
    getSubItems: data => Object.keys(data?.routes || {})
  },
  [QUEUE_STEP_KIND]: {
    nodeType: ML_QUEUE_NODE,
    stepType: STEPS_TYPES.QUEUE
  },
  [ERROR_STEP_KIND]: {
    nodeType: ML_COMMON_NODE,
    badgeIcon: <ErrorStepIcon />,
    stepType: STEPS_TYPES.ERROR_STEP
  },
  [HUB_STEP_KIND]: {
    nodeType: ML_COMMON_NODE,
    badgeIcon: <HubStepIcon />,
    subLabel: 'MLRun hub',
    stepType: STEPS_TYPES.HUB_STEP
  } // TODO mapping, clarify condition with BE HUB_STEP_KIND
}

const getNodeTypeDataByKind = step => {
  const kind = step?.kind
  if (!kind) return undefined

  const baseData = NODE_TYPE_DATA_BY_KIND_MAP[kind]
  if (!baseData) return undefined

  const newData = { ...baseData }

  if (baseData.getSubItems) {
    newData.subItems = baseData.getSubItems(step)
    delete newData.getSubItems
  }

  if (baseData.getInMonitoring) {
    newData.inMonitoring = baseData.getInMonitoring(step)
    delete newData.getInMonitoring
  }

  return newData
}

const nodeTypeByClassMatchers = [
  {
    regex: new RegExp(
      `(${STEPS_TYPES.EXTEND}|${STEPS_TYPES.FLAT_MAP}|${STEPS_TYPES.FLATTEN}|${STEPS_TYPES.MAP_WITH_STATE})$`
    ),
    data: { nodeType: ML_COMMON_NODE, badgeIcon: <EventsStepIcon /> }
  },
  {
    regex: new RegExp(`(${STEPS_TYPES.CHOICE}|${STEPS_TYPES.CHOICE_BY_FIELD})$`),
    data: { nodeType: ML_COMMON_NODE, badgeIcon: <ChoiceStepIcon /> }
  },
  {
    regex: new RegExp(`(${STEPS_TYPES.BATCH}|${STEPS_TYPES.FOR_EACH})$`),
    data: { nodeType: ML_COMMON_NODE, badgeIcon: <BatchStepIcon /> }
  },
  {
    regex: new RegExp(`(${STEPS_TYPES.FILTER}|${STEPS_TYPES.SAMPLE_WINDOW})$`),
    data: { nodeType: ML_COMMON_NODE, badgeIcon: <FilterStepIcon /> }
  },
  {
    regex: new RegExp(`(${STEPS_TYPES.REMOTE_HTTP_STEP})$`),
    data: { nodeType: ML_COMMON_NODE, badgeIcon: <RemoteStepIcon />, subLabel: 'Remote' }
  }
]

export const getStepsNodeData = step => {
  // first check step.kind
  const getNodeTypeDataByClass = stepClassName => {
    if (stepClassName) {
      for (const { regex, data } of nodeTypeByClassMatchers) {
        const match = stepClassName.match(regex)

        if (match) {
          const matchedSuffix = match[1]
          const newData = { ...data }

          if (matchedSuffix && !newData.subLabel) {
            if (matchedSuffix === STEPS_TYPES.CHOICE_BY_FIELD && step.class_args?.field_name) {
              newData.subLabel = `${matchedSuffix} - ${step.class_args.field_name}`
            } else {
              newData.subLabel = matchedSuffix
            }
          }

          newData.stepType = matchedSuffix || STEPS_TYPES.CUSTOM_STEP

          return newData
        }
      }
    }

    return {
      nodeType: ML_COMMON_NODE,
      stepType: STEPS_TYPES.CUSTOM_STEP,
      badgeIcon: <CustomStepIcon />
    }
  }

  return getNodeTypeDataByKind(step) || getNodeTypeDataByClass(step.class_name)
}
// descriptions for each step type from https://docs.mlrun.org/en/stable/serving/available-steps.html
const STEPS_DESCRIPTIONS = {
  [STEPS_TYPES.BATCH]:
    'Batches events. This step emits a batch every max_events events, or when timeout seconds have passed since the first event in the batch was received.',
  [STEPS_TYPES.CHOICE]: 'Redirects each input element into one of the multiple downstreams.',
  [STEPS_TYPES.EXTEND]: 'Adds fields to each incoming event.',
  [STEPS_TYPES.FLAT_MAP]: 'Maps, or transforms, each incoming event into any number of events.',
  [STEPS_TYPES.FLATTEN]: 'Flatten is equivalent to FlatMap(lambda x: x).',
  [STEPS_TYPES.MAP_WITH_STATE]:
    'Maps, or transforms, incoming events using a stateful user-provided function, and an initial state, which can be a database table.',
  [STEPS_TYPES.CHOICE_BY_FIELD]:
    'Routes events to downstream steps based on an event field that contains the step name or names.',
  [STEPS_TYPES.FOR_EACH]:
    'Applies the given function on each event in the stream, and passes the original event downstream.',
  [STEPS_TYPES.FILTER]: 'Filters events based on a user-provided function.',
  [STEPS_TYPES.SAMPLE_WINDOW]:
    'Emits a single event in a window of window_size events, in accordance with emit_period and emit_before_termination.',
  [STEPS_TYPES.MODEL_RUNNER]:
    'Runs multiple models on each event. When used in a graph, MLRun automatically imports the default language model class (LLModel) during function deployment.',
  [STEPS_TYPES.REMOTE_HTTP_STEP]: 'Class for calling remote HTTP endpoints.'
}

const BASE_OPERATORS_LIST = [
  STEPS_TYPES.BATCH,
  STEPS_TYPES.CHOICE,
  STEPS_TYPES.EXTEND,
  STEPS_TYPES.FILTER,
  STEPS_TYPES.FLAT_MAP,
  STEPS_TYPES.FLATTEN,
  STEPS_TYPES.FOR_EACH,
  STEPS_TYPES.MAP_WITH_STATE,
  STEPS_TYPES.SAMPLE_WINDOW
]

const getDetailsGeneralData = selectedStepData => [
  {
    label: 'Type:',
    value: selectedStepData.kind
  },
  {
    label: 'Class name:',
    value: selectedStepData.class_name
  },
  {
    label: 'Description:',
    value: selectedStepData.description,
    hidden: !selectedStepData.description
  },
  {
    label: 'Arguments:',
    value: selectedStepData.class_args,
    type: STEP_FIELD_TYPES.CODE_BLOCK,
    hidden: selectedStepData.stepType !== STEPS_TYPES.CUSTOM_STEP
  },
  {
    label: 'Function name:',
    value: selectedStepData.function
  },
  {
    label: 'Handler:',
    value: selectedStepData.handler,
    hidden: selectedStepData.stepType === STEPS_TYPES.MODEL_RUNNER
  },
  {
    label: 'Input path:',
    value: selectedStepData.input_path
  },
  {
    label: 'Result path:',
    value: selectedStepData.result_path
  },
  {
    label: 'Full event:',
    value: Boolean(selectedStepData.full_event), // TODO mapping full_event
    hidden: !BASE_OPERATORS_LIST.includes(selectedStepData.stepType)
  },
  {
    label: 'State:',
    value: selectedStepData.state, // TODO mapping state for MapWithKey
    hidden: selectedStepData.stepType !== STEPS_TYPES.MAP_WITH_STATE
  },
  {
    label: 'Group by key:',
    value: Boolean(selectedStepData.group_by_key), // TODO mapping state for group_by_key
    hidden: selectedStepData.stepType !== STEPS_TYPES.MAP_WITH_STATE
  },
  {
    label: 'Link:', // link to the step on mlrun hub
    value: selectedStepData.link, // TODO mapping state for link
    hidden: selectedStepData.stepType !== STEPS_TYPES.HUB_STEP
  },
  {
    label: 'Maximum allowed iterations:',
    value: selectedStepData.maxIterations,
    hidden: !selectedStepData.maxIterations
  },
  {
    label: 'Data store profiles:',
    value: selectedStepData.profile, // TODO mapping queue profiles
    hidden: selectedStepData.stepType !== STEPS_TYPES.QUEUE
  },
  {
    label: 'URL:',
    value: selectedStepData.class_args?.url,
    hidden: selectedStepData.stepType !== STEPS_TYPES.REMOTE_HTTP_STEP,
    type: STEP_FIELD_TYPES.COPY
  },
  {
    label: 'Method:',
    value: selectedStepData.class_args?.method,
    hidden: selectedStepData.stepType !== STEPS_TYPES.REMOTE_HTTP_STEP
  }
]

const getSubItemsData = selectedStepData => {
  switch (selectedStepData.stepType) {
    case STEPS_TYPES.MODEL_RUNNER:
      return {
        itemsTitle: 'Running models',
        items: mapValues(
          selectedStepData?.class_args?.monitoring_data ?? {},
          (runningModelData, runningModelName) => {
            return [
              {
                label: 'Model endpoint:',
                value: runningModelData.model_endpoint_uid,
                additionalData: {
                  modelEndpointName: runningModelName
                },
                type: 'pop-up'
              },
              {
                label: 'Model artifact:',
                value: runningModelData.model_path,
                type: 'pop-up'
              },
              {
                label: 'Class name:',
                value: runningModelData.model_class
              },
              {
                label: 'Input path:',
                value: runningModelData.input_path
              },
              {
                label: 'Result path:',
                value: runningModelData.result_path
              },
              {
                label: 'Outputs:',
                value: runningModelData.outputs?.join(', ') || ''
              },
              {
                label: 'Execution mechanism:',
                value:
                  selectedStepData?.class_args?.execution_mechanism_by_model_name?.[
                    runningModelName
                  ] ?? ''
              }
            ]
          }
        )
      }
    case STEPS_TYPES.ROUTER_STEP:
      return {
        itemsTitle: 'Routes',
        items: mapValues(selectedStepData?.routes ?? {}, (routeData, routeName) => {
          return [
            {
              label: 'Model endpoint:',
              value: routeData.class_args?.model_endpoint_uid,
              additionalData: {
                modelEndpointName: routeName
              },
              type: STEP_FIELD_TYPES.POP_UP
            },
            {
              label: 'Model artifact:',
              value: routeData.class_args?.model_path,
              type: STEP_FIELD_TYPES.POP_UP
            },
            {
              label: 'Class name:',
              value: routeData.class_name
            },
            {
              label: 'Input path:',
              value: routeData.input_path
            },
            {
              label: 'Result path:',
              value: routeData.result_path
            },
            {
              label: 'Outputs:',
              value: routeData.class_args?.outputs?.join(', ') || ''
            }
          ]
        })
      }
    default:
      return {
        itemsTitle: '',
        items: []
      }
  }
}

export const getStepDescriptionFields = (selectedStep, graph) => {
  const selectedStepData = {
    ...(selectedStep?.data || {}),
    ...(selectedStep?.data?.customData || {})
  }

  selectedStepData.description = STEPS_DESCRIPTIONS[selectedStepData.stepType] || ''

  if (graph.allow_cyclic && (selectedStepData.cycle_from?.length || selectedStepData.cycleTo)) {
    selectedStepData.maxIterations = selectedStepData.max_iterations || graph.max_iterations || ''
  }

  const detailsGeneralData = getDetailsGeneralData(selectedStepData)
  const subItemsData = getSubItemsData(selectedStepData)

  return {
    general: detailsGeneralData,
    subItemsData
  }
}

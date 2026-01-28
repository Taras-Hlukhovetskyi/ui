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
import { isEmpty } from 'lodash-es'
import {
  dataInitialState,
  EXTERNAL_OFFLINE,
  ONLINE,
  PARQUET,
  partitionRadioButtonsInitialState,
  selectedPartitionKindInitialState,
  selectedTargetKindInitialState,
  targetsPathEditDataInitialState,
  isShowAdvancedInitialState
} from './featureSetsPanelTargetStore.util'

export const initialState = {
  data: dataInitialState,
  selectedTargetKind: selectedTargetKindInitialState,
  selectedPartitionKind: selectedPartitionKindInitialState,
  showAdvanced: isShowAdvancedInitialState,
  partitionRadioButtonsState: partitionRadioButtonsInitialState,
  targetsPathEditData: targetsPathEditDataInitialState,
  passthroughtEnabled: false,
  previousTargets: {}
}

export const targetStoreActions = {
  UPDATE_DATA: 'UPDATE_DATA',
  SET_SELECTED_TARGET_KIND: 'SET_SELECTED_TARGET_KIND',
  SET_SELECTED_PARTITION_KIND: 'SET_SELECTED_PARTITION_KIND',
  SET_PARTITION_RADIO: 'SET_PARTITION_RADIO',
  SET_SHOW_ADVANCED: 'SET_SHOW_ADVANCED',
  SET_TARGETS_PATH_EDIT_DATA: 'SET_TARGETS_PATH_EDIT_DATA',
  SYNC_GENERATED_PATHS: 'SYNC_GENERATED_PATHS',
  ENABLE_PASSTHROUGH: 'ENABLE_PASSTHROUGH',
  DISABLE_PASSTHROUGH: 'DISABLE_PASSTHROUGH',
  RESTORE_TARGETS: 'RESTORE_TARGETS',
  CLEAR_TARGETS: 'CLEAR_TARGETS'
}

export const targetStoreReducer = (state, {type, payload}) => {
  switch (type) {
    case targetStoreActions.UPDATE_DATA:
      return {
        ...state,
        data: typeof payload === 'function' ? payload(state.data) : payload
      }
    case targetStoreActions.SET_SELECTED_TARGET_KIND:
      return {
        ...state,
        selectedTargetKind:
          typeof payload === 'function'
            ? payload(state.selectedTargetKind)
            : payload
      }
    case targetStoreActions.SET_SELECTED_PARTITION_KIND:
      return {
        ...state,
        selectedPartitionKind:
          typeof payload === 'function'
            ? payload(state.selectedPartitionKind)
            : payload
      }
    case targetStoreActions.SET_PARTITION_RADIO:
      return {
        ...state,
        partitionRadioButtonsState:
          typeof payload === 'function'
            ? payload(state.partitionRadioButtonsState)
            : payload
      }
    case targetStoreActions.SET_SHOW_ADVANCED:
      return {
        ...state,
        showAdvanced:
          typeof payload === 'function' ? payload(state.showAdvanced) : payload
      }
    case targetStoreActions.SET_TARGETS_PATH_EDIT_DATA:
      return {
        ...state,
        targetsPathEditData:
          typeof payload === 'function'
            ? payload(state.targetsPathEditData)
            : payload
      }

    case targetStoreActions.SYNC_GENERATED_PATHS: {
      const { onlinePath, parquetPath } = payload
      let newData = { ...state.data }
      let hasChanges = false

      if (
        !state.targetsPathEditData.online.isModified &&
        !state.targetsPathEditData.online.isEditMode &&
        newData.online.path !== onlinePath
      ) {
        newData.online = { ...newData.online, path: onlinePath }
        hasChanges = true
      }

      if (
        !state.targetsPathEditData.parquet.isModified &&
        !state.targetsPathEditData.parquet.isEditMode &&
        newData.parquet.path !== parquetPath
      ) {
        newData.parquet = { ...newData.parquet, path: parquetPath }
        hasChanges = true
      }

      return hasChanges ? { ...state, data: newData } : state
    }

    case targetStoreActions.ENABLE_PASSTHROUGH: {
      const { currentTargets } = payload
      return {
        ...state,
        previousTargets: {
          data: {
            ...state.data,
            [PARQUET]: {
              ...state.data[PARQUET],
              path: state.data[PARQUET].path
            },
            [ONLINE]: {
              ...state.data[ONLINE],
              path: state.data[ONLINE].path
            }
          },
          featureSetTargets: currentTargets,
          selectedPartitionKind: state.selectedPartitionKind,
          selectedTargetKind: state.selectedTargetKind,
          partitionRadioButtonsState: state.partitionRadioButtonsState
        },
        passthroughtEnabled: true
      }
    }

    case targetStoreActions.DISABLE_PASSTHROUGH:
      return { ...state, passthroughtEnabled: false }

    case targetStoreActions.RESTORE_TARGETS:
      if (isEmpty(state.previousTargets)) return state
      return {
        ...state,
        selectedTargetKind: state.previousTargets.selectedTargetKind,
        data: { ...state.previousTargets.data },
        selectedPartitionKind: { ...state.previousTargets.selectedPartitionKind },
        partitionRadioButtonsState: { ...state.previousTargets.partitionRadioButtonsState },
        previousTargets: {},
        passthroughtEnabled: false
      }

    case targetStoreActions.CLEAR_TARGETS: {
      const { keepOnlineTarget } = payload
      return {
        ...state,
        selectedTargetKind: keepOnlineTarget ? [ONLINE] : [],
        targetsPathEditData: {
          ...state.targetsPathEditData,
          [PARQUET]: { isEditMode: false, isModified: false },
          [EXTERNAL_OFFLINE]: { isEditMode: false, isModified: false },
          [ONLINE]: {
            isEditMode: false,
            isModified: keepOnlineTarget ? state.targetsPathEditData[ONLINE].isModified : false
          }
        },
        data: {
          ...state.data,
          [PARQUET]: { ...dataInitialState[PARQUET] },
          [EXTERNAL_OFFLINE]: { ...dataInitialState[EXTERNAL_OFFLINE] }
        },
        showAdvanced: {
          ...state.showAdvanced,
          [PARQUET]: false,
          [EXTERNAL_OFFLINE]: false
        },
        partitionRadioButtonsState: {
          ...state.partitionRadioButtonsState,
          [PARQUET]: 'districtKeys',
          [EXTERNAL_OFFLINE]: 'districtKeys'
        },
        selectedPartitionKind: {
          ...state.selectedPartitionKind,
          [PARQUET]: [...selectedPartitionKindInitialState[PARQUET]],
          [EXTERNAL_OFFLINE]: [...selectedPartitionKindInitialState[EXTERNAL_OFFLINE]]
        }
      }
    }

    default:
      return state
  }
}

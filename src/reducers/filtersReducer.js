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
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import {
  ARTIFACT_OTHER_TYPE,
  DATASET_TYPE,
  DATE_FILTER_ANY_TIME,
  FILTER_ALL_ITEMS,
  FILTER_MENU,
  FILTER_MENU_MODAL,
  GROUP_BY_NAME,
  MODEL_TYPE,
  SHOW_ITERATIONS,
  TAG_FILTER_LATEST,
} from '../constants'

const initialState = {
  saveFilters: false,
  dates: {
    value: DATE_FILTER_ANY_TIME,
    isPredefined: false,
    initialSelectedOptionId: ''
  },
  entities: '',
  groupBy: GROUP_BY_NAME,
  iter: SHOW_ITERATIONS,
  labels: '',
  name: '',
  project: '',
  state: FILTER_ALL_ITEMS,
  sortBy: '',
  tag: TAG_FILTER_LATEST,
  tagOptions: null,
  projectOptions: []
}

export const getFilterTagOptions = createAsyncThunk(
  'getFilterTagOptions',
  ({ dispatch, fetchTags, project, category, config }) => {
    const fetchTagsArguments = {
      project,
      category,
      config
    }
    const fetchTagsPromise =
      [ARTIFACT_OTHER_TYPE, MODEL_TYPE, DATASET_TYPE].includes(category) && dispatch
        ? dispatch(fetchTags(fetchTagsArguments)).unwrap()
        : fetchTags(fetchTagsArguments)

    return fetchTagsPromise.then(response => {
      if (response?.data) {
        return [...new Set(response.data.tags)].filter(option => option)
      }
    })
  }
)

const filtersSlice = createSlice({
  name: 'filtersStore',
  initialState,
  reducers: {
    removeFilters() {
      return initialState
    },
    resetFilter(state, action) {
      state[FILTER_MENU][action.payload].initialValues =
        initialState[FILTER_MENU][action.payload].initialValues
      state[FILTER_MENU][action.payload].values =
        initialState[FILTER_MENU][action.payload].initialValues
    },
    resetModalFilter(state, action) {
      state[FILTER_MENU_MODAL][action.payload].initialValues =
        initialState[FILTER_MENU_MODAL][action.payload].initialValues
      state[FILTER_MENU_MODAL][action.payload].values =
        initialState[FILTER_MENU_MODAL][action.payload].initialValues
    },
    setFilters(state, action) {
      for (let filterProp in action.payload) {
        state[filterProp] = action.payload[filterProp]
      }
    },
    setFilterProjectOptions(state, action) {
      state.projectOptions = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(getFilterTagOptions.fulfilled, (state, { payload }) => {
      state.tagOptions = payload
    })
  }
})

export const {
  removeFilters,
  resetFilter,
  resetModalFilter,
  setAllActionBarFiltersValues,
  setFilters,
  setFiltersValues,
  setModalFiltersValues,
  setModalFiltersInitialValues,
  setFilterProjectOptions
} = filtersSlice.actions

export default filtersSlice.reducer

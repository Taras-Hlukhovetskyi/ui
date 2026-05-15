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
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import functionsApi from '../api/functions-api'
import { largeResponseCatchHandler } from '../utils/largeResponseCatchHandler'
import { parseFunction } from '../utils/parseFunction'
import getState from '../utils/getState'
import { defaultPendingHandler, defaultRejectedHandler } from './redux.util'
import { FUNCTIONS_PAGE } from '../constants'
import {
  APPLICATION_STATUS,
  FAILED_API_STATES
} from '../nextGenComponents/pages/ApplicationsPage/applications.constants'

const initialState = {
  applications: [],
  loading: false,
  error: null,
  summary: {
    total: 0,
    running: 0,
    failed: 0,
    building: 0
  }
}

export const fetchApplications = createAsyncThunk(
  'fetchApplications',
  ({ project, filters = {}, config = {} }, thunkAPI) =>
    functionsApi
      .getApplications(project, filters, config)
      .then(({ data }) => ({
        funcs: (data.funcs ?? []).map(rawFunc => {
          const application = parseFunction(rawFunc, project)
          const apiState = rawFunc.status?.state
          const normalizedState =
            apiState === APPLICATION_STATUS.READY
              ? APPLICATION_STATUS.RUNNING
              : apiState
          return {
            ...application,
            state: getState(normalizedState, FUNCTIONS_PAGE, 'nuclioFunctions')
          }
        }),
        pagination: data.pagination ?? null
      }))
      .catch(error => {
        largeResponseCatchHandler(error, 'Failed to fetch applications', thunkAPI.dispatch)
        return thunkAPI.rejectWithValue(error)
      })
)

const applicationsSlice = createSlice({
  name: 'applicationsStore',
  initialState,
  reducers: {
    removeApplications(state) {
      state.applications = []
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchApplications.pending, defaultPendingHandler)
    builder.addCase(fetchApplications.fulfilled, (state, { payload }) => {
      const funcs = payload.funcs
      state.applications = funcs
      state.summary = {
        total: funcs.length,
        running: funcs.filter(app => app.state?.value === APPLICATION_STATUS.RUNNING).length,
        failed: funcs.filter(app => FAILED_API_STATES.includes(app.state?.value)).length,
        building: funcs.filter(app => app.state?.value === APPLICATION_STATUS.BUILDING).length
      }
      state.loading = false
      state.error = null
    })
    builder.addCase(fetchApplications.rejected, defaultRejectedHandler)
  }
})

export const { removeApplications } = applicationsSlice.actions

export default applicationsSlice.reducer

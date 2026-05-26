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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { isEmpty } from 'lodash'

import { getNuclioFuncState } from '../utils/getNuclioFuncState'
import getState from '../utils/getState'
import { parseFunction } from '../utils/parseFunction'
import { fetchFunctions, fetchFunction } from '../reducers/functionReducer'
import { fetchNuclioFunction, fetchNuclioFunctions, fetchProjectApiGateways } from '../reducers/nuclioReducer'
import {
  filterGatewaysByFunction,
  buildGatewayUrl
} from '../nextGenComponents/pages/ApplicationsPage/ApplicationDetails/ApiGateways/applicationApiGateways.util'
import { GATEWAY_RELATIONSHIP } from '../nextGenComponents/pages/ApplicationsPage/ApplicationDetails/applicationDetails.constants'
import {
  ERROR_STATE,
  FUNCTION_BUILDING_STATE,
  FUNCTION_READY_STATE,
  FUNCTION_RUNNING_STATE,
  FUNCTIONS_PAGE,
  UNHEALTHY_STATE
} from '../constants'

const NUCLIO_FUNCTIONS_STATE_KIND = 'nuclioFunctions'
const NUCLIO_OWNER_LABEL = 'iguazio.com/username'
const DEFAULT_ERROR_MESSAGE = 'Failed to fetch functions'

export const enrichFunctionsWithNuclio = (parsedFunctions, nuclioFunctionsMap, projectApiGateways = []) => {
  return parsedFunctions.map(func => {
    const nuclioKey = func.nuclio_name || `${func.project}-${func.name}`
    const nuclioFunc = nuclioFunctionsMap[nuclioKey] || {}

    const nuclioFuncState = !isEmpty(nuclioFunc)
      ? (getNuclioFuncState(nuclioFunc) || '').toLowerCase()
      : ''

    const state = nuclioFuncState || func.state?.value || ''
    const owner = nuclioFunc?.metadata?.labels?.[NUCLIO_OWNER_LABEL] ?? ''

    const applicationGateways = filterGatewaysByFunction(
      projectApiGateways, func.project, func.name, func.tag
    )

    const directUrls = []
    const indirectUrls = []

    for (const gateway of applicationGateways) {
      const url = buildGatewayUrl(gateway)
      if (!url) continue

      if (gateway.relationship === GATEWAY_RELATIONSHIP.DIRECT) {
        directUrls.push(url)
      } else {
        indirectUrls.push(url)
      }
    }

    if (directUrls.length === 0 && indirectUrls.length === 0) {
      indirectUrls.push(...(func.external_invocation_urls ?? []))
    }

    return {
      ...func,
      state: getState(state, FUNCTIONS_PAGE, NUCLIO_FUNCTIONS_STATE_KIND),
      owner,
      nuclioFunc,
      applicationGateways,
      directUrls,
      indirectUrls
    }
  })
}

export const computeCounters = functions => {
  let running = 0
  let failed = 0
  let building = 0

  for (const func of functions) {
    const stateValue = func.state?.value
    if (stateValue === FUNCTION_READY_STATE || stateValue === FUNCTION_RUNNING_STATE) {
      running += 1
    } else if (stateValue === ERROR_STATE || stateValue === UNHEALTHY_STATE) {
      failed += 1
    } else if (stateValue === FUNCTION_BUILDING_STATE) {
      building += 1
    }
  }

  return { total: functions.length, running, failed, building }
}

const resolveNuclioMap = nuclioResult =>
  nuclioResult.status === 'fulfilled' ? (nuclioResult.value ?? {}) : {}

/**
 * @hook useNuclioEnrichedFunctions
 *
 * Dual-fetches MLRun + Nuclio functions, enriches with live state/owner,
 * applies optional client-side filtering, and computes counters.
 *
 * Uses fetchFunctions/fetchFunction from functionReducer internally.
 * If the Nuclio request fails, MLRun data is still returned without Nuclio enrichment.
 *
 * @param {Object}   config
 * @param {string}   config.projectName        - Current project name
 * @param {Object}   [config.filters]          - Current filter state for client-side filtering
 * @param {Function} [config.filterFn]         - (enrichedFunctions, filters) => filteredArray
 * @param {Function} [config.buildFetchConfig] - (filters) => thunkConfig. When provided the hook
 *   auto-fetches on mount using current filters. Must be a stable reference (useCallback with []).
 * @param {string}   [config.errorMessage]     - Custom error message for the list fetch
 */
export const useNuclioEnrichedFunctions = ({
  projectName,
  filters,
  filterFn,
  buildFetchConfig,
  enrichApiGateways = false,
  errorMessage = DEFAULT_ERROR_MESSAGE
}) => {
  const dispatch = useDispatch()
  const nuclioListControllerRef = useRef(null)
  const mlrunListControllerRef = useRef(null)
  const mlrunSingleControllerRef = useRef(null)
  const nuclioSingleControllerRef = useRef(null)
  const gatewaysListControllerRef = useRef(null)
  const [enrichedFunctions, setEnrichedFunctions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(null)

  useEffect(() => {
    const controllers = [
      nuclioListControllerRef,
      mlrunListControllerRef,
      mlrunSingleControllerRef,
      nuclioSingleControllerRef,
      gatewaysListControllerRef
    ]
    return () => {
      controllers.forEach(ref => ref.current?.abort())
    }
  }, [])

  const fetchAllNuclioFunctions = useCallback(
    signal =>
      dispatch(
        fetchNuclioFunctions({
          project: projectName,
          signal,
          getOriginalData: true
        })
      ).unwrap(),
    [dispatch, projectName]
  )

  const parseListResponse = useCallback(
    data => (data?.funcs ?? []).map(rawFunc => parseFunction(rawFunc, projectName)),
    [projectName]
  )

  const fetchGatewaysList = useCallback(
    signal =>
      dispatch(
        fetchProjectApiGateways({ project: projectName, signal })
      ).unwrap(),
    [dispatch, projectName]
  )

  const fetchData = useCallback(
    (thunkConfig = {}) => {
      mlrunListControllerRef.current?.abort()
      mlrunListControllerRef.current = new AbortController()
      nuclioListControllerRef.current?.abort()
      nuclioListControllerRef.current = new AbortController()
      gatewaysListControllerRef.current?.abort()
      gatewaysListControllerRef.current = new AbortController()

      const mlrunController = mlrunListControllerRef.current

      setIsLoading(true)

      const config = {
        ...thunkConfig.config,
        ui: {
          ...thunkConfig.config?.ui,
          controller: mlrunController
        }
      }

      const promises = [
        dispatch(fetchFunctions({ project: projectName, errorMessage, ...thunkConfig, config }))
          .unwrap()
          .then(parseListResponse),
        fetchAllNuclioFunctions(nuclioListControllerRef.current.signal)
      ]

      if (enrichApiGateways) {
        promises.push(fetchGatewaysList(gatewaysListControllerRef.current.signal))
      }

      return Promise.allSettled(promises)
        .then(([mlrunResult, nuclioResult, gatewaysResult]) => {
          if (mlrunController.signal.aborted) return

          if (mlrunResult.status === 'fulfilled' && mlrunResult.value) {
            const nuclioMap = resolveNuclioMap(nuclioResult)
            const gateways = gatewaysResult?.status === 'fulfilled'
              ? (gatewaysResult.value ?? [])
              : []
            const enriched = enrichFunctionsWithNuclio(mlrunResult.value, nuclioMap, gateways)
            setEnrichedFunctions(enriched)
          }
        })
        .finally(() => {
          if (!mlrunController.signal.aborted) {
            setIsLoading(false)
          }
        })
    },
    [dispatch, projectName, errorMessage, parseListResponse, fetchAllNuclioFunctions, enrichApiGateways, fetchGatewaysList]
  )

  useEffect(() => {
    if (buildFetchConfig && hasFetched !== projectName) {
      setHasFetched(projectName)
      fetchData(buildFetchConfig(filters))
    }
  }, [fetchData, buildFetchConfig, filters, hasFetched, projectName])

  const { filteredData, counters } = useMemo(() => {
    const filtered = filterFn ? filterFn(enrichedFunctions, filters) : enrichedFunctions
    return { filteredData: filtered, counters: computeCounters(filtered) }
  }, [enrichedFunctions, filters, filterFn])

  const fetchSingleEnrichedFunction = useCallback(
    ({ name, hash, tag, nuclioName }) => {
      mlrunSingleControllerRef.current?.abort()
      mlrunSingleControllerRef.current = new AbortController()
      nuclioSingleControllerRef.current?.abort()
      nuclioSingleControllerRef.current = new AbortController()
      gatewaysListControllerRef.current?.abort()
      gatewaysListControllerRef.current = new AbortController()

      const mlrunController = mlrunSingleControllerRef.current
      const resolvedNuclioName = nuclioName || `${projectName}-${name}`

      const promises = [
        dispatch(
          fetchFunction({
            project: projectName,
            name,
            hash,
            tag,
            signal: mlrunController.signal
          })
        )
          .unwrap()
          .then(rawFunc => (rawFunc ? parseFunction(rawFunc, projectName) : null)),
        dispatch(
          fetchNuclioFunction({
            project: projectName,
            name: resolvedNuclioName,
            signal: nuclioSingleControllerRef.current.signal
          })
        ).unwrap()
      ]

      if (enrichApiGateways) {
        promises.push(fetchGatewaysList(gatewaysListControllerRef.current.signal))
      }

      return Promise.allSettled(promises).then(([mlrunResult, nuclioResult, gatewaysResult]) => {
        if (mlrunController.signal.aborted) return null
        if (mlrunResult.status !== 'fulfilled' || !mlrunResult.value) return null

        const parsed = mlrunResult.value
        const nuclioFuncData =
          nuclioResult.status === 'fulfilled' && nuclioResult.value ? nuclioResult.value : null
        const nuclioMap = nuclioFuncData ? { [resolvedNuclioName]: nuclioFuncData } : {}
        const gateways = gatewaysResult?.status === 'fulfilled'
          ? (gatewaysResult.value ?? [])
          : []
        const [enriched] = enrichFunctionsWithNuclio([parsed], nuclioMap, gateways)

        return enriched
      })
    },
    [dispatch, projectName, enrichApiGateways, fetchGatewaysList]
  )

  return {
    fetchData,
    fetchSingleEnrichedFunction,
    enrichedFunctions,
    filteredData,
    counters,
    isLoading
  }
}

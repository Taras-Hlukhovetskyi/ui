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
import { useLayoutEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { mapValues, isNil } from 'lodash'
import { setAllActionBarFiltersValues, setFilters } from '../reducers/filtersReducer'
import { ITERATIONS_FILTER, SHOW_ITERATIONS } from '../constants'
import { useSearchParams } from 'react-router-dom'

const defaultParamsParsingCallback = ([, value]) => value

export const useInitialFiltersFromQueryParams = (
  filtersConfig,
  paramsParsingCallback = defaultParamsParsingCallback
) => {
  const dispatch = useDispatch()
  const [queryParams] = useSearchParams()
  const [filters, setFilters] = useState(mapValues(filtersConfig, config => config.initialValue))

  useLayoutEffect(() => {
    // if (queryParams.size) {
      const parsedFiltersValue = queryParams.size ? Object.fromEntries(
        queryParams
          .entries()
          .filter(([paramName]) => paramName in filtersConfig)
          .map(([paramName, paramValue]) => {
            const externalParsedValue = paramsParsingCallback([paramName, paramValue])

            if (externalParsedValue !== paramValue) {
              return [paramName, externalParsedValue]
            }

            if (paramName === ITERATIONS_FILTER) {
              return [paramName, paramValue === SHOW_ITERATIONS ? SHOW_ITERATIONS : '']
            }

            return [paramName, paramValue]
          })
          .filter(([, paramValue]) => !isNil(paramValue))
      ) : {}

      setFilters({
        ...mapValues(filtersConfig, config => config.initialValue),
        ...parsedFiltersValue
      })
    // }
  }, [dispatch, filtersConfig, paramsParsingCallback, queryParams])

  return filters
}

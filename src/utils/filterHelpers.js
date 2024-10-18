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

import { generateTypeFilter, jobsStatuses } from '../components/FilterMenu/filterMenu.settings'

export const getValidJobsStatusListByStatusParam = statusParam => {
  const validStatusList = statusParam
    ?.split(',')
    .filter(status => jobsStatuses.find(jobStatus => jobStatus.id === status))

  return validStatusList?.length ? validStatusList : null
}

export const getValidJobsTypeFilterByTypeParam = typeParam => {
  console.log(generateTypeFilter().find(type => type.id === typeParam))
  return generateTypeFilter().find(type => type.id === typeParam)?.id
}

// const updateQueryFilters = (filters, initialFilters) => {
//   const queryParams = new URLSearchParams(window.location.search)

//   if (filters) {
//     for (const [parameterName, parameterValue] of Object.entries(filters)) {
//       if (
//         !isEqual(
//           initialFilters,
//           parameterValue
//         )
//       ) {
//         if (parameterName === DATES_FILTER) {
//           queryParams.set(
//             parameterName,
//             parameterValue.initialSelectedOptionId === CUSTOM_RANGE_DATE_OPTION
//               ? parameterValue.value.map(date => new Date(date).getTime()).join('-')
//               : parameterValue.initialSelectedOptionId
//           )
//         } else {
//           queryParams.set(parameterName, parameterValue)
//         }
//       } else {
//         queryParams.delete(parameterName)
//       }

//       window.history.replaceState(null, null, `?${queryParams.toString()}`)
//     }
//   }

//   return { payload }
// }

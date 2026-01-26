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
import { useCallback, useState, useMemo } from 'react'
import { isEmpty, isNumber, orderBy } from 'lodash-es'

import ArrowIcon from 'igz-controls/images/back-arrow.svg?react'

export const useSortTable = ({ headers, content, sortConfig = {} }) => {
  const {
    allowSortBy = null,
    excludeSortBy = null,
    defaultSortBy = null,
    defaultDirection = 'asc'
  } = sortConfig

  const initialSortColumn = useMemo(() => {
    if (defaultSortBy === null) return ''

    return isNumber(defaultSortBy) && headers[defaultSortBy]
      ? headers[defaultSortBy].headerId
      : defaultSortBy
  }, [defaultSortBy, headers])

  const [direction, setDirection] = useState(defaultDirection || '')
  const [selectedColumnName, setSelectedColumnName] = useState(initialSortColumn)

  const isDateValid = date => {
    const dateString = String(date)

    if (Date.parse(dateString)) {
      return !(dateString.match(/-/g) && !dateString.split('-').every(char => isNumber(char)))
    }

    return false
  }

  const getValueByType = useCallback(
    columnIndex => rowData => {
      const rowDataContent = rowData.content ? rowData.content : rowData

      if (
        rowDataContent[columnIndex] instanceof Object &&
        Object.keys(rowDataContent[columnIndex]).length
      ) {
        let valueToTest = rowDataContent[columnIndex].value

        if (!isEmpty(valueToTest) || isNumber(valueToTest)) {
          if (valueToTest instanceof Array && valueToTest.length > 0) {
            if (valueToTest[0].match(/:/g)) {
              return valueToTest[0].split(':')[0].trim()
            }

            return valueToTest[0]
          } else if (typeof valueToTest === 'string' && isDateValid(valueToTest)) {
            return new Date(valueToTest)
          } else {
            return valueToTest
          }
        }
      }

      return isNumber(parseFloat(rowData[columnIndex]))
        ? parseFloat(rowData[columnIndex])
        : isDateValid(rowData[columnIndex])
          ? new Date(rowData[columnIndex])
          : rowData[columnIndex]
    },
    []
  )

  const isSortableByIndex = useCallback(() => {
    return isNumber(allowSortBy) || isNumber(excludeSortBy)
      ? true
      : Array.isArray(allowSortBy)
        ? allowSortBy.every(allowedIndex => isNumber(allowedIndex))
        : Array.isArray(excludeSortBy)
          ? excludeSortBy.every(allowedIndex => isNumber(allowedIndex))
          : false
  }, [allowSortBy, excludeSortBy])

  const isSortable = useCallback(
    (item, itemIdx, sortByIndex) => {
      if (!item) return false
      if (item === defaultSortBy || itemIdx === defaultSortBy) return true

      let isSortableItem = false

      if (sortByIndex) {
        if (!isEmpty(allowSortBy) || isNumber(allowSortBy)) {
          if (Array.isArray(allowSortBy)) {
            isSortableItem = allowSortBy.includes(itemIdx)
          } else {
            isSortableItem = itemIdx === allowSortBy
          }
        }
        if (!isEmpty(excludeSortBy) || isNumber(excludeSortBy)) {
          if (Array.isArray(excludeSortBy)) {
            isSortableItem = !excludeSortBy.includes(itemIdx)
          } else {
            isSortableItem = itemIdx !== excludeSortBy
          }
        }
      } else {
        if (!allowSortBy && !excludeSortBy) return true

        if (allowSortBy) {
          if (Array.isArray(allowSortBy)) isSortableItem = allowSortBy.includes(item)
          else isSortableItem = item === allowSortBy
        }
        if (excludeSortBy) {
          if (Array.isArray(excludeSortBy)) isSortableItem = !excludeSortBy.includes(item)
          else isSortableItem = item !== excludeSortBy
        }
      }
      return isSortableItem
    },
    [allowSortBy, defaultSortBy, excludeSortBy]
  )

  const sortedTableHeaders = useMemo(() => {
    if (!headers || headers.length === 0) return []
    if (!excludeSortBy && !allowSortBy) return headers

    const isSortByIndex = isSortableByIndex()

    return headers.map((headerItem, idx) => {
      const clearHeaderPrefix = String(headerItem.headerLabel)
        .replace(/^.+\./, '')
        .toLocaleLowerCase()

      return {
        ...headerItem,
        isSortable: headerItem.headerLabel
          ? isSortable(clearHeaderPrefix, idx, isSortByIndex)
          : false
      }
    })
  }, [headers, allowSortBy, excludeSortBy, isSortableByIndex, isSortable])

  const sortedTableContent = useMemo(() => {
    if (isEmpty(content) || !selectedColumnName || !direction) {
      return content
    }

    const columnIndex = headers.findIndex(header => header.headerId === selectedColumnName)

    if (columnIndex === -1) return content

    return orderBy(content, getValueByType(columnIndex), direction)
  }, [content, selectedColumnName, direction, headers, getValueByType])

  const sortTable = useCallback(
    (columnName, existingDirection) => {
      const newDirection = existingDirection
        ? existingDirection
        : columnName === selectedColumnName && direction === 'asc'
          ? 'desc'
          : 'asc'

      setSelectedColumnName(columnName)
      setDirection(newDirection)
    },
    [selectedColumnName, direction]
  )

  const getSortingIcon = headerId => {
    return (
      <ArrowIcon
        className={`sort-icon ${
          selectedColumnName === headerId && direction === 'asc' ? 'sort-icon_up' : 'sort-icon_down'
        }`}
      />
    )
  }

  return {
    sortTable,
    selectedColumnName,
    getSortingIcon,
    sortedTableContent,
    sortedTableHeaders
  }
}

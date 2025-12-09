import PropTypes from 'prop-types'
import { useMemo, useEffect, useRef } from 'react'

import { Tooltip, TextTooltipTemplate } from 'igz-controls/components'
import { generateTimeOptions, is12HourFormat } from './TimePicker.utils'

function TimePickerOptions({ handleInputChange = () => {} }) {
  const optionsWrapperRef = useRef()
  const timeOptions = useMemo(() => generateTimeOptions(is12HourFormat()), [])

  useEffect(() => {
    // per figma show list from 06:00 AM
    const beginningOption = optionsWrapperRef.current?.querySelector(':scope > div:nth-of-type(13)')

    if (beginningOption) {
      beginningOption.scrollIntoView()
    }
  }, [])

  return (
    <div ref={optionsWrapperRef}>
      {timeOptions.map(option => {
        return (
          <div
            key={option}
            className={'time-picker__dropdown-item'}
            onClick={() => handleInputChange(option)}
          >
            <Tooltip template={<TextTooltipTemplate text={option} />}>
              <span>{option}</span>
            </Tooltip>
          </div>
        )
      })}
    </div>
  )
}

TimePickerOptions.propTypes = {
  handleInputChange: PropTypes.func
}

export default TimePickerOptions

import moment from 'moment'

export function is12HourFormat() {
  const locale = navigator.language
  const options = new Intl.DateTimeFormat(locale, {
    hour: 'numeric'
  }).resolvedOptions()

  return options.hour12
}

export function generateTimeOptions(is12HourFormat = false) {
  const times = []
  const interval = 30
  const current = moment().startOf('day')
  const end = current.clone().add(1, 'day')

  while (current.isBefore(end)) {
    times.push(current.format(is12HourFormat ? 'hh:mm A' : 'HH:mm'))
    current.add(interval, 'minutes')
  }

  return times
}
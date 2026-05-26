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
import React, { useMemo } from 'react'

import DetailsInfoTable from '../../../../shared/DetailsInfoTable/DetailsInfoTable'
import LabelWithTooltip from './LabelWithTooltip'
import {
  BASIC_SETTINGS_FIELD,
  CONFIGURATION_ITEM_ID,
  DESCRIPTION_TOOLTIP_TEXT
} from './applicationConfiguration.constants'
import { getBasicSettingsItems } from './applicationConfiguration.util'
import { applicationShape } from './applicationConfiguration.propTypes'

const BasicSettingsSection = ({ application }) => {
  const items = useMemo(() => {
    const rawItems = getBasicSettingsItems(application)

    return rawItems.map(item => {
      if (item.label === BASIC_SETTINGS_FIELD.DESCRIPTION) {
        return { ...item, id: CONFIGURATION_ITEM_ID.DESCRIPTION, label: <LabelWithTooltip label={item.label} tooltipText={DESCRIPTION_TOOLTIP_TEXT} /> }
      }
      return item
    })
  }, [application])

  return <DetailsInfoTable items={items} />
}

BasicSettingsSection.propTypes = {
  application: applicationShape.isRequired
}

export default BasicSettingsSection
